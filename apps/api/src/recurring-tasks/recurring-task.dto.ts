import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength
} from "class-validator";

export class CreateRecurringTaskDto {
  @IsString()
  @MaxLength(180)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsUUID()
  responsibleUserId?: string;

  @IsString()
  @MaxLength(40)
  recurrenceRule!: string;

  @IsDateString()
  nextRunAt!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateRecurringTaskDto extends CreateRecurringTaskDto {
  @IsOptional()
  @IsString()
  @MaxLength(180)
  declare title: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  declare recurrenceRule: string;

  @IsOptional()
  @IsDateString()
  declare nextRunAt: string;
}

export class UpdateRecurringTaskActiveDto {
  @IsBoolean()
  isActive!: boolean;
}
