import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaxAssessmentEntity } from './entities/tax-assessment.entity';
import { PropertyEntity } from '../properties/entities/property.entity';
import { TaxCategoryEntity } from '../tax-categories/entities/tax-category.entity';
import { TaxAssessmentsController } from './controllers/tax-assessments.controller';
import { TaxAssessmentsService } from './services/tax-assessments.service';
import { TaxRulesModule } from '../tax-rules/tax-rules.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TaxAssessmentEntity,
      PropertyEntity,
      TaxCategoryEntity,
    ]),
    TaxRulesModule,
    AuditModule,
  ],
  controllers: [TaxAssessmentsController],
  providers: [TaxAssessmentsService],
  exports: [TaxAssessmentsService, TypeOrmModule],
})
export class TaxAssessmentsModule {}
