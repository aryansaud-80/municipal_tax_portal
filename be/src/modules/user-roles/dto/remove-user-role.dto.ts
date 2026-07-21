import { IsUUID } from 'class-validator';

export class RemoveUserRoleDto {
  @IsUUID()
  userId!: string;

  @IsUUID()
  roleId!: string;
}
