import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { PermissionModule } from '../enums/permission-module.enum';
import { PermissionAction } from '../enums/permission-action.enum';

export class CreatePermissionDto {
  @IsNotEmpty()
  @IsEnum(PermissionModule)
  module!: PermissionModule;

  @IsNotEmpty()
  @IsEnum(PermissionAction)
  action!: PermissionAction;

  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsString()
  code!: string;

  @IsNotEmpty()
  @IsString()
  description!: string;
}
