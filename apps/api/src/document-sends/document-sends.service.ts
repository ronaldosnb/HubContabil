import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import {
  DocumentSendStatus,
  DocumentStatus,
  Prisma,
  SendChannel,
  SendChannelStatus
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { SystemSettings } from "../settings/settings.constants";
import { SettingsService } from "../settings/settings.service";
import {
  CreateDocumentSendDto,
  ListDocumentSendsQueryDto,
  PreviewDocumentSendDto
} from "./document-send.dto";
import { SendQueueService } from "./send-queue.service";

const includeSend = {
  document: {
    select: {
      id: true,
      title: true,
      category: true,
      competence: true,
      dueDate: true,
      amount: true,
      originalFileName: true
    }
  },
  client: {
    select: {
      id: true,
      name: true,
      documentNumber: true,
      contacts: true
    }
  },
  createdBy: {
    select: { id: true, name: true, email: true }
  },
  reviewedBy: {
    select: { id: true, name: true, email: true }
  },
  channels: {
    orderBy: { createdAt: "asc" as const }
  }
} satisfies Prisma.DocumentSendInclude;

@Injectable()
export class DocumentSendsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: SendQueueService,
    private readonly settings: SettingsService
  ) {}

  list(query: ListDocumentSendsQueryDto) {
    const where: Prisma.DocumentSendWhereInput = {
      clientId: query.clientId,
      documentId: query.documentId,
      status:
        query.errorOnly === "true"
          ? { in: [DocumentSendStatus.ERROR, DocumentSendStatus.PARTIAL_ERROR] }
          : query.status,
      channels: query.channel ? { some: { channel: query.channel } } : undefined,
      createdAt:
        query.dateFrom || query.dateTo
          ? {
              gte: query.dateFrom ? new Date(query.dateFrom) : undefined,
              lte: query.dateTo ? new Date(query.dateTo) : undefined
            }
          : undefined
    };

    return this.prisma.documentSend.findMany({
      where,
      include: includeSend,
      orderBy: { createdAt: "desc" }
    });
  }

  async get(id: string) {
    const send = await this.prisma.documentSend.findUnique({
      where: { id },
      include: includeSend
    });

    if (!send) {
      throw new NotFoundException("Envio não encontrado.");
    }

    return send;
  }

  async preview(dto: PreviewDocumentSendDto, userId: string) {
    const document = await this.getDocument(dto.documentId);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true }
    });
    const settings = await this.settings.get();
    const recipient = dto.recipientContactId
      ? document.client.contacts.find((contact) => contact.id === dto.recipientContactId)
      : document.client.contacts.find((contact) => contact.isMain) ?? document.client.contacts[0];
    const useWhatsappTemplate =
      dto.channels?.length === 1 && dto.channels.includes(SendChannel.WHATSAPP);

    return {
      recipient: recipient
        ? {
            id: recipient.id,
            name: recipient.name,
            email: recipient.email,
            whatsapp: recipient.whatsapp,
            preferredChannel: recipient.preferredChannel
          }
        : null,
      messageSubject: this.render(settings.emailSubjectTemplate, document, settings, user?.name),
      messageBody: this.render(
        useWhatsappTemplate ? settings.whatsappBodyTemplate : settings.emailBodyTemplate,
        document,
        settings,
        user?.name
      )
    };
  }

  async create(dto: CreateDocumentSendDto, userId: string) {
    if (!dto.reviewed) {
      throw new BadRequestException("A revisão humana é obrigatória antes do envio.");
    }

    const uniqueChannels = [...new Set(dto.channels)];

    if (uniqueChannels.length === 0) {
      throw new BadRequestException("Selecione ao menos um canal.");
    }

    const document = await this.getDocument(dto.documentId);
    const recipientContact = dto.recipientContactId
      ? document.client.contacts.find((contact) => contact.id === dto.recipientContactId)
      : undefined;
    const recipient = {
      name: dto.recipient?.name || recipientContact?.name || document.client.name,
      email: dto.recipient?.email || recipientContact?.email || undefined,
      whatsapp: dto.recipient?.whatsapp || recipientContact?.whatsapp || undefined
    };

    if (uniqueChannels.includes(SendChannel.EMAIL) && !recipient.email) {
      throw new BadRequestException("Informe um e-mail para envio por e-mail.");
    }

    if (uniqueChannels.includes(SendChannel.WHATSAPP) && !recipient.whatsapp) {
      throw new BadRequestException("Informe um WhatsApp para envio por WhatsApp.");
    }

    const send = await this.prisma.$transaction(async (tx) => {
      const created = await tx.documentSend.create({
        data: {
          documentId: document.id,
          clientId: document.clientId,
          createdByUserId: userId,
          reviewedByUserId: userId,
          messageSubject: dto.messageSubject,
          messageBody: dto.messageBody,
          sendEmail: uniqueChannels.includes(SendChannel.EMAIL),
          sendWhatsapp: uniqueChannels.includes(SendChannel.WHATSAPP),
          status: DocumentSendStatus.PROCESSING,
          channels: {
            create: uniqueChannels.map((channel) => ({
              channel,
              recipientName: recipient.name,
              recipientEmail: channel === SendChannel.EMAIL ? recipient.email : undefined,
              recipientWhatsapp:
                channel === SendChannel.WHATSAPP ? recipient.whatsapp : undefined,
              status: SendChannelStatus.PENDING
            }))
          }
        },
        include: { channels: true }
      });

      await tx.document.update({
        where: { id: document.id },
        data: { status: DocumentStatus.SENT }
      });

      await tx.activityLog.create({
        data: {
          clientId: document.clientId,
          userId,
          entityType: "DocumentSend",
          entityId: created.id,
          action: "DOCUMENT_SEND_CREATED",
          description: `Envio do documento ${document.title} confirmado.`
        }
      });

      return created;
    });

    for (const channel of send.channels) {
      await this.queue.add(channel.channel, channel.id);
    }

    return this.get(send.id);
  }

  async resend(id: string, userId: string) {
    const send = await this.get(id);

    const pendingChannels = send.channels.filter((channel) =>
      channel.status === SendChannelStatus.ERROR ||
      channel.status === SendChannelStatus.CANCELED
    );

    if (pendingChannels.length === 0) {
      throw new BadRequestException("Não há canais com erro ou cancelados para reenviar.");
    }

    await this.prisma.documentSend.update({
      where: { id },
      data: {
        status: DocumentSendStatus.PROCESSING,
        channels: {
          updateMany: pendingChannels.map((channel) => ({
            where: { id: channel.id },
            data: {
              status: SendChannelStatus.RETRYING,
              errorMessage: null
            }
          }))
        }
      }
    });

    await this.prisma.activityLog.create({
      data: {
        clientId: send.clientId,
        userId,
        entityType: "DocumentSend",
        entityId: id,
        action: "DOCUMENT_SEND_RETRY",
        description: `Reenvio do documento ${send.document.title} solicitado.`
      }
    });

    for (const channel of pendingChannels) {
      await this.queue.add(channel.channel, channel.id);
    }

    return this.get(id);
  }

  async cancel(id: string, userId: string) {
    const send = await this.get(id);

    if (
      send.status !== DocumentSendStatus.PENDING &&
      send.status !== DocumentSendStatus.PROCESSING
    ) {
      throw new BadRequestException("Apenas envios pendentes ou em processamento podem ser cancelados.");
    }

    await this.prisma.documentSend.update({
      where: { id },
      data: {
        status: DocumentSendStatus.CANCELED,
        channels: {
          updateMany: {
            where: { status: { in: [SendChannelStatus.PENDING, SendChannelStatus.RETRYING] } },
            data: { status: SendChannelStatus.CANCELED }
          }
        }
      }
    });

    await this.prisma.activityLog.create({
      data: {
        clientId: send.clientId,
        userId,
        entityType: "DocumentSend",
        entityId: id,
        action: "DOCUMENT_SEND_CANCELED",
        description: `Envio do documento ${send.document.title} cancelado.`
      }
    });

    return this.get(id);
  }

  private async getDocument(documentId: string) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: {
        client: {
          include: {
            contacts: { orderBy: [{ isMain: "desc" }, { createdAt: "asc" }] }
          }
        }
      }
    });

    if (!document) {
      throw new NotFoundException("Documento não encontrado.");
    }

    return document;
  }

  private render(
    template: string,
    document: Awaited<ReturnType<DocumentSendsService["getDocument"]>>,
    settings: SystemSettings,
    userName?: string
  ) {
    const formatDate = document.dueDate
      ? document.dueDate.toLocaleDateString("pt-BR")
      : "não informado";
    const amount = document.amount
      ? new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL"
        }).format(Number(document.amount))
      : "não informado";

    return template
      .replaceAll("{nome_cliente}", document.client.name)
      .replaceAll("{documento}", document.title)
      .replaceAll("{categoria}", document.category)
      .replaceAll("{competencia}", document.competence ?? "não informada")
      .replaceAll("{vencimento}", formatDate)
      .replaceAll("{valor}", amount)
      .replaceAll("{nome_escritorio}", settings.officeName)
      .replaceAll("{nome_usuario}", userName ?? "Usuário");
  }
}
