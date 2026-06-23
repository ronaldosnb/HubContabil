import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Response } from "express";
import { AuthenticatedRequest } from "../common/authenticated-request";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { UploadedFileInput } from "../storage/storage.types";
import {
  CreateDocumentDto,
  ListDocumentsQueryDto,
  UpdateDocumentDto
} from "./document.dto";
import { DocumentsService } from "./documents.service";

@Controller("documents")
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  list(@Query() query: ListDocumentsQueryDto) {
    return this.documentsService.list(query);
  }

  @Post()
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 25 * 1024 * 1024 } }))
  create(
    @Body() dto: CreateDocumentDto,
    @UploadedFile() file: UploadedFileInput | undefined,
    @Req() request: AuthenticatedRequest
  ) {
    return this.documentsService.create(dto, file, request.user.sub);
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.documentsService.get(id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateDocumentDto,
    @Req() request: AuthenticatedRequest
  ) {
    return this.documentsService.update(id, dto, request.user.sub);
  }

  @Get(":id/download")
  @Header("Cache-Control", "private, no-store")
  async download(@Param("id") id: string, @Res() response: Response) {
    const { document, file } = await this.documentsService.download(id);

    response.setHeader("Content-Type", document.mimeType);
    response.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(document.originalFileName)}"`
    );
    response.send(file);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @Req() request: AuthenticatedRequest) {
    return this.documentsService.remove(id, request.user.sub);
  }
}
