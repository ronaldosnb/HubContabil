import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards
} from "@nestjs/common";
import { AuthenticatedRequest } from "../common/authenticated-request";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import {
  CreateTaskDto,
  ListTasksQueryDto,
  ReplicateTaskDto,
  UpdateTaskDto,
  UpdateTaskStatusDto
} from "./task.dto";
import { TasksService } from "./tasks.service";

@Controller("tasks")
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  list(@Query() query: ListTasksQueryDto) {
    return this.tasksService.list(query);
  }

  @Post()
  create(@Body() dto: CreateTaskDto, @Req() request: AuthenticatedRequest) {
    return this.tasksService.create(dto, request.user.sub);
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.tasksService.get(id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateTaskDto,
    @Req() request: AuthenticatedRequest
  ) {
    return this.tasksService.update(id, dto, request.user.sub);
  }

  @Patch(":id/status")
  updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateTaskStatusDto,
    @Req() request: AuthenticatedRequest
  ) {
    return this.tasksService.updateStatus(id, dto.status, request.user.sub);
  }

  @Post(":id/replicate")
  replicate(
    @Param("id") id: string,
    @Body() dto: ReplicateTaskDto,
    @Req() request: AuthenticatedRequest
  ) {
    return this.tasksService.replicate(id, dto, request.user.sub);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @Req() request: AuthenticatedRequest) {
    return this.tasksService.remove(id, request.user.sub);
  }
}
