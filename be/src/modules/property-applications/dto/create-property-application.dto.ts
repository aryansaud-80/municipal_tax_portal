import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { PropertyTypeEnum } from '../../../common/enums/property-type.enum';

export class CreatePropertyApplicationDto {
  @IsString()
  @IsNotEmpty()
  ownerName!: string;

  @IsString()
  @IsNotEmpty()
  address!: string;

  @IsInt()
  @Min(1)
  @Max(35)
  ward!: number;

  @IsString()
  @IsOptional()
  tole?: string;

  @IsNumber()
  @Min(0)
  areaSqMeters!: number;

  @IsEnum(PropertyTypeEnum)
  propertyType!: PropertyTypeEnum;

  @IsString()
  @IsOptional()
  landOwnershipNumber?: string;

  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  floorCount?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  buildingAgeYears?: number;

  @IsUUID()
  @IsOptional()
  applicantUserId?: string;
}
