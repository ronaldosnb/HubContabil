import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateDepartmentDto, UpsertDepartmentDto } from "./department.dto";

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  list(includeInactive = false) {
    return this.prisma.department.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: { name: "asc" }
    });
  }

  async create(dto: UpsertDepartmentDto) {
    try {
      return await this.prisma.department.create({
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

  async update(id: string, dto: UpdateDepartmentDto) {
    try {
      return await this.prisma.department.update({
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
      throw new NotFoundException("Departamento não encontrado.");
    }

    this.handleUniqueNameError(error);
  }

  private handleUniqueNameError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new BadRequestException("Já existe um departamento com esse nome.");
    }

    throw error;
  }
}
