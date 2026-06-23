import { Injectable, NotFoundException } from "@nestjs/common";
import { TaskStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateRecurringTaskDto,
  UpdateRecurringTaskActiveDto,
  UpdateRecurringTaskDto
} from "./recurring-task.dto";
import { assertRecurrenceRule, calculateNextRunAt } from "./recurrence";

const recurringTaskInclude = {
  client: {
    select: { id: true, name: true }
  },
  department: true,
  responsibleUser: {
    select: { id: true, name: true, email: true }
  }
};

@Injectable()
export class RecurringTasksService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.recurringTask.findMany({
      include: recurringTaskInclude,
      orderBy: [{ isActive: "desc" }, { nextRunAt: "asc" }]
    });
  }

  async get(id: string) {
    const recurringTask = await this.prisma.recurringTask.findUnique({
      where: { id },
      include: recurringTaskInclude
    });

    if (!recurringTask) {
      throw new NotFoundException("Recorrência não encontrada.");
    }

    return recurringTask;
  }

  async create(dto: CreateRecurringTaskDto, userId: string) {
    assertRecurrenceRule(dto.recurrenceRule);

    const recurringTask = await this.prisma.recurringTask.create({
      data: {
        title: dto.title,
        description: dto.description,
        clientId: dto.clientId,
        departmentId: dto.departmentId,
        responsibleUserId: dto.responsibleUserId,
        recurrenceRule: dto.recurrenceRule,
        nextRunAt: new Date(dto.nextRunAt),
        isActive: dto.isActive ?? true
      }
    });

    await this.log(
      recurringTask.clientId,
      userId,
      recurringTask.id,
      "RECURRING_TASK_CREATED",
      `Recorrência ${recurringTask.title} criada.`
    );

    return this.get(recurringTask.id);
  }

  async update(id: string, dto: UpdateRecurringTaskDto, userId: string) {
    const existing = await this.get(id);

    if (dto.recurrenceRule) {
      assertRecurrenceRule(dto.recurrenceRule);
    }

    await this.prisma.recurringTask.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        clientId: dto.clientId,
        departmentId: dto.departmentId,
        responsibleUserId: dto.responsibleUserId,
        recurrenceRule: dto.recurrenceRule,
        nextRunAt: dto.nextRunAt ? new Date(dto.nextRunAt) : undefined,
        isActive: dto.isActive
      }
    });

    await this.log(
      existing.clientId,
      userId,
      id,
      "RECURRING_TASK_UPDATED",
      "Recorrência atualizada."
    );

    return this.get(id);
  }

  async updateActive(id: string, dto: UpdateRecurringTaskActiveDto, userId: string) {
    const existing = await this.get(id);

    await this.prisma.recurringTask.update({
      where: { id },
      data: { isActive: dto.isActive }
    });

    await this.log(
      existing.clientId,
      userId,
      id,
      dto.isActive ? "RECURRING_TASK_ENABLED" : "RECURRING_TASK_DISABLED",
      dto.isActive ? "Recorrência ativada." : "Recorrência desativada."
    );

    return this.get(id);
  }

  async generateTask(id: string, userId: string) {
    const recurringTask = await this.get(id);
    const createdByUserId = recurringTask.responsibleUserId ?? userId;

    const task = await this.prisma.task.create({
      data: {
        title: recurringTask.title,
        description: recurringTask.description,
        clientId: recurringTask.clientId,
        departmentId: recurringTask.departmentId,
        responsibleUserId: recurringTask.responsibleUserId,
        createdByUserId,
        status: TaskStatus.TODO,
        isRecurringInstance: true,
        recurringTaskId: recurringTask.id
      }
    });

    await this.prisma.recurringTask.update({
      where: { id },
      data: { nextRunAt: calculateNextRunAt(recurringTask.recurrenceRule, new Date()) }
    });

    await this.log(
      recurringTask.clientId,
      userId,
      recurringTask.id,
      "RECURRING_TASK_GENERATED",
      `Tarefa ${task.title} gerada a partir da recorrência.`
    );

    return task;
  }

  private async log(
    clientId: string | null,
    userId: string,
    entityId: string,
    action: string,
    description: string
  ) {
    await this.prisma.activityLog.create({
      data: {
        clientId: clientId ?? undefined,
        userId,
        entityType: "RecurringTask",
        entityId,
        action,
        description
      }
    });
  }
}
