import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateServiceDto, UpsertServiceDto } from "./service.dto";

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  list(includeInactive = false) {
    return this.prisma.service.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: { name: "asc" }
    });
  }

  async create(dto: UpsertServiceDto) {
    try {
      return await this.prisma.service.create({
        data: {
          name: dto.name,
          description: dto.description,
          isActive: dto.isActive ?? true
        }
      });
    } catch (error) {
      this.handleUniqueNameError(error);
    }
  }

  async update(id: string, dto: UpdateServiceDto) {
    try {
      return await this.prisma.service.update({
        where: { id },
        data: {
          name: dto.name,
          description: dto.description,
          isActive: dto.isActive
        }
      });
    } catch (error) {
      this.handleKnownError(error);
    }
  }

  private handleKnownError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new NotFoundException("Serviço não encontrado.");
    }

    this.handleUniqueNameError(error);
  }

  private handleUniqueNameError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new BadRequestException("Já existe um serviço com esse nome.");
    }

    throw error;
  }
}
