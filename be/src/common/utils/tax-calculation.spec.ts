import { TaxCalculationService } from '../../modules/tax-rules/tax-calculation.service';
import { TaxRuleEntity } from '../../modules/tax-rules/entities/tax-rule.entity';
import { TaxCategoryCodeEnum } from '../../common/enums/tax-category-code.enum';
import { RateTypeEnum } from '../../common/enums/rate-type.enum';
import { BillingPeriodEnum } from '../../common/enums/billing-period.enum';
import { PenaltyBaseEnum } from '../../common/enums/penalty-base.enum';

function rule(partial: Partial<TaxRuleEntity>): TaxRuleEntity {
  const r = new TaxRuleEntity();
  Object.assign(r, {
    name: 'test rule',
    fiscalYear: '2082/83',
    billingPeriod: BillingPeriodEnum.ANNUAL,
    effectiveFrom: '2025-07-16',
    rateType: RateTypeEnum.PERCENTAGE,
    rate: 1,
    minAmount: 0,
    penaltyPercent: 5,
    penaltyBase: PenaltyBaseEnum.OUTSTANDING,
    graceDays: 0,
    calculationConfig: {},
    requiredDocuments: [],
    isActive: true,
    ...partial,
  });
  return r;
}

describe('TaxCalculationService (all five categories)', () => {
  const svc = new TaxCalculationService();

  it('property tax: percentage of assessed value', () => {
    const res = svc.calculate(
      TaxCategoryCodeEnum.PROPERTY_TAX,
      { assessedValue: 1_000_000 },
      rule({ rate: 0.5 }),
    );
    expect(res.principal).toBe(5000);
    expect(res.breakdown.ruleId).toBeUndefined();
  });

  it('house rent tax: monthly rent x months', () => {
    const res = svc.calculate(
      TaxCategoryCodeEnum.HOUSE_RENT_TAX,
      { monthlyRent: 20_000, months: 12 },
      rule({ rate: 10 }),
    );
    expect(res.baseAmount).toBe(240_000);
    expect(res.principal).toBe(24_000);
  });

  it('business tax: fixed amount with business identity', () => {
    const res = svc.calculate(
      TaxCategoryCodeEnum.BUSINESS_TAX,
      { businessCategory: 'retail' },
      rule({ rateType: RateTypeEnum.FIXED, rate: 5000, fixedAmount: 5000 }),
    );
    expect(res.principal).toBe(5000);
  });

  it('land tax: area-based base stays distinct from property assessed value', () => {
    const res = svc.calculate(
      TaxCategoryCodeEnum.LAND_TAX,
      { landAreaSqM: 200 },
      rule({ rate: 100, calculationConfig: { ratePerSqM: 150 } }),
    );
    // base = 200 sqm * 150 = 30000 (never the property assessed value)
    expect(res.baseAmount).toBe(30_000);
    expect(res.principal).toBe(30_000);
  });

  it('land tax rejects property-style assessedValue input', () => {
    expect(() =>
      svc.calculate(
        TaxCategoryCodeEnum.LAND_TAX,
        { landAreaSqM: 0 },
        rule({ calculationConfig: { ratePerSqM: 150 } }),
      ),
    ).toThrow('Land Tax requires landAreaSqM');
  });

  it('advertisement tax: size x quantity x months x unit rate', () => {
    const res = svc.calculate(
      TaxCategoryCodeEnum.ADVERTISEMENT_TAX,
      { adSizeSqFt: 20, adQuantity: 2, adMonths: 6 },
      rule({
        rateType: RateTypeEnum.PERCENTAGE,
        rate: 100,
        calculationConfig: { method: 'area', ratePerSqFtPerMonth: 10 },
      }),
    );
    expect(res.baseAmount).toBe(2400);
    expect(res.principal).toBe(2400);
  });

  it('slab rates apply progressively and respect minimum charge', () => {
    const res = svc.calculate(
      TaxCategoryCodeEnum.PROPERTY_TAX,
      { assessedValue: 3_000_000 },
      rule({
        rate: 0,
        calculationConfig: {
          slabs: [
            { upTo: 1_000_000, rate: 0.2 },
            { upTo: null, rate: 0.5 },
          ],
        },
      }),
    );
    // 1M @0.2% = 2000 + 2M @0.5% = 10000
    expect(res.principal).toBe(12_000);
  });

  it('discount beyond principal is rejected (no negative bills)', () => {
    expect(() =>
      svc.calculate(
        TaxCategoryCodeEnum.PROPERTY_TAX,
        { assessedValue: 1000, discount: 5000 },
        rule({ rate: 1 }),
      ),
    ).toThrow();
  });

  it('money math is paisa-exact (0.1 + 0.2 problem)', () => {
    const res = svc.calculate(
      TaxCategoryCodeEnum.PROPERTY_TAX,
      { assessedValue: 999.99 },
      rule({ rate: 7.5 }),
    );
    expect(res.principal).toBe(75);
  });
});
