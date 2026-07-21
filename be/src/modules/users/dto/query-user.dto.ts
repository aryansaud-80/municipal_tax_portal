import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { SortOrder } from '../../../common/enums/sort-order.enum';
import { UserStatusEnum } from '../enums/user-status.enum';

export enum UserSortableField {
  FIRST_NAME = 'firstName',
  LAST_NAME = 'lastName',
  USERNAME = 'username',
  EMAIL = 'email',
  CREATED_AT = 'createdAt',
}

export class QueryUserDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsEnum(UserStatusEnum)
  @IsOptional()
  status?: UserStatusEnum;

  @IsOptional()
  @IsEnum(UserSortableField)
  sortBy?: UserSortableField = UserSortableField.CREATED_AT;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;
}
