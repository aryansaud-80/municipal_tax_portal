import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillEntity } from '../bills/entities/bill.entity';
import { PaymentEntity } from '../payments/entities/payment.entity';
import { PropertyApplicationEntity } from '../property-applications/entities/property-application.entity';
import { FineAssessmentEntity } from '../fines/entities/fine-assessment.entity';
import { AuditEventEntity } from '../audit/entities/audit-event.entity';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BillEntity,
      PaymentEntity,
      PropertyApplicationEntity,
      FineAssessmentEntity,
      AuditEventEntity,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
