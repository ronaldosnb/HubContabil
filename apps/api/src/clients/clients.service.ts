import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ClientType, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateClientContactDto,
  CreateClientDto,
  CreateClientServiceDto,
  ListClientsQueryDto,
  UpdateClientContactDto,
  UpdateClientDto,
  UpdateClientServiceDto
} from "./client.dto";

const clientInclude = {
  internalResponsible: {
    select: { id: true, name: true, email: true }
  },
  contacts: {
    orderBy: [{ isMain: "desc" as const }, { createdAt: "asc" as const }]
  },
  services: {
    include: { service: true },
    orderBy: { createdAt: "asc" as const }
  },
  _count: {
    select: {
      tasks: {
        where: {
          status: { in: ["TODO", "IN_PROGRESS", "WAITING_CLIENT"] }
        }
      },
      documents: {
        where: { status: "PENDING" }
      }
    }
  }
} satisfies Prisma.ClientInclude;

@Injectable()
export class ClientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService
  ) {}

  async list(query: ListClientsQueryDto) {
    const where: Prisma.ClientWhereInput = {
      status: query.status,
      type: query.type,
      internalResponsibleId: query.responsibleUserId,
      OR: query.search
        ? [
            { name: { contains: query.search, mode: "insensitive" } },
            { legalName: { contains: query.search, mode: "insensitive" } },
            { tradeName: { contains: query.search, mode: "insensitive" } },
            { documentNumber: { contains: query.search, mode: "insensitive" } }
          ]
        : undefined
    };

    return this.prisma.client.findMany({
      where,
      include: clientInclude,
      orderBy: { name: "asc" }
    });
  }

  async get(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        ...clientInclude,
        activityLogs: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            user: {
              select: { id: true, name: true }
            }
          }
        },
        documentSends: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            document: { select: { id: true, title: true, category: true } },
            channels: true,
            createdBy: { select: { id: true, name: true } }
          }
        },
        tasks: {
          orderBy: [{ status: "asc" }, { dueDate: "asc" }],
          take: 20,
          include: {
            department: true,
            responsibleUser: { select: { id: true, name: true } },
            document: { select: { id: true, title: true } }
          }
        },
        documents: {
          orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
          take: 20
        }
      }
    });

    if (!client) {
      throw new NotFoundException("Cliente não encontrado.");
    }

    return client;
  }

  async create(dto: CreateClientDto, userId: string) {
    const client = await this.prisma.client.create({
      data: {
        ...this.toClientData(dto),
        activityLogs: {
          create: {
            userId,
            entityType: "Client",
            entityId: "pending",
            action: "CLIENT_CREATED",
            description: `Cliente ${dto.name} criado.`
          }
        }
      }
    });

    await this.prisma.activityLog.updateMany({
      where: { clientId: client.id, entityType: "Client", entityId: "pending" },
      data: { entityId: client.id }
    });

    return this.get(client.id);
  }

  async update(id: string, dto: UpdateClientDto, userId: string) {
    await this.ensureClient(id);

    await this.prisma.client.update({
      where: { id },
      data: this.toClientData(dto)
    });

    await this.log(id, userId, "CLIENT_UPDATED", "Dados cadastrais do cliente atualizados.");

    return this.get(id);
  }

  async lookupCnpj(cnpj: string) {
    const documentNumber = onlyDigits(cnpj);

    if (documentNumber.length !== 14) {
      throw new BadRequestException("Informe um CNPJ com 14 dígitos.");
    }

    const configuredBaseUrl = this.config.get<string>("API_CNPJ")?.trim();
    const baseUrl = configuredBaseUrl || "https://publica.cnpj.ws/cnpj";
    const url = `${baseUrl.replace(/\/$/, "")}/${documentNumber}`;
    let response: Response;

    try {
      response = await fetch(url, { method: "GET" });
    } catch {
      throw new BadGatewayException("Não foi possível consultar a CNPJWS.");
    }

    if (response.status === 404) {
      throw new NotFoundException("CNPJ não encontrado na CNPJWS.");
    }

    if (response.status === 429) {
      throw new ServiceUnavailableException("Limite de consultas da CNPJWS atingido.");
    }

    if (!response.ok) {
      throw new BadGatewayException("A CNPJWS retornou erro ao consultar o CNPJ.");
    }

    const data = (await response.json()) as CnpjWsResponse;
    const establishment = data.estabelecimento;
    const primaryActivity = formatActivity(establishment?.atividade_principal);
    const stateRegistration = selectStateRegistration(establishment);
    const phone = [establishment?.ddd1, establishment?.telefone1].filter(Boolean).join(" ");
    const updatedAt = new Date().toISOString();
    const notes = buildCnpjNotes(data, stateRegistration);

    return {
      type: ClientType.COMPANY,
      name: data.razao_social ?? establishment?.nome_fantasia ?? "",
      legalName: data.razao_social ?? "",
      tradeName: establishment?.nome_fantasia ?? "",
      documentNumber,
      taxRegime: data.simples?.simples === "Sim" ? "Simples Nacional" : "",
      openingDate: establishment?.data_inicio_atividade ?? "",
      registrationStatus: establishment?.situacao_cadastral ?? "",
      stateRegistration: stateRegistration?.inscricao_estadual ?? "",
      companySize: data.porte?.descricao ?? "",
      legalNature: data.natureza_juridica?.descricao ?? "",
      mainActivity: primaryActivity ?? "",
      addressLine: establishment?.logradouro ?? "",
      addressNumber: establishment?.numero ?? "",
      addressComplement: establishment?.complemento ?? "",
      district: establishment?.bairro ?? "",
      city: establishment?.cidade?.nome ?? "",
      state: establishment?.estado?.sigla ?? "",
      zipCode: establishment?.cep ?? "",
      businessEmail: establishment?.email ?? "",
      businessPhone: phone,
      cnpjwsUpdatedAt: updatedAt,
      notes
    };
  }

  async remove(id: string, userId: string) {
    await this.ensureClient(id);
    await this.log(id, userId, "CLIENT_DELETED", "Cliente removido.");
    await this.prisma.client.delete({ where: { id } });

    return { deleted: true };
  }

  async createContact(clientId: string, dto: CreateClientContactDto, userId: string) {
    await this.ensureClient(clientId);

    const contact = await this.prisma.$transaction(async (tx) => {
      if (dto.isMain) {
        await tx.clientContact.updateMany({
          where: { clientId },
          data: { isMain: false }
        });
      }

      return tx.clientContact.create({
        data: {
          clientId,
          name: dto.name,
          roleDescription: dto.roleDescription,
          email: dto.email,
          phone: dto.phone,
          whatsapp: dto.whatsapp,
          isMain: dto.isMain,
          preferredChannel: dto.preferredChannel
        }
      });
    });

    await this.log(clientId, userId, "CLIENT_CONTACT_CREATED", `Contato ${contact.name} criado.`);

    return contact;
  }

  async updateContact(
    clientId: string,
    contactId: string,
    dto: UpdateClientContactDto,
    userId: string
  ) {
    await this.ensureContact(clientId, contactId);

    const contact = await this.prisma.$transaction(async (tx) => {
      if (dto.isMain) {
        await tx.clientContact.updateMany({
          where: { clientId, id: { not: contactId } },
          data: { isMain: false }
        });
      }

      return tx.clientContact.update({
        where: { id: contactId },
        data: {
          name: dto.name,
          roleDescription: dto.roleDescription,
          email: dto.email,
          phone: dto.phone,
          whatsapp: dto.whatsapp,
          isMain: dto.isMain,
          preferredChannel: dto.preferredChannel
        }
      });
    });

    await this.log(clientId, userId, "CLIENT_CONTACT_UPDATED", `Contato ${contact.name} atualizado.`);

    return contact;
  }

  async removeContact(clientId: string, contactId: string, userId: string) {
    await this.ensureContact(clientId, contactId);
    await this.prisma.clientContact.delete({ where: { id: contactId } });
    await this.log(clientId, userId, "CLIENT_CONTACT_DELETED", "Contato removido.");

    return { deleted: true };
  }

  async attachService(clientId: string, dto: CreateClientServiceDto, userId: string) {
    await this.ensureClient(clientId);

    const service = await this.prisma.service.findFirst({
      where: { id: dto.serviceId, isActive: true }
    });

    if (!service) {
      throw new NotFoundException("Serviço não encontrado.");
    }

    const clientService = await this.prisma.clientService.upsert({
      where: { clientId_serviceId: { clientId, serviceId: dto.serviceId } },
      create: {
        clientId,
        serviceId: dto.serviceId,
        isActive: dto.isActive ?? true,
        notes: dto.notes
      },
      update: {
        isActive: dto.isActive ?? true,
        notes: dto.notes
      },
      include: { service: true }
    });

    await this.log(clientId, userId, "CLIENT_SERVICE_ATTACHED", `Serviço ${service.name} vinculado.`);

    return clientService;
  }

  async updateService(
    clientId: string,
    clientServiceId: string,
    dto: UpdateClientServiceDto,
    userId: string
  ) {
    await this.ensureClientService(clientId, clientServiceId);

    const clientService = await this.prisma.clientService.update({
      where: { id: clientServiceId },
      data: {
        isActive: dto.isActive,
        notes: dto.notes
      },
      include: { service: true }
    });

    await this.log(
      clientId,
      userId,
      "CLIENT_SERVICE_UPDATED",
      `Serviço ${clientService.service.name} atualizado.`
    );

    return clientService;
  }

  async removeService(clientId: string, clientServiceId: string, userId: string) {
    await this.ensureClientService(clientId, clientServiceId);
    await this.prisma.clientService.delete({ where: { id: clientServiceId } });
    await this.log(clientId, userId, "CLIENT_SERVICE_REMOVED", "Serviço contratado removido.");

    return { deleted: true };
  }

  private async ensureClient(id: string) {
    const client = await this.prisma.client.findUnique({ where: { id }, select: { id: true } });

    if (!client) {
      throw new NotFoundException("Cliente não encontrado.");
    }

    return client;
  }

  private async ensureContact(clientId: string, contactId: string) {
    const contact = await this.prisma.clientContact.findFirst({
      where: { id: contactId, clientId },
      select: { id: true }
    });

    if (!contact) {
      throw new NotFoundException("Contato não encontrado.");
    }

    return contact;
  }

  private async ensureClientService(clientId: string, clientServiceId: string) {
    const clientService = await this.prisma.clientService.findFirst({
      where: { id: clientServiceId, clientId },
      select: { id: true }
    });

    if (!clientService) {
      throw new NotFoundException("Serviço contratado não encontrado.");
    }

    return clientService;
  }

  private async log(clientId: string, userId: string, action: string, description: string) {
    await this.prisma.activityLog.create({
      data: {
        clientId,
        userId,
        entityType: "Client",
        entityId: clientId,
        action,
        description
      }
    });
  }

  private toClientData(dto: CreateClientDto | UpdateClientDto): Prisma.ClientUncheckedCreateInput {
    return {
      type: dto.type,
      name: dto.name,
      legalName: dto.legalName,
      tradeName: dto.tradeName,
      documentNumber: dto.documentNumber,
      taxRegime: dto.taxRegime,
      openingDate: toDate(dto.openingDate),
      registrationStatus: dto.registrationStatus,
      stateRegistration: dto.stateRegistration,
      companySize: dto.companySize,
      legalNature: dto.legalNature,
      mainActivity: dto.mainActivity,
      addressLine: dto.addressLine,
      addressNumber: dto.addressNumber,
      addressComplement: dto.addressComplement,
      district: dto.district,
      city: dto.city,
      state: dto.state,
      zipCode: dto.zipCode,
      businessEmail: dto.businessEmail,
      businessPhone: dto.businessPhone,
      cnpjwsUpdatedAt: toDate(dto.cnpjwsUpdatedAt),
      status: dto.status,
      internalResponsibleId: dto.internalResponsibleId,
      notes: dto.notes
    };
  }
}

