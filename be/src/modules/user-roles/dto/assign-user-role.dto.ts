import { IsOptional, IsUUID } from 'class-validator';

export class AssignUserRoleDto {
  @IsUUID()
  userId!: string;

  @IsUUID()
  roleId!: string;

  @IsOptional()
  @IsUUID()
  assignedBy?: string;
}
