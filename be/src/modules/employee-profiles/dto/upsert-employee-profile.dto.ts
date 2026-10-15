import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class UpsertEmployeeProfileDto {
  @IsUUID()
  userId!: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  position?: string;

  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @IsOptional()
  wardAssignments?: number[];

  @IsBoolean()
  @IsOptional()
  canVerifyPayments?: boolean;

  @IsBoolean()
  @IsOptional()
  canAssess?: boolean;

  @IsBoolean()
  @IsOptional()
  canApproveProperty?: boolean;
}
