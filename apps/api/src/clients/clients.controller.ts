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
  CreateClientContactDto,
  CreateClientDto,
  CreateClientServiceDto,
  ListClientsQueryDto,
  UpdateClientContactDto,
  UpdateClientDto,
  UpdateClientServiceDto
} from "./client.dto";
import { ClientsService } from "./clients.service";

@Controller("clients")
@UseGuards(JwtAuthGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  list(@Query() query: ListClientsQueryDto) {
    return this.clientsService.list(query);
  }

  @Post()
  create(@Body() dto: CreateClientDto, @Req() request: AuthenticatedRequest) {
    return this.clientsService.create(dto, request.user.sub);
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.clientsService.get(id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateClientDto,
    @Req() request: AuthenticatedRequest
  ) {
    return this.clientsService.update(id, dto, request.user.sub);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @Req() request: AuthenticatedRequest) {
    return this.clientsService.remove(id, request.user.sub);
  }

  @Post(":id/contacts")
  createContact(
    @Param("id") clientId: string,
    @Body() dto: CreateClientContactDto,
    @Req() request: AuthenticatedRequest
  ) {
    return this.clientsService.createContact(clientId, dto, request.user.sub);
  }

  @Patch(":id/contacts/:contactId")
  updateContact(
    @Param("id") clientId: string,
    @Param("contactId") contactId: string,
    @Body() dto: UpdateClientContactDto,
    @Req() request: AuthenticatedRequest
  ) {
    return this.clientsService.updateContact(clientId, contactId, dto, request.user.sub);
  }

  @Delete(":id/contacts/:contactId")
  removeContact(
    @Param("id") clientId: string,
    @Param("contactId") contactId: string,
    @Req() request: AuthenticatedRequest
  ) {
    return this.clientsService.removeContact(clientId, contactId, request.user.sub);
  }

  @Post(":id/services")
  attachService(
    @Param("id") clientId: string,
    @Body() dto: CreateClientServiceDto,
    @Req() request: AuthenticatedRequest
  ) {
    return this.clientsService.attachService(clientId, dto, request.user.sub);
  }

  @Patch(":id/services/:clientServiceId")
  updateService(
    @Param("id") clientId: string,
    @Param("clientServiceId") clientServiceId: string,
    @Body() dto: UpdateClientServiceDto,
    @Req() request: AuthenticatedRequest
  ) {
    return this.clientsService.updateService(
      clientId,
      clientServiceId,
      dto,
      request.user.sub
    );
  }

  @Delete(":id/services/:clientServiceId")
  removeService(
    @Param("id") clientId: string,
    @Param("clientServiceId") clientServiceId: string,
    @Req() request: AuthenticatedRequest
  ) {
    return this.clientsService.removeService(clientId, clientServiceId, request.user.sub);
  }
}
