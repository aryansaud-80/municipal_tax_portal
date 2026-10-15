import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaxRuleEntity } from './entities/tax-rule.entity';
import { TaxCategoryEntity } from '../tax-categories/entities/tax-category.entity';
import { CreateTaxRuleDto } from './dto/create-tax-rule.dto';
import { UpdateTaxRuleDto } from './dto/update-tax-rule.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class TaxRulesService {
  constructor(
    @InjectRepository(TaxRuleEntity)
    private readonly repo: Repository<TaxRuleEntity>,
    @InjectRepository(TaxCategoryEntity)
    private readonly categoryRepo: Repository<TaxCategoryEntity>,
    private readonly audit: AuditService,
  ) {}

  async create(
    dto: CreateTaxRuleDto,
    actorId?: string,
  ): Promise<TaxRuleEntity> {
    const category = await this.categoryRepo.findOne({
      where: { id: dto.taxCategoryId },
    });
    if (!category) throw new NotFoundException('Tax category not found');
    this.validateDates(dto.effectiveFrom, dto.effectiveTo);
    await this.assertNoOverlap(
      dto.taxCategoryId,
      dto.fiscalYear,
      dto.billingPeriod,
      dto.effectiveFrom,
      dto.effectiveTo,
    );
    const entity = await this.repo.save(
      this.repo.create({ ...dto, createdBy: actorId }),
    );
    await this.audit.record(
      'tax-rule.create',
      'tax-rule',
      entity.id,
      {
        name: entity.name,
        fiscalYear: entity.fiscalYear,
      },
      actorId,
    );
    return entity;
  }

  async findAll(filters: {
    taxCategoryId?: string;
    fiscalYear?: string;
    activeOnly?: boolean;
  }): Promise<TaxRuleEntity[]> {
    const qb = this.repo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.taxCategory', 'c')
      .orderBy('r.fiscalYear', 'DESC')
      .addOrderBy('r.createdAt', 'DESC');
    if (filters.taxCategoryId)
      qb.andWhere('r.taxCategoryId = :cat', { cat: filters.taxCategoryId });
    if (filters.fiscalYear)
      qb.andWhere('r.fiscalYear = :fy', { fy: filters.fiscalYear });
    if (filters.activeOnly) qb.andWhere('r.isActive = true');
    return qb.getMany();
  }

  async findOne(id: string): Promise<TaxRuleEntity> {
    const entity = await this.repo.findOne({
      where: { id },
      relations: { taxCategory: true },
    });
    if (!entity) throw new NotFoundException(`Tax rule '${id}' not found`);
    return entity;
  }

  async findActiveRule(
    taxCategoryId: string,
    fiscalYear: string,
    onDate = new Date(),
  ): Promise<TaxRuleEntity | null> {
    const day = onDate.toISOString().slice(0, 10);
    return this.repo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.taxCategory', 'c')
      .where('r.taxCategoryId = :cat', { cat: taxCategoryId })
      .andWhere('r.fiscalYear = :fy', { fy: fiscalYear })
      .andWhere('r.isActive = true')
      .andWhere('r.effectiveFrom <= :day', { day })
      .andWhere('(r.effectiveTo IS NULL OR r.effectiveTo >= :day)', { day })
      .orderBy('r.effectiveFrom', 'DESC')
      .getOne();
  }

  async update(
    id: string,
    dto: UpdateTaxRuleDto,
    actorId?: string,
  ): Promise<TaxRuleEntity> {
    const entity = await this.findOne(id);
    const merged = { ...entity, ...dto };
    this.validateDates(
      merged.effectiveFrom ?? entity.effectiveFrom,
      merged.effectiveTo ?? entity.effectiveTo,
    );
    if (
      dto.taxCategoryId !== undefined ||
      dto.fiscalYear !== undefined ||
      dto.billingPeriod !== undefined ||
      dto.effectiveFrom !== undefined ||
      dto.effectiveTo !== undefined ||
      dto.isActive !== undefined
    ) {
      await this.assertNoOverlap(
        dto.taxCategoryId ?? entity.taxCategoryId,
        dto.fiscalYear ?? entity.fiscalYear,
        dto.billingPeriod ?? entity.billingPeriod,
        dto.effectiveFrom ?? entity.effectiveFrom,
        dto.effectiveTo ?? entity.effectiveTo,
        id,
      );
    }
    Object.assign(entity, dto);
    const saved = await this.repo.save(entity);
    await this.audit.record(
      'tax-rule.update',
      'tax-rule',
      saved.id,
      { ...dto },
      actorId,
    );
    return saved;
  }

  async deactivate(id: string, actorId?: string): Promise<TaxRuleEntity> {
    const entity = await this.findOne(id);
    entity.isActive = false;
    const saved = await this.repo.save(entity);
    await this.audit.record('tax-rule.deactivate', 'tax-rule', id, {}, actorId);
    return saved;
  }

  private validateDates(from?: string, to?: string): void {
    if (from && to && to < from) {
      throw new BadRequestException(
        'effectiveTo cannot be before effectiveFrom',
      );
    }
  }

  private async assertNoOverlap(
    taxCategoryId: string,
    fiscalYear: string,
    billingPeriod: string,
    effectiveFrom: string,
    effectiveTo?: string,
    excludeId?: string,
  ): Promise<void> {
    const qb = this.repo
      .createQueryBuilder('r')
      .where('r.taxCategoryId = :cat', { cat: taxCategoryId })
      .andWhere('r.fiscalYear = :fy', { fy: fiscalYear })
      .andWhere('r.billingPeriod = :bp', { bp: billingPeriod })
      .andWhere('r.isActive = true')
      .andWhere('r.effectiveFrom <= :to', { to: effectiveTo ?? '9999-12-31' })
      .andWhere('(r.effectiveTo IS NULL OR r.effectiveTo >= :from)', {
        from: effectiveFrom,
      });
    if (excludeId) qb.andWhere('r.id != :id', { id: excludeId });
    const clash = await qb.getOne();
    if (clash) {
      throw new BadRequestException(
        `An active rule already covers this category/fiscal-year/period (rule '${clash.name}'). Deactivate it first.`,
      );
    }
  }
}
