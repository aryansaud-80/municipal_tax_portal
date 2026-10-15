import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaxCategoryEntity } from '../entities/tax-category.entity';
import { CreateTaxCategoryDto } from '../dto/create-tax-category.dto';
import { UpdateTaxCategoryDto } from '../dto/update-tax-category.dto';
import { findEntityOrFail } from '../../../common/utils/find-or-fail.util';
import { TaxCategoryCodeEnum } from '../../../common/enums/tax-category-code.enum';

@Injectable()
export class TaxCategoriesService {
  constructor(
    @InjectRepository(TaxCategoryEntity)
    private readonly repo: Repository<TaxCategoryEntity>,
  ) {}

  async create(dto: CreateTaxCategoryDto): Promise<TaxCategoryEntity> {
    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }

  async findAll(): Promise<TaxCategoryEntity[]> {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<TaxCategoryEntity> {
    return findEntityOrFail(this.repo, { id }, 'Tax Category', id);
  }

  async findByCode(code: string): Promise<TaxCategoryEntity | null> {
    return this.repo.findOne({
      where: { code: code as TaxCategoryCodeEnum },
    });
  }

  async update(
    id: string,
    dto: UpdateTaxCategoryDto,
  ): Promise<TaxCategoryEntity> {
    const entity = await findEntityOrFail(
      this.repo,
      { id },
      'Tax Category',
      id,
    );
    Object.assign(entity, dto);
    return this.repo.save(entity);
  }

  async toggleActive(id: string): Promise<TaxCategoryEntity> {
    const entity = await findEntityOrFail(
      this.repo,
      { id },
      'Tax Category',
      id,
    );
    entity.isActive = !entity.isActive;
    return this.repo.save(entity);
  }

  async remove(id: string): Promise<void> {
    await findEntityOrFail(this.repo, { id }, 'Tax Category', id);
    await this.repo.softDelete(id);
  }

  async findActive(): Promise<TaxCategoryEntity[]> {
    return this.repo.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }
}
