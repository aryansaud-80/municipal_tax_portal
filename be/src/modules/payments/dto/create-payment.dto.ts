import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';
import { PaymentMethodEnum } from '../../../common/enums/payment-method.enum';

export class CreatePaymentDto {
  @IsUUID()
  @IsNotEmpty()
  taxAssessmentId!: string;

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsEnum(PaymentMethodEnum)
  method!: PaymentMethodEnum;

  @IsUUID()
  @IsOptional()
  userId?: string;
}