type CnpjWsResponse = {
  razao_social?: string;
  capital_social?: string;
  atualizado_em?: string;
  responsavel_federativo?: string;
  porte?: { descricao?: string };
  natureza_juridica?: { descricao?: string };
  qualificacao_do_responsavel?: { descricao?: string };
  socios?: Array<{
    nome?: string;
    tipo?: string;
    qualificacao_socio?: { descricao?: string };
  }>;
  simples?: {
    simples?: string;
    mei?: string;
    data_opcao_simples?: string;
    data_exclusao_simples?: string;
    data_opcao_mei?: string;
    data_exclusao_mei?: string;
  };
  estabelecimento?: {
    tipo?: string;
    nome_fantasia?: string;
    data_inicio_atividade?: string;
    data_situacao_cadastral?: string;
    situacao_cadastral?: string;
    motivo_situacao_cadastral?: string;
    situacao_especial?: string;
    data_situacao_especial?: string;
    email?: string;
    ddd1?: string;
    telefone1?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cep?: string;
    cidade?: { nome?: string };
    estado?: { sigla?: string };
    atividade_principal?: CnpjWsActivity;
    atividades_secundarias?: CnpjWsActivity[];
    inscricoes_estaduais?: CnpjWsStateRegistration[];
  };
};

type CnpjWsActivity = {
  id?: string;
  subclasse?: string;
  descricao?: string;
};

