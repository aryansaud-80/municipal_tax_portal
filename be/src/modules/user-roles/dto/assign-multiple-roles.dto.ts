import { ArrayNotEmpty, IsArray, IsOptional, IsUUID } from 'class-validator';

export class AssignMultipleRolesDto {
  @IsUUID()
  userId!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  roleIds!: string[];

  @IsOptional()
  @IsUUID()
  assignedBy?: string;
}