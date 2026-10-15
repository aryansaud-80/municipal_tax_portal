import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentEntity } from './entities/payment.entity';
import { PaymentAllocationEntity } from './entities/payment-allocation.entity';
import { TaxAssessmentEntity } from '../tax-assessments/entities/tax-assessment.entity';
import { BillEntity } from '../bills/entities/bill.entity';
import { ReceiptEntity } from '../receipts/entities/receipt.entity';
import { PaymentsController } from './controllers/payments.controller';
import { PaymentsService } from './services/payments.service';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PaymentEntity,
      PaymentAllocationEntity,
      TaxAssessmentEntity,
      BillEntity,
      ReceiptEntity,
    ]),
    AuditModule,
    NotificationsModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService, TypeOrmModule],
})
export class PaymentsModule {}
