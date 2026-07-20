import { Type } from 'class-transformer';
import { IsBoolean } from 'class-validator';

export class ToggleRoleStatusDto {
  @Type(() => Boolean)
  @IsBoolean()
  isActive!: boolean;
}
