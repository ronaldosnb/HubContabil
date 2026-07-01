import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength
} from "class-validator";
import { UserRole } from "@prisma/client";

export class CreateUserDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsEnum(UserRole)
  role!: UserRole;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  departmentIds?: string[];
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  departmentIds?: string[];
}
