import {
  IsEmail,
  IsOptional,
  MaxLength,
  IsString,
  Matches,
  IsEnum,
} from 'class-validator';
import { UserStatusEnum } from '../enums/user-status.enum';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  lastName?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9]{7,15}$/, { message: 'invalid phone number' })
  phoneNumber?: string;

  @IsEnum(UserStatusEnum)
  @IsOptional()
  status?: UserStatusEnum;
}
