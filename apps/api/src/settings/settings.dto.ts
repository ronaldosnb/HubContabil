import { IsEmail, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  officeName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  emailFromName?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  emailFromAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  wppconnectSession?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  emailSubjectTemplate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  emailBodyTemplate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  whatsappBodyTemplate?: string;
}
