import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
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
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListClientsQueryDto) {
    const where: Prisma.ClientWhereInput = {
      status: query.status,
      type: query.type,
      internalResponsibleId: query.responsibleUserId,
      OR: query.search
        ? [
            { name: { contains: query.search, mode: "insensitive" } },
            { legalName: { contains: query.search, mode: "insensitive" } },
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
        type: dto.type,
        name: dto.name,
        legalName: dto.legalName,
        documentNumber: dto.documentNumber,
        taxRegime: dto.taxRegime,
        status: dto.status,
        internalResponsibleId: dto.internalResponsibleId,
        notes: dto.notes,
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
      data: {
        type: dto.type,
        name: dto.name,
        legalName: dto.legalName,
        documentNumber: dto.documentNumber,
        taxRegime: dto.taxRegime,
        status: dto.status,
        internalResponsibleId: dto.internalResponsibleId,
        notes: dto.notes
      }
    });

    await this.log(id, userId, "CLIENT_UPDATED", "Dados cadastrais do cliente atualizados.");

    return this.get(id);
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
}
