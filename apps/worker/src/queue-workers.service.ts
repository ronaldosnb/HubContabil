import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { readFile } from "fs/promises";
import { basename, isAbsolute, join, normalize } from "path";
import {
  DocumentSendStatus,
  SendChannelStatus,
  TaskStatus
} from "@prisma/client";
import { ConnectionOptions, Job, Worker } from "bullmq";
import { Resend } from "resend";
import { QUEUE_NAMES } from "@hubcontabil/shared";
import { PrismaWorkerService } from "./worker-prisma.service";

type SendJobData = {
  documentSendChannelId: string;
};

type WorkerSettings = {
  emailFromName: string;
  emailFromAddress: string;
  wppconnectSession: string;
};

@Injectable()
export class QueueWorkersService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueWorkersService.name);
  private connection!: ConnectionOptions;
  private workers: Worker[] = [];
  private recurringInterval?: NodeJS.Timeout;
  private resend?: Resend;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaWorkerService
  ) {}

  onModuleInit() {
    const resendApiKey = this.config.get<string>("RESEND_API_KEY");

    if (resendApiKey) {
      this.resend = new Resend(resendApiKey);
    }

    this.connection = {
      host: this.config.get<string>("REDIS_HOST", "localhost"),
      port: Number(this.config.get<string>("REDIS_PORT", "6379")),
      maxRetriesPerRequest: null
    };

    this.workers = [
      new Worker(QUEUE_NAMES.EMAIL_SEND, (job) => this.processEmail(job), {
        connection: this.connection
      }),
      new Worker(QUEUE_NAMES.WHATSAPP_SEND, (job) => this.processWhatsapp(job), {
        connection: this.connection
      }),
      new Worker(QUEUE_NAMES.RECURRING_TASKS, () => this.processRecurringTasks(), {
        connection: this.connection
      })
    ];

    this.recurringInterval = setInterval(() => {
      void this.processRecurringTasks();
    }, 60_000);
  }

  async onModuleDestroy() {
    if (this.recurringInterval) {
      clearInterval(this.recurringInterval);
    }

    await Promise.all(this.workers.map((worker) => worker.close()));
  }

  private async processEmail(job: Job<SendJobData>) {
    const channel = await this.prisma.documentSendChannel.findUnique({
      where: { id: job.data.documentSendChannelId },
      include: {
        documentSend: {
          include: {
            document: true
          }
        }
      }
    });

    if (!channel) {
      this.logger.warn(`Canal de envio inexistente: ${job.data.documentSendChannelId}`);
      return;
    }

    if (!this.resend) {
      await this.markChannelError(channel.id, "RESEND_API_KEY não configurado.");
      return;
    }

    if (!channel.recipientEmail) {
      await this.markChannelError(channel.id, "Destinatário de e-mail ausente.");
      return;
    }

    const document = channel.documentSend.document;
    const settings = await this.getSettings();
    const file = await readFile(this.getStoragePath(document.storagePath));
    const result = await this.resend.emails.send({
      from: `${settings.emailFromName} <${settings.emailFromAddress}>`,
      to: channel.recipientEmail,
      subject: channel.documentSend.messageSubject ?? document.title,
      text: channel.documentSend.messageBody,
      attachments: [
        {
          filename: document.originalFileName,
          content: file
        }
      ]
    });

    if (result.error) {
      await this.markChannelError(channel.id, result.error.message);
      return;
    }

    this.logger.log(`E-mail enviado para o canal ${channel.id}.`);
    await this.prisma.documentSendChannel.update({
      where: { id: channel.id },
      data: {
        status: SendChannelStatus.SENT,
        sentAt: new Date(),
        providerMessageId: result.data?.id,
        errorMessage: null
      }
    });
    await this.refreshDocumentSendStatus(channel.documentSendId);
  }

  private async processWhatsapp(job: Job<SendJobData>) {
    const channel = await this.prisma.documentSendChannel.findUnique({
      where: { id: job.data.documentSendChannelId },
      include: {
        documentSend: {
          include: {
            document: true
          }
        }
      }
    });

    if (!channel) {
      this.logger.warn(`Canal de envio inexistente: ${job.data.documentSendChannelId}`);
      return;
    }

    const token = this.config.get<string>("WPPCONNECT_TOKEN");
    const baseUrl = this.config.get<string>("WPPCONNECT_BASE_URL");
    const settings = await this.getSettings();
    const session = settings.wppconnectSession;

    if (!token || !baseUrl || !session) {
      await this.markChannelError(channel.id, "WPPCONNECT_TOKEN não configurado.");
      return;
    }

    if (!channel.recipientWhatsapp) {
      await this.markChannelError(channel.id, "Destinatário de WhatsApp ausente.");
      return;
    }

    const document = channel.documentSend.document;
    const file = await readFile(this.getStoragePath(document.storagePath));
    const endpointPath = this.config
      .get<string>("WPPCONNECT_SEND_FILE_PATH", "/api/{session}/send-file-base64")
      .replace("{session}", encodeURIComponent(session));
    const response = await fetch(`${baseUrl}${endpointPath}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        phone: channel.recipientWhatsapp,
        message: channel.documentSend.messageBody,
        filename: document.originalFileName,
        base64: file.toString("base64")
      })
    });

    if (!response.ok) {
      const body = await response.text();
      await this.markChannelError(
        channel.id,
        `WPPConnect retornou ${response.status}: ${body.slice(0, 500)}`
      );
      return;
    }

    const responseBody: unknown = await response.json().catch(() => null);

    this.logger.log(`WhatsApp enviado para o canal ${channel.id}.`);
    await this.prisma.documentSendChannel.update({
      where: { id: channel.id },
      data: {
        status: SendChannelStatus.SENT,
        sentAt: new Date(),
        providerMessageId: this.extractProviderMessageId(responseBody),
        errorMessage: null
      }
    });
    await this.refreshDocumentSendStatus(channel.documentSendId);
  }

  private async processRecurringTasks() {
    const now = new Date();
    const dueRules = await this.prisma.recurringTask.findMany({
      where: { isActive: true, nextRunAt: { lte: now } }
    });

    for (const rule of dueRules) {
      if (!rule.responsibleUserId) {
        this.logger.warn(`Recorrência ${rule.id} ignorada: responsável ausente.`);
        continue;
      }

      await this.prisma.task.create({
        data: {
          title: rule.title,
          description: rule.description,
          clientId: rule.clientId,
          departmentId: rule.departmentId,
          responsibleUserId: rule.responsibleUserId,
          createdByUserId: rule.responsibleUserId,
          status: TaskStatus.TODO,
          isRecurringInstance: true,
          recurringTaskId: rule.id
        }
      });

      await this.prisma.recurringTask.update({
        where: { id: rule.id },
        data: { nextRunAt: this.calculateNextRunAt(rule.recurrenceRule, new Date()) }
      });

      await this.prisma.activityLog.create({
        data: {
          clientId: rule.clientId,
          userId: rule.responsibleUserId,
          entityType: "RecurringTask",
          entityId: rule.id,
          action: "RECURRING_TASK_GENERATED",
          description: `Tarefa ${rule.title} gerada automaticamente.`
        }
      });
    }
  }

  private calculateNextRunAt(rule: string, fromDate: Date) {
    const next = new Date(fromDate);

    if (rule === "DAILY") {
      next.setDate(next.getDate() + 1);
      return next;
    }

    if (rule === "WEEKLY") {
      next.setDate(next.getDate() + 7);
      return next;
    }

    if (rule === "MONTHLY") {
      return this.addMonthsClamped(fromDate, fromDate.getDate());
    }

    if (rule.startsWith("MONTHLY_DAY:")) {
      const day = Number(rule.split(":")[1]);
      return this.addMonthsClamped(fromDate, day);
    }

    return this.addMonthsClamped(fromDate, fromDate.getDate());
  }

  private addMonthsClamped(fromDate: Date, preferredDay: number) {
    const target = new Date(fromDate);
    target.setFullYear(fromDate.getFullYear(), fromDate.getMonth() + 1, 1);
    target.setDate(
      Math.min(preferredDay, new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate())
    );
    return target;
  }

  private async markChannelError(channelId: string, errorMessage: string) {
    const channel = await this.prisma.documentSendChannel.update({
      where: { id: channelId },
      data: {
        status: SendChannelStatus.ERROR,
        errorMessage
      }
    });

    await this.refreshDocumentSendStatus(channel.documentSendId);
  }

  private async refreshDocumentSendStatus(documentSendId: string) {
    const channels = await this.prisma.documentSendChannel.findMany({
      where: { documentSendId }
    });

    const hasError = channels.some((channel) => channel.status === SendChannelStatus.ERROR);
    const allError = channels.every((channel) => channel.status === SendChannelStatus.ERROR);
    const allSent = channels.every((channel) => channel.status === SendChannelStatus.SENT);
    const status = allSent
      ? DocumentSendStatus.SENT
      : allError
        ? DocumentSendStatus.ERROR
        : hasError
        ? DocumentSendStatus.PARTIAL_ERROR
        : DocumentSendStatus.PROCESSING;

    await this.prisma.documentSend.update({
      where: { id: documentSendId },
      data: {
        status,
        sentAt: allSent ? new Date() : undefined
      }
    });
  }

  private getStoragePath(storagePath: string) {
    const root = this.config.get<string>("STORAGE_ROOT", "./storage");
    const normalized = normalize(storagePath);

    if (normalized.startsWith("..") || isAbsolute(normalized)) {
      throw new Error(`Caminho de arquivo inválido: ${basename(storagePath)}`);
    }

    return join(root, normalized);
  }

  private async getSettings(): Promise<WorkerSettings> {
    const stored = await this.prisma.systemSetting.findUnique({
      where: { key: "general" }
    });
    const value = this.isRecord(stored?.value) ? stored.value : {};

    return {
      emailFromName: this.stringOrConfig(
        value.emailFromName,
        this.config.get<string>("RESEND_FROM_NAME", "Equipe do escritório")
      ),
      emailFromAddress: this.stringOrConfig(
        value.emailFromAddress,
        this.config.get<string>("RESEND_FROM_EMAIL", "contato@example.com")
      ),
      wppconnectSession: this.stringOrConfig(
        value.wppconnectSession,
        this.config.get<string>("WPPCONNECT_SESSION", "default")
      )
    };
  }

  private extractProviderMessageId(responseBody: unknown) {
    if (!this.isRecord(responseBody)) {
      return undefined;
    }

    const id = responseBody.id ?? responseBody.messageId;
    if (typeof id === "string") {
      return id;
    }

    const response = responseBody.response;
    if (this.isRecord(response) && typeof response.id === "string") {
      return response.id;
    }

    return undefined;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
  }

  private stringOrConfig(value: unknown, fallback: string) {
    return typeof value === "string" && value.trim() ? value : fallback;
  }
}
