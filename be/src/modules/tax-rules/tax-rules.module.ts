import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaxRuleEntity } from './entities/tax-rule.entity';
import { TaxCategoryEntity } from '../tax-categories/entities/tax-category.entity';
import { TaxRulesService } from './tax-rules.service';
import { TaxRulesController } from './tax-rules.controller';
import { TaxCalculationService } from './tax-calculation.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TaxRuleEntity, TaxCategoryEntity]),
    AuditModule,
  ],
  controllers: [TaxRulesController],
  providers: [TaxRulesService, TaxCalculationService],
  exports: [TaxRulesService, TaxCalculationService],
})
export class TaxRulesModule {}
