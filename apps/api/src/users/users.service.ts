import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { hash } from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { CreateUserDto, UpdateUserDto } from "./dto";

type SelectedUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  departments: Array<{
    department: {
      id: string;
      name: string;
      description: string | null;
      isActive: boolean;
    };
  }>;
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly departmentSelect = {
    id: true,
    name: true,
    description: true,
    isActive: true
  } satisfies Prisma.DepartmentSelect;

  private readonly userSelect = {
    id: true,
    name: true,
    email: true,
    role: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
    departments: {
      select: {
        department: {
          select: this.departmentSelect
        }
      },
      orderBy: {
        department: {
          name: "asc"
        }
      }
    }
  } satisfies Prisma.UserSelect;

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: this.userSelect
    });

    return user ? this.presentUser(user) : null;
  }

  async listActive() {
    const users = await this.prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departments: {
          select: {
            department: {
              select: this.departmentSelect
            }
          },
          orderBy: {
            department: {
              name: "asc"
            }
          }
        }
      },
      orderBy: { name: "asc" }
    });

    return users.map((user) => this.presentUser(user));
  }

  async listAll() {
    const users = await this.prisma.user.findMany({
      select: this.userSelect,
      orderBy: { name: "asc" }
    });

    return users.map((user) => this.presentUser(user));
  }

  async create(dto: CreateUserDto) {
    const passwordHash = await hash(dto.password, 12);
    await this.validateDepartments(dto.departmentIds);

    try {
      const user = await this.prisma.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          passwordHash,
          role: dto.role,
          isActive: dto.isActive ?? true,
          departments: this.buildDepartmentCreate(dto.departmentIds)
        },
        select: this.userSelect
      });

      return this.presentUser(user);
    } catch (error) {
      this.handleKnownError(error);
    }
  }

  async update(id: string, dto: UpdateUserDto) {
    const passwordHash = dto.password ? await hash(dto.password, 12) : undefined;
    await this.validateDepartments(dto.departmentIds);

    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: {
          name: dto.name,
          email: dto.email,
          passwordHash,
          role: dto.role,
          isActive: dto.isActive,
          departments:
            dto.departmentIds === undefined
              ? undefined
              : {
                  deleteMany: {},
                  create: this.uniqueDepartmentIds(dto.departmentIds).map((departmentId) => ({
                    departmentId
                  }))
                }
        },
        select: this.userSelect
      });

      return this.presentUser(user);
    } catch (error) {
      this.handleKnownError(error);
    }
  }

  async updateProfile(id: string, dto: { name?: string; email?: string; password?: string }) {
    const passwordHash = dto.password ? await hash(dto.password, 12) : undefined;

    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: {
          name: dto.name,
          email: dto.email,
          passwordHash
        },
        select: this.userSelect
      });

      return this.presentUser(user);
    } catch (error) {
      this.handleKnownError(error);
    }
  }

  private presentUser<T extends SelectedUser>(user: T) {
    return {
      ...user,
      departments: user.departments.map(({ department }) => department)
    };
  }

  private buildDepartmentCreate(departmentIds?: string[]) {
    const uniqueIds = this.uniqueDepartmentIds(departmentIds);

    return uniqueIds.length
      ? {
          create: uniqueIds.map((departmentId) => ({ departmentId }))
        }
      : undefined;
  }

  private uniqueDepartmentIds(departmentIds?: string[]) {
    return Array.from(new Set(departmentIds ?? []));
  }

  private async validateDepartments(departmentIds?: string[]) {
    const uniqueIds = this.uniqueDepartmentIds(departmentIds);

    if (!uniqueIds.length) {
      return;
    }

    const count = await this.prisma.department.count({
      where: {
        id: {
          in: uniqueIds
        }
      }
    });

    if (count !== uniqueIds.length) {
      throw new BadRequestException("Um ou mais departamentos informados nao existem.");
    }
  }

  private handleKnownError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        throw new BadRequestException("Ja existe um usuario com esse e-mail.");
      }

      if (error.code === "P2025") {
        throw new NotFoundException("Usuario nao encontrado.");
      }
    }

    throw error;
  }
}
