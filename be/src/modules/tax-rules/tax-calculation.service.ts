import { BadRequestException, Injectable } from '@nestjs/common';
import { TaxCategoryCodeEnum } from '../../common/enums/tax-category-code.enum';
import { RateTypeEnum } from '../../common/enums/rate-type.enum';
import { BillingPeriodEnum } from '../../common/enums/billing-period.enum';
import { TaxRuleEntity } from './entities/tax-rule.entity';
import { BillCalculationBreakdown } from '../bills/entities/bill.entity';
import {
  fromPaisa,
  percentOf,
  roundNpr,
  toPaisa,
} from '../../common/utils/money.util';

export interface AssessmentInputs {
  assessedValue?: number;
  annualRent?: number;
  monthlyRent?: number;
  months?: number;
  annualTurnover?: number;
  landAreaSqM?: number;
  adSizeSqFt?: number;
  adQuantity?: number;
  adMonths?: number;
  deductions?: number;
  discount?: number;
  [key: string]: unknown;
}

export interface CalculationResult {
  principal: number;
  baseAmount: number;
  breakdown: BillCalculationBreakdown;
}

/**
 * Shared tax-calculation framework. Each of the five categories has its own
 * base-derivation strategy below; the rate/slab/minimum application is shared.
 *
 * Money is computed in integer paisa. Property Tax and Land Tax use
 * deliberately distinct inputs (composite assessed value vs land-area-based
 * base) so the same base is never double-charged automatically.
 */
@Injectable()
export class TaxCalculationService {
  calculate(
    categoryCode: TaxCategoryCodeEnum,
    inputs: AssessmentInputs,
    rule: TaxRuleEntity,
  ): CalculationResult {
    const base = this.deriveBase(categoryCode, inputs, rule);
    const discount = roundNpr(inputs.discount ?? 0);
    if (discount < 0)
      throw new BadRequestException('Discount cannot be negative');

    let principal: number;
    const slabDetails: Array<{ label: string; amount: number }> = [];
    const slabs = rule.calculationConfig?.slabs;

    if (slabs && slabs.length > 0) {
      principal = this.applySlabs(base, slabs, slabDetails);
    } else if (rule.rateType === RateTypeEnum.FIXED) {
      const fixed = Number(rule.fixedAmount ?? rule.rate);
      if (!(fixed > 0)) {
        throw new BadRequestException(
          'Fixed-amount rule has no usable fixed amount configured',
        );
      }
      principal = roundNpr(fixed);
    } else {
      principal = percentOf(base, Number(rule.rate));
    }

    const minAmount = Number(rule.minAmount ?? 0);
    if (minAmount > 0 && toPaisa(principal) < toPaisa(minAmount)) {
      principal = roundNpr(minAmount);
    }
    if (toPaisa(discount) > toPaisa(principal)) {
      throw new BadRequestException(
        'Discount cannot exceed the assessed principal',
      );
    }

    const totalPayable = fromPaisa(toPaisa(principal) - toPaisa(discount));
    return {
      principal,
      baseAmount: base,
      breakdown: {
        baseAmount: base,
        rateApplied: Number(rule.rate),
        rateType: rule.rateType,
        slabDetails: slabDetails.length ? slabDetails : undefined,
        discount,
        penalty: 0,
        totalPayable,
        ruleId: rule.id,
        ruleName: rule.name,
        inputs: { ...inputs },
      },
    };
  }

