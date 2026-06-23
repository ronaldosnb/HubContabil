import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf
} from "class-validator";
import { DocumentSendStatus, SendChannel } from "@prisma/client";

export class ListDocumentSendsQueryDto {
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsUUID()
  documentId?: string;

  @IsOptional()
  @IsEnum(SendChannel)
  channel?: SendChannel;

  @IsOptional()
  @IsEnum(DocumentSendStatus)
  status?: DocumentSendStatus;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  errorOnly?: string;
}

export class DocumentSendRecipientDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ValidateIf((recipient: DocumentSendRecipientDto) => !!recipient.email)
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  whatsapp?: string;
}

export class PreviewDocumentSendDto {
  @IsUUID()
  documentId!: string;

  @IsOptional()
  @IsUUID()
  recipientContactId?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(SendChannel, { each: true })
  channels?: SendChannel[];
}

export class CreateDocumentSendDto {
  @IsUUID()
  documentId!: string;

  @IsOptional()
  @IsUUID()
  recipientContactId?: string;

  @IsArray()
  @IsEnum(SendChannel, { each: true })
  channels!: SendChannel[];

  @IsString()
  @MaxLength(180)
  messageSubject!: string;

  @IsString()
  @MaxLength(4000)
  messageBody!: string;

  @IsOptional()
  recipient?: DocumentSendRecipientDto;

  @IsBoolean()
  reviewed!: boolean;
}
