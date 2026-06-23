import { Injectable } from "@nestjs/common";
import {
  ClientStatus,
  DocumentSendStatus,
  DocumentStatus,
  TaskStatus
} from "@prisma/client";
import { DashboardSummary } from "@hubcontabil/shared";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(): Promise<DashboardSummary> {
    const now = new Date();
    const dueSoonLimit = new Date(now);
    dueSoonLimit.setDate(dueSoonLimit.getDate() + 7);

    const [
      openTasks,
      overdueTasks,
      pendingDocumentsToSend,
      failedSends,
      documentsDueSoon,
      activeClients
    ] = await Promise.all([
      this.prisma.task.count({
        where: { status: { in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.WAITING_CLIENT] } }
      }),
      this.prisma.task.count({
        where: {
          status: { in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.WAITING_CLIENT] },
          dueDate: { lt: now }
        }
      }),
      this.prisma.document.count({ where: { status: DocumentStatus.PENDING } }),
      this.prisma.documentSend.count({
        where: { status: { in: [DocumentSendStatus.ERROR, DocumentSendStatus.PARTIAL_ERROR] } }
      }),
      this.prisma.document.count({
        where: {
          dueDate: { gte: now, lte: dueSoonLimit },
          status: { in: [DocumentStatus.PENDING, DocumentStatus.SENT] }
        }
      }),
      this.prisma.client.count({ where: { status: ClientStatus.ACTIVE } })
    ]);

    return {
      openTasks,
      overdueTasks,
      pendingDocumentsToSend,
      failedSends,
      documentsDueSoon,
      activeClients
    };
  }
}
