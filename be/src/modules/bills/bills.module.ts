import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillEntity } from './entities/bill.entity';
import { PropertyEntity } from '../properties/entities/property.entity';
import { TaxCategoryEntity } from '../tax-categories/entities/tax-category.entity';
import { TaxAssessmentEntity } from '../tax-assessments/entities/tax-assessment.entity';
import { BillsService } from './bills.service';
import { BillsController } from './bills.controller';
import { TaxRulesModule } from '../tax-rules/tax-rules.module';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BillEntity,
      PropertyEntity,
      TaxCategoryEntity,
      TaxAssessmentEntity,
    ]),
    TaxRulesModule,
    AuditModule,
    NotificationsModule,
  ],
  controllers: [BillsController],
  providers: [BillsService],
  exports: [BillsService],
})
export class BillsModule {}
