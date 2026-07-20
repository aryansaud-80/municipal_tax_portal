import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { PermissionModule } from '../enums/permission-module.enum';
import { PermissionAction } from '../enums/permission-action.enum';

export class QueryPermissionDto {
  @IsOptional()
  @IsEnum(PermissionModule)
  module?: PermissionModule;

  @IsOptional()
  @IsEnum(PermissionAction)
  action?: PermissionAction;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
