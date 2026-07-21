import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class AssignRolePermissionsDto {
  @IsUUID()
  roleId!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  permissionIds!: string[];
}
