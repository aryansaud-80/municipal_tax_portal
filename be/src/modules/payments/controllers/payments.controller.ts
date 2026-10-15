import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import {
  PaymentsService,
  OfficePaymentDto,
} from '../services/payments.service';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { QueryPaymentDto } from '../dto/query-payment.dto';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { PaymentMethodEnum } from '../../../common/enums/payment-method.enum';

class InitiateOnlineDto {
  @IsUUID()
  billId!: string;

  @IsNumber()
  @Min(0.01)
  @IsOptional()
  amount?: number;

  @IsString()
  @IsOptional()
  idempotencyKey?: string;
}

class OfficePaymentBody implements OfficePaymentDto {
  @IsUUID()
  billId!: string;

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsEnum(PaymentMethodEnum)
  method!: PaymentMethodEnum;

  @IsString()
  @IsOptional()
  referenceNumber?: string;
}

class ProviderCallbackDto {
  @IsString()
  providerRef!: string;

  @IsString()
  status!: 'success' | 'failed' | 'cancelled';

  @IsNumber()
  amount!: number;

  @IsOptional()
  raw?: Record<string, unknown>;
}

@Controller('payments')
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  @Post()
  @Permissions('payment.create')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreatePaymentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.create(dto, userId);
  }

  @Post('office')
  @Permissions('payment.create')
  @HttpCode(HttpStatus.CREATED)
  async recordOffice(
    @Body() dto: OfficePaymentBody,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.recordOfficePayment(dto, userId);
  }

  @Post('online/initiate')
  @Permissions('payment.create')
  @HttpCode(HttpStatus.CREATED)
  async initiateOnline(
    @Body() dto: InitiateOnlineDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.initiateOnline(
      dto.billId,
      userId,
      dto.amount,
      dto.idempotencyKey,
    );
  }

  @Post('online/mock-confirm')
  @Permissions('payment.create')
  @HttpCode(HttpStatus.OK)
  async mockConfirm(
    @Body() dto: { providerRef: string },
    @CurrentUser('id') userId: string,
  ) {
    return this.service.confirmMockPayment(dto.providerRef, userId);
  }

  /**
   * Mock provider server callback. Authenticated by HMAC signature —
   * browser redirects can never mark a payment successful.
   */
  @Public()
  @Post('online/callback')
  @HttpCode(HttpStatus.OK)
  async providerCallback(
    @Body() dto: ProviderCallbackDto,
    @Headers('x-mock-signature') signature: string,
  ) {
    return this.service.handleProviderCallback({
      ...dto,
      signature: signature ?? '',
    });
  }

  @Get()
  @Permissions('payment.view')
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: QueryPaymentDto) {
    return this.service.findAll(query);
  }

  @Get('my')
  @Permissions('payment.view')
  @HttpCode(HttpStatus.OK)
  async findMine(@CurrentUser('id') userId: string) {
    return this.service.findByUser(userId);
  }

  @Get(':id')
  @Permissions('payment.view')
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('permissions') permissions: string[],
  ) {
    const staff = (permissions ?? []).includes('payment.verify');
    return this.service.findOne(id, userId, staff);
  }

  @Post(':id/verify')
  @Permissions('payment.verify')
  @HttpCode(HttpStatus.OK)
  async verifyPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.verifyPayment(id, userId);
  }
}
