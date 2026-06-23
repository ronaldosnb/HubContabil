import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards
} from "@nestjs/common";
import { AuthenticatedRequest } from "../common/authenticated-request";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import {
  CreateRecurringTaskDto,
  UpdateRecurringTaskActiveDto,
  UpdateRecurringTaskDto
} from "./recurring-task.dto";
import { RecurringTasksService } from "./recurring-tasks.service";

@Controller("recurring-tasks")
@UseGuards(JwtAuthGuard)
export class RecurringTasksController {
  constructor(private readonly recurringTasksService: RecurringTasksService) {}

  @Get()
  list() {
    return this.recurringTasksService.list();
  }

  @Post()
  create(@Body() dto: CreateRecurringTaskDto, @Req() request: AuthenticatedRequest) {
    return this.recurringTasksService.create(dto, request.user.sub);
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.recurringTasksService.get(id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateRecurringTaskDto,
    @Req() request: AuthenticatedRequest
  ) {
    return this.recurringTasksService.update(id, dto, request.user.sub);
  }

  @Patch(":id/active")
  updateActive(
    @Param("id") id: string,
    @Body() dto: UpdateRecurringTaskActiveDto,
    @Req() request: AuthenticatedRequest
  ) {
    return this.recurringTasksService.updateActive(id, dto, request.user.sub);
  }

  @Post(":id/generate")
  generate(@Param("id") id: string, @Req() request: AuthenticatedRequest) {
    return this.recurringTasksService.generateTask(id, request.user.sub);
  }
}
