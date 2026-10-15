import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { UsersEntity } from '../users/entities/users.entity';
import { PropertyEntity } from '../properties/entities/property.entity';
import { TaxAssessmentEntity } from '../tax-assessments/entities/tax-assessment.entity';
import { PaymentEntity } from '../payments/entities/payment.entity';
import { TaxCategoryEntity } from '../tax-categories/entities/tax-category.entity';
import { BillEntity } from '../bills/entities/bill.entity';
import { PropertyApplicationEntity } from '../property-applications/entities/property-application.entity';
import { FineAssessmentEntity } from '../fines/entities/fine-assessment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UsersEntity,
      PropertyEntity,
      TaxAssessmentEntity,
      PaymentEntity,
      TaxCategoryEntity,
      BillEntity,
      PropertyApplicationEntity,
      FineAssessmentEntity,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