type CnpjWsStateRegistration = {
  inscricao_estadual?: string;
  ativo?: boolean;
  atualizado_em?: string;
  estado?: {
    sigla?: string;
    nome?: string;
  };
};

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function toDate(value?: string) {
  return value ? new Date(value) : undefined;
}

function formatActivity(activity?: CnpjWsActivity) {
  if (!activity?.descricao) {
    return "";
  }

  const code = activity.subclasse || activity.id;
  return code ? `${code} - ${activity.descricao}` : activity.descricao;
}

function selectStateRegistration(establishment?: CnpjWsResponse["estabelecimento"]) {
  const registrations = establishment?.inscricoes_estaduais ?? [];
  const state = establishment?.estado?.sigla;

  return (
    registrations.find(
      (registration) => registration.ativo && registration.estado?.sigla === state
    ) ??
    registrations.find((registration) => registration.ativo) ??
    registrations[0]
  );
}

function buildCnpjNotes(
  data: CnpjWsResponse,
  selectedStateRegistration?: CnpjWsStateRegistration
) {
  const establishment = data.estabelecimento;
  const lines: string[] = [];
  const secondaryActivities = establishment?.atividades_secundarias
    ?.map(formatActivity)
    .filter(Boolean);
  const otherRegistrations = establishment?.inscricoes_estaduais
    ?.filter(
      (registration) =>
        registration.inscricao_estadual &&
        registration.inscricao_estadual !== selectedStateRegistration?.inscricao_estadual
    )
    .map(
      (registration) =>
        `${registration.estado?.sigla ?? "UF"}: ${registration.inscricao_estadual} (${registration.ativo ? "ativa" : "inativa"})`
    );
  const partners = data.socios
    ?.filter((partner) => partner.nome)
    .slice(0, 5)
    .map((partner) =>
      [partner.nome, partner.qualificacao_socio?.descricao || partner.tipo]
        .filter(Boolean)
        .join(" - ")
    );

  if (data.capital_social) {
    lines.push(`Capital social: ${formatCurrency(data.capital_social)}.`);
  }

  if (data.qualificacao_do_responsavel?.descricao) {
    lines.push(
      `Qualificação do responsável: ${data.qualificacao_do_responsavel.descricao.trim()}.`
    );
  }

  if (data.responsavel_federativo) {
    lines.push(`Responsável federativo: ${data.responsavel_federativo.trim()}.`);
  }

  if (data.simples?.simples || data.simples?.mei) {
    const simpleParts = [
      data.simples.simples ? `Simples: ${data.simples.simples}` : "",
      data.simples.mei ? `MEI: ${data.simples.mei}` : "",
      data.simples.data_opcao_simples
        ? `opção Simples em ${formatDate(data.simples.data_opcao_simples)}`
        : "",
      data.simples.data_exclusao_simples
        ? `exclusão Simples em ${formatDate(data.simples.data_exclusao_simples)}`
        : "",
      data.simples.data_opcao_mei ? `opção MEI em ${formatDate(data.simples.data_opcao_mei)}` : "",
      data.simples.data_exclusao_mei
        ? `exclusão MEI em ${formatDate(data.simples.data_exclusao_mei)}`
        : ""
    ].filter(Boolean);
    lines.push(simpleParts.join("; ") + ".");
  }

  if (establishment?.data_situacao_cadastral) {
    lines.push(`Data da situação cadastral: ${formatDate(establishment.data_situacao_cadastral)}.`);
  }

  if (establishment?.motivo_situacao_cadastral) {
    lines.push(`Motivo da situação cadastral: ${establishment.motivo_situacao_cadastral}.`);
  }

  if (establishment?.situacao_especial) {
    lines.push(
      `Situação especial: ${establishment.situacao_especial}${
        establishment.data_situacao_especial
          ? ` em ${formatDate(establishment.data_situacao_especial)}`
          : ""
      }.`
    );
  }

  if (secondaryActivities?.length) {
    lines.push(`Atividades secundárias: ${secondaryActivities.join("; ")}.`);
  }

  if (otherRegistrations?.length) {
    lines.push(`Outras inscrições estaduais: ${otherRegistrations.join("; ")}.`);
  }

  if (partners?.length) {
    lines.push(`Sócios/QSA: ${partners.join("; ")}.`);
  }

  if (data.atualizado_em) {
    lines.push(`Cadastro CNPJWS atualizado em: ${formatDate(data.atualizado_em)}.`);
  }

  return lines.join("\n");
}

function formatCurrency(value: string) {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return value;
  }

  return number.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}
