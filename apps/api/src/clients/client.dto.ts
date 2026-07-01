import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength
} from "class-validator";
import { ClientStatus, ClientType, PreferredChannel } from "@prisma/client";

export class ListClientsQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(ClientStatus)
  status?: ClientStatus;

  @IsOptional()
  @IsEnum(ClientType)
  type?: ClientType;

  @IsOptional()
  @IsUUID()
  responsibleUserId?: string;
}

export class CreateClientDto {
  @IsEnum(ClientType)
  type!: ClientType;

  @IsString()
  @MaxLength(160)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  legalName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  tradeName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  documentNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  taxRegime?: string;

  @IsOptional()
  @IsDateString()
  openingDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  registrationStatus?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  stateRegistration?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  companySize?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  legalNature?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  mainActivity?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  addressLine?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  addressNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  addressComplement?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  district?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  zipCode?: string;

  @IsOptional()
  @IsEmail()
  businessEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  businessPhone?: string;

  @IsOptional()
  @IsDateString()
  cnpjwsUpdatedAt?: string;

  @IsOptional()
  @IsEnum(ClientStatus)
  status?: ClientStatus;

  @IsOptional()
  @IsUUID()
  internalResponsibleId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class UpdateClientDto extends CreateClientDto {
  @IsOptional()
  @IsEnum(ClientType)
  declare type: ClientType;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  declare name: string;
}

export class CreateClientContactDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  roleDescription?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  whatsapp?: string;

  @IsOptional()
  @IsBoolean()
  isMain?: boolean;

  @IsOptional()
  @IsEnum(PreferredChannel)
  preferredChannel?: PreferredChannel;
}

export class UpdateClientContactDto extends CreateClientContactDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  declare name: string;
}

export class CreateClientServiceDto {
  @IsUUID()
  serviceId!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class UpdateClientServiceDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
