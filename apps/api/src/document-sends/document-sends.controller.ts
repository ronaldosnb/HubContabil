import {
  Body,
  Controller,
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
  CreateDocumentSendDto,
  ListDocumentSendsQueryDto,
  PreviewDocumentSendDto
} from "./document-send.dto";
import { DocumentSendsService } from "./document-sends.service";

@Controller("document-sends")
@UseGuards(JwtAuthGuard)
export class DocumentSendsController {
  constructor(private readonly documentSendsService: DocumentSendsService) {}

  @Get()
  list(@Query() query: ListDocumentSendsQueryDto) {
    return this.documentSendsService.list(query);
  }

  @Post("preview")
  preview(@Body() dto: PreviewDocumentSendDto, @Req() request: AuthenticatedRequest) {
    return this.documentSendsService.preview(dto, request.user.sub);
  }

  @Post()
  create(@Body() dto: CreateDocumentSendDto, @Req() request: AuthenticatedRequest) {
    return this.documentSendsService.create(dto, request.user.sub);
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.documentSendsService.get(id);
  }

  @Post(":id/resend")
  resend(@Param("id") id: string, @Req() request: AuthenticatedRequest) {
    return this.documentSendsService.resend(id, request.user.sub);
  }

  @Patch(":id/cancel")
  cancel(@Param("id") id: string, @Req() request: AuthenticatedRequest) {
    return this.documentSendsService.cancel(id, request.user.sub);
  }
}
