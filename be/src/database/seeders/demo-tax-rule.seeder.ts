import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Seeder } from './base/seeder.interface';
import { TaxRuleEntity } from '../../modules/tax-rules/entities/tax-rule.entity';
import { TaxCategoryEntity } from '../../modules/tax-categories/entities/tax-category.entity';
import { BillingPeriodEnum } from '../../common/enums/billing-period.enum';
import { PenaltyBaseEnum } from '../../common/enums/penalty-base.enum';
import { RateTypeEnum } from '../../common/enums/rate-type.enum';
import { TaxCategoryCodeEnum } from '../../common/enums/tax-category-code.enum';

/**
 * Seeds one active demonstration rule per tax category for the current
 * demo fiscal year. These are FICTIONAL demonstration values — not official
 * municipal rates. Real deployments must configure rules via the admin UI.
 */
@Injectable()
export class DemoTaxRuleSeeder implements Seeder {
  private readonly logger = new Logger(DemoTaxRuleSeeder.name);

  async run(manager: EntityManager): Promise<void> {
    const ruleRepo = manager.getRepository(TaxRuleEntity);
    const categoryRepo = manager.getRepository(TaxCategoryEntity);
    const categories = await categoryRepo.find();
    const fiscalYear = '2082/83';
    let created = 0;

    for (const category of categories) {
      const existing = await ruleRepo.findOne({
        where: {
          taxCategoryId: category.id,
          fiscalYear,
          isActive: true,
        },
      });
      if (existing) continue;

      const period =
        category.code === TaxCategoryCodeEnum.HOUSE_RENT_TAX
          ? BillingPeriodEnum.MONTHLY
          : category.code === TaxCategoryCodeEnum.ADVERTISEMENT_TAX
            ? BillingPeriodEnum.ONE_TIME
            : BillingPeriodEnum.ANNUAL;

      await ruleRepo.save(
        ruleRepo.create({
          taxCategoryId: category.id,
          name: `${category.name} — demo rule ${fiscalYear}`,
          fiscalYear,
          billingPeriod: period,
          effectiveFrom: '2025-07-16',
          rateType: category.rateType,
          rate: Number(category.rate),
          minAmount: Number(category.minAmount ?? 0),
          fixedAmount:
            category.rateType === RateTypeEnum.FIXED
              ? Number(category.rate)
              : undefined,
          penaltyPercent: 5,
          penaltyBase: PenaltyBaseEnum.OUTSTANDING,
          graceDays: 7,
          dueDate: '2026-04-13',
          calculationConfig:
            category.code === TaxCategoryCodeEnum.LAND_TAX
              ? { ratePerSqM: 150, landClassMultiplier: 1 }
              : category.code === TaxCategoryCodeEnum.ADVERTISEMENT_TAX
                ? { method: 'fixed' }
                : {},
          requiredDocuments: [],
          isActive: true,
        }),
      );
      created++;
    }
    this.logger.log(
      `Demo tax rules: ${created} created (fictional demo values).`,
    );
  }
}
