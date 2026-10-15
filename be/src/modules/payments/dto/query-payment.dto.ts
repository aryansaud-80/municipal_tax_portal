import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { SortOrder } from '../../../common/enums/sort-order.enum';
import { PaymentStatusEnum } from '../../../common/enums/payment-status.enum';
import { PaymentMethodEnum } from '../../../common/enums/payment-method.enum';

export enum PaymentSortableField {
  PAYMENT_NUMBER = 'paymentNumber',
  AMOUNT = 'amount',
  PAID_AT = 'paidAt',
  CREATED_AT = 'createdAt',
}

export class QueryPaymentDto {
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
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsUUID()
  taxAssessmentId?: string;

  @IsEnum(PaymentStatusEnum)
  @IsOptional()
  status?: PaymentStatusEnum;

  @IsEnum(PaymentMethodEnum)
  @IsOptional()
  method?: PaymentMethodEnum;

  @IsOptional()
  @IsEnum(PaymentSortableField)
  sortBy?: PaymentSortableField = PaymentSortableField.CREATED_AT;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;
}
