import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ClientType } from "@prisma/client";
import { Queue } from "bullmq";
import { QUEUE_NAMES } from "@hubcontabil/shared";
import { PrismaService } from "../prisma/prisma.service";

type DasEmitJobData = {
  clientId: string;
  cnpj: string;
  triggeredByUserId: string;
};

@Injectable()
export class MeiService {
  private readonly dasQueue: Queue<DasEmitJobData>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService
  ) {
    this.dasQueue = new Queue<DasEmitJobData>(QUEUE_NAMES.DAS_EMIT, {
      connection: {
        host: this.config.get<string>("REDIS_HOST", "localhost"),
        port: Number(this.config.get<string>("REDIS_PORT", "6379")),
        maxRetriesPerRequest: null
      }
    });
  }

  async emitDasForClient(clientId: string, triggeredByUserId: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, name: true, type: true, documentNumber: true }
    });

    if (!client) throw new NotFoundException("Cliente não encontrado.");
    if (client.type !== ClientType.MEI) throw new BadRequestException("Cliente não é MEI.");
    if (!client.documentNumber) throw new BadRequestException("CNPJ não cadastrado para este cliente.");

    const cnpj = client.documentNumber.replace(/\D/g, "");
    await this.dasQueue.add("emit-das", { clientId: client.id, cnpj, triggeredByUserId });

    return { queued: true, clientName: client.name };
  }

  async emitDasForAll(triggeredByUserId: string) {
    const clients = await this.prisma.client.findMany({
      where: { type: ClientType.MEI, documentNumber: { not: null } },
      select: { id: true, documentNumber: true }
    });

    await Promise.all(
      clients.map((c) =>
        this.dasQueue.add("emit-das", {
          clientId: c.id,
          cnpj: c.documentNumber!.replace(/\D/g, ""),
          triggeredByUserId
        })
      )
    );

    return { queued: true, count: clients.length };
  }

  async getLatestDas(clientId: string) {
    return this.prisma.document.findFirst({
      where: { clientId, category: "Guias de impostos", title: { startsWith: "DAS " } },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, competence: true, createdAt: true, originalFileName: true }
    });
  }

  async getAllLatestDas() {
    const clients = await this.prisma.client.findMany({
      where: { type: ClientType.MEI },
      select: {
        id: true,
        name: true,
        documents: {
          where: { category: "Guias de impostos", title: { startsWith: "DAS " } },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { id: true, title: true, createdAt: true }
        }
      }
    });

    return clients
      .filter((c) => c.documents.length > 0)
      .map((c) => ({
        clientId: c.id,
        clientName: c.name,
        documentId: c.documents[0].id,
        title: c.documents[0].title
      }));
  }
}
