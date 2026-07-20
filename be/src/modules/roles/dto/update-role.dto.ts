import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
