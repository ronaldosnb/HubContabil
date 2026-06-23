import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, TaskStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateTaskDto,
  ListTasksQueryDto,
  ReplicateTaskDto,
  UpdateTaskDto
} from "./task.dto";

const taskInclude = {
  client: {
    select: { id: true, name: true, documentNumber: true }
  },
  department: true,
  responsibleUser: {
    select: { id: true, name: true, email: true }
  },
  createdBy: {
    select: { id: true, name: true, email: true }
  },
  document: {
    select: { id: true, title: true, category: true, dueDate: true }
  }
} satisfies Prisma.TaskInclude;

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  list(query: ListTasksQueryDto) {
    const now = new Date();

    const where: Prisma.TaskWhereInput = {
      clientId: query.clientId,
      responsibleUserId: query.responsibleUserId,
      departmentId: query.departmentId,
      priority: query.priority,
      status: query.status,
      isRecurringInstance: query.recurring === "true" ? true : undefined,
      dueDate:
        query.overdue === "true"
          ? {
              lt: now
            }
          : query.dueFrom || query.dueTo
            ? {
                gte: query.dueFrom ? new Date(query.dueFrom) : undefined,
                lte: query.dueTo ? new Date(query.dueTo) : undefined
              }
            : undefined
    };

    if (query.overdue === "true") {
      where.status = {
        in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.WAITING_CLIENT]
      };
    }

    return this.prisma.task.findMany({
      where,
      include: taskInclude,
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }]
    });
  }

  async get(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: taskInclude
    });

    if (!task) {
      throw new NotFoundException("Tarefa não encontrada.");
    }

    return task;
  }

  async create(dto: CreateTaskDto, userId: string) {
    const task = await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        clientId: dto.clientId,
        departmentId: dto.departmentId,
        responsibleUserId: dto.responsibleUserId,
        createdByUserId: userId,
        documentId: dto.documentId,
        status: dto.status ?? TaskStatus.TODO,
        priority: dto.priority,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        completedAt: dto.status === TaskStatus.DONE ? new Date() : undefined
      }
    });

    await this.log(task.clientId, userId, task.id, "TASK_CREATED", `Tarefa ${task.title} criada.`);

    return this.get(task.id);
  }

  async update(id: string, dto: UpdateTaskDto, userId: string) {
    const existing = await this.get(id);

    await this.prisma.task.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        clientId: dto.clientId,
        departmentId: dto.departmentId,
        responsibleUserId: dto.responsibleUserId,
        documentId: dto.documentId,
        status: dto.status,
        priority: dto.priority,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        completedAt:
          dto.status === TaskStatus.DONE
            ? new Date()
            : dto.status
              ? null
              : undefined
      }
    });

    await this.log(
      existing.clientId,
      userId,
      id,
      "TASK_UPDATED",
      "Dados da tarefa atualizados."
    );

    return this.get(id);
  }

  async updateStatus(id: string, status: TaskStatus, userId: string) {
    const existing = await this.get(id);

    await this.prisma.task.update({
      where: { id },
      data: {
        status,
        completedAt: status === TaskStatus.DONE ? new Date() : null
      }
    });

    await this.log(
      existing.clientId,
      userId,
      id,
      "TASK_STATUS_UPDATED",
      `Status da tarefa alterado para ${status}.`
    );

    return this.get(id);
  }

  async replicate(id: string, dto: ReplicateTaskDto, userId: string) {
    const original = await this.get(id);

    const task = await this.prisma.task.create({
      data: {
        title: original.title,
        description: dto.description ?? original.description,
        clientId: original.clientId,
        departmentId: original.departmentId,
        responsibleUserId: dto.responsibleUserId ?? original.responsibleUserId,
        createdByUserId: userId,
        documentId: original.documentId,
        status: dto.status ?? TaskStatus.TODO,
        priority: original.priority,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        replicatedFromTaskId: original.id
      }
    });

    await this.log(
      task.clientId,
      userId,
      task.id,
      "TASK_REPLICATED",
      `Tarefa replicada a partir de ${original.title}.`
    );

    return this.get(task.id);
  }

  async remove(id: string, userId: string) {
    const task = await this.get(id);

    await this.prisma.task.delete({ where: { id } });
    await this.log(task.clientId, userId, id, "TASK_DELETED", `Tarefa ${task.title} removida.`);

    return { deleted: true };
  }

  private async log(
    clientId: string | null,
    userId: string,
    taskId: string,
    action: string,
    description: string
  ) {
    await this.prisma.activityLog.create({
      data: {
        clientId: clientId ?? undefined,
        userId,
        entityType: "Task",
        entityId: taskId,
        action,
        description
      }
    });
  }
}
