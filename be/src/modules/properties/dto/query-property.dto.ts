import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { SortOrder } from '../../../common/enums/sort-order.enum';
import { PropertyStatusEnum } from '../../../common/enums/property-status.enum';
import { PropertyTypeEnum } from '../../../common/enums/property-type.enum';

export enum PropertySortableField {
  PROPERTY_NUMBER = 'propertyNumber',
  OWNER_NAME = 'ownerName',
  WARD = 'ward',
  CREATED_AT = 'createdAt',
}

export class QueryPropertyDto {
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
  userId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(35)
  ward?: number;

  @IsEnum(PropertyStatusEnum)
  @IsOptional()
  status?: PropertyStatusEnum;

  @IsEnum(PropertyTypeEnum)
  @IsOptional()
  propertyType?: PropertyTypeEnum;

  @IsOptional()
  @IsEnum(PropertySortableField)
  sortBy?: PropertySortableField = PropertySortableField.CREATED_AT;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;
}
