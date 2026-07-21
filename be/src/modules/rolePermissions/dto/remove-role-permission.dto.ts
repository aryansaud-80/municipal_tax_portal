import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class RemoveRolePermissionsDto {
  @IsUUID()
  roleId!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  permissionIds!: string[];
}