  private deriveBase(
    categoryCode: TaxCategoryCodeEnum,
    inputs: AssessmentInputs,
    rule: TaxRuleEntity,
  ): number {
    const cfg = rule.calculationConfig ?? {};
    switch (categoryCode) {
      case TaxCategoryCodeEnum.PROPERTY_TAX: {
        const v = Number(inputs.assessedValue ?? 0);
        if (!(v > 0)) {
          throw new BadRequestException(
            'Property Tax requires a positive assessedValue (municipal valuation)',
          );
        }
        return roundNpr(v);
      }
      case TaxCategoryCodeEnum.HOUSE_RENT_TAX: {
        const months = Number(
          inputs.months ??
            (rule.billingPeriod === BillingPeriodEnum.MONTHLY ? 1 : 12),
        );
        const monthly = Number(inputs.monthlyRent ?? 0);
        const annual = Number(inputs.annualRent ?? 0);
        let gross: number;
        if (monthly > 0) gross = monthly * months;
        else if (annual > 0)
          gross =
            rule.billingPeriod === BillingPeriodEnum.MONTHLY
              ? annual / 12
              : annual;
        else {
          throw new BadRequestException(
            'House Rent Tax requires monthlyRent or annualRent',
          );
        }
        const deductions = Number(inputs.deductions ?? cfg.deductions ?? 0);
        const exempt = Number(cfg.exemptUpTo ?? 0);
        return roundNpr(Math.max(0, gross - deductions - exempt));
      }
      case TaxCategoryCodeEnum.BUSINESS_TAX: {
        if (rule.rateType === RateTypeEnum.FIXED) {
          if (!inputs.businessCategory && !inputs.businessName) {
            throw new BadRequestException(
              'Business Tax requires business identification (businessCategory)',
            );
          }
          return roundNpr(Number(rule.fixedAmount ?? rule.rate));
        }
        const turnover = Number(inputs.annualTurnover ?? 0);
        if (!(turnover > 0)) {
          throw new BadRequestException(
            'Percentage Business Tax requires annualTurnover',
          );
        }
        return roundNpr(turnover);
      }
      case TaxCategoryCodeEnum.LAND_TAX: {
        // Distinct from Property Tax: area-based base, never the composite
        // property assessed value.
        const area = Number(inputs.landAreaSqM ?? 0);
        if (!(area > 0)) {
          throw new BadRequestException('Land Tax requires landAreaSqM');
        }
        const ratePerSqM = Number(cfg.ratePerSqM ?? 0);
        const landClassMultiplier = Number(
          (inputs.landClassMultiplier as number) ??
            cfg.landClassMultiplier ??
            1,
        );
        if (rule.rateType === RateTypeEnum.FIXED && ratePerSqM <= 0) {
          return roundNpr(Number(rule.fixedAmount ?? rule.rate));
        }
        if (!(ratePerSqM > 0)) {
          throw new BadRequestException(
            'Land Tax rule has no ratePerSqM configured in calculation_config',
          );
        }
        return roundNpr(area * ratePerSqM * landClassMultiplier);
      }
      case TaxCategoryCodeEnum.ADVERTISEMENT_TAX: {
        const size = Number(inputs.adSizeSqFt ?? 0);
        const qty = Number(inputs.adQuantity ?? 1);
        const months = Number(inputs.adMonths ?? 12);
        const ratePerUnit = Number(
          cfg.ratePerSqFtPerMonth ?? cfg.ratePerUnit ?? 0,
        );
        const method = (cfg.method as string) ?? 'fixed';
        if (method === 'fixed' || ratePerUnit <= 0) {
          if (!(Number(rule.fixedAmount ?? rule.rate) > 0)) {
            throw new BadRequestException(
              'Advertisement Tax rule needs fixedAmount or ratePerSqFtPerMonth config',
            );
          }
          return roundNpr(Number(rule.fixedAmount ?? rule.rate));
        }
        if (!(size > 0)) {
          throw new BadRequestException(
            'Advertisement Tax requires adSizeSqFt',
          );
        }
        if (method === 'per_board') return roundNpr(ratePerUnit * qty * months);
        return roundNpr(size * qty * months * ratePerUnit);
      }
      default:
        throw new BadRequestException(
          `Unsupported tax category: ${String(categoryCode)}`,
        );
    }
  }

  private applySlabs(
    base: number,
    slabs: Array<{ upTo: number | null; rate: number }>,
    details: Array<{ label: string; amount: number }>,
  ): number {
    let remaining = toPaisa(base);
    let lower = 0;
    let total = 0;
    const sorted = [...slabs].sort(
      (a, b) => (a.upTo ?? Infinity) - (b.upTo ?? Infinity),
    );
    for (const slab of sorted) {
      if (remaining <= 0) break;
      const upper = slab.upTo == null ? Infinity : toPaisa(slab.upTo);
      const taxable = Math.min(remaining, Math.max(0, upper - toPaisa(lower)));
      if (taxable <= 0) {
        lower = slab.upTo ?? lower;
        continue;
      }
      const slabTax = Math.round((taxable * Number(slab.rate)) / 100);
      total += slabTax;
      details.push({
        label: `Slab ${lower}–${slab.upTo ?? 'above'} @ ${slab.rate}%`,
        amount: fromPaisa(slabTax),
      });
      remaining -= taxable;
      lower = slab.upTo ?? lower;
    }
    return fromPaisa(total);
  }
}
