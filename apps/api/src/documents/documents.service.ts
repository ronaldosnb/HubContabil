import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { DocumentStatus, Prisma } from "@prisma/client";
import { DOCUMENT_CATEGORIES } from "@hubcontabil/shared";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService, UploadedFileInput } from "../storage/storage.types";
import {
  CreateDocumentDto,
  ListDocumentsQueryDto,
  UpdateDocumentDto
} from "./document.dto";

const includeDocument = {
  client: {
    select: {
      id: true,
      name: true,
      documentNumber: true
    }
  },
  uploadedBy: {
    select: {
      id: true,
      name: true,
      email: true
    }
  },
  _count: {
    select: {
      sends: true
    }
  }
} satisfies Prisma.DocumentInclude;

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService
  ) {}

  list(query: ListDocumentsQueryDto) {
    const now = new Date();
    const dueSoonLimit = new Date(now);
    dueSoonLimit.setDate(dueSoonLimit.getDate() + 7);

    const where: Prisma.DocumentWhereInput = {
      clientId: query.clientId,
      category: query.category,
      status: query.pendingToSend === "true" ? DocumentStatus.PENDING : query.status,
      competence: query.competence,
      OR: query.search
        ? [
            { title: { contains: query.search, mode: "insensitive" } },
            { description: { contains: query.search, mode: "insensitive" } },
            { client: { name: { contains: query.search, mode: "insensitive" } } }
          ]
        : undefined,
      dueDate:
        query.dueSoon === "true"
          ? { gte: now, lte: dueSoonLimit }
          : query.dueFrom || query.dueTo
            ? {
                gte: query.dueFrom ? new Date(query.dueFrom) : undefined,
                lte: query.dueTo ? new Date(query.dueTo) : undefined
              }
            : undefined
    };

    return this.prisma.document.findMany({
      where,
      include: includeDocument,
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }]
    });
  }

  async get(id: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
      include: includeDocument
    });

    if (!document) {
      throw new NotFoundException("Documento não encontrado.");
    }

    return document;
  }

  async create(dto: CreateDocumentDto, file: UploadedFileInput | undefined, userId: string) {
    if (!file) {
      throw new BadRequestException("Arquivo obrigatório.");
    }

    this.validateCategory(dto.category);

    const client = await this.prisma.client.findUnique({
      where: { id: dto.clientId },
      select: { id: true, name: true }
    });

    if (!client) {
      throw new NotFoundException("Cliente não encontrado.");
    }

    const saved = await this.storage.saveFile({ clientId: dto.clientId, file });

    const document = await this.prisma.document.create({
      data: {
        clientId: dto.clientId,
        uploadedByUserId: userId,
        category: dto.category,
        title: dto.title,
        description: dto.description,
        originalFileName: saved.originalFileName,
        storedFileName: saved.storedFileName,
        storagePath: saved.storagePath,
        mimeType: saved.mimeType,
        size: saved.size,
        competence: dto.competence,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        amount: this.parseAmount(dto.amount),
        status: dto.status ?? DocumentStatus.PENDING
      }
    });

    await this.log(
      dto.clientId,
      userId,
      document.id,
      "DOCUMENT_CREATED",
      `Documento ${document.title} anexado.`
    );

    return this.get(document.id);
  }

  async update(id: string, dto: UpdateDocumentDto, userId: string) {
    const existing = await this.get(id);

    if (dto.category) {
      this.validateCategory(dto.category);
    }

    await this.prisma.document.update({
      where: { id },
      data: {
        category: dto.category,
        title: dto.title,
        description: dto.description,
        competence: dto.competence,
        dueDate:
          dto.dueDate === undefined ? undefined : dto.dueDate ? new Date(dto.dueDate) : null,
        amount:
          dto.amount === undefined ? undefined : dto.amount ? this.parseAmount(dto.amount) : null,
        status: dto.status
      }
    });

    await this.log(
      existing.clientId,
      userId,
      id,
      "DOCUMENT_UPDATED",
      "Metadados do documento atualizados."
    );

    return this.get(id);
  }

  async remove(id: string, userId: string) {
    const document = await this.get(id);

    await this.prisma.document.delete({ where: { id } });
    await this.storage.deleteFile(document.storagePath);
    await this.log(
      document.clientId,
      userId,
      id,
      "DOCUMENT_DELETED",
      `Documento ${document.title} removido.`
    );

    return { deleted: true };
  }

  async download(id: string) {
    const document = await this.get(id);
    const file = await this.storage.getFile(document.storagePath);

    return { document, file };
  }

  private validateCategory(category: string) {
    if (!DOCUMENT_CATEGORIES.includes(category as (typeof DOCUMENT_CATEGORIES)[number])) {
      throw new BadRequestException("Categoria de documento inválida.");
    }
  }

  private parseAmount(amount?: string) {
    if (amount === undefined || amount === "") {
      return undefined;
    }

    const normalized = amount.replace(/\./g, "").replace(",", ".");
    const value = Number(normalized);

    if (Number.isNaN(value) || value < 0) {
      throw new BadRequestException("Valor do documento inválido.");
    }

    return new Prisma.Decimal(value);
  }

  private async log(
    clientId: string,
    userId: string,
    documentId: string,
    action: string,
    description: string
  ) {
    await this.prisma.activityLog.create({
      data: {
        clientId,
        userId,
        entityType: "Document",
        entityId: documentId,
        action,
        description
      }
    });
  }
}
