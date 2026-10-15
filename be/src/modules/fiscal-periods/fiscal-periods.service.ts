import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FiscalPeriodEntity } from './entities/fiscal-period.entity';
import { CreateFiscalPeriodDto } from './dto/create-fiscal-period.dto';

@Injectable()
export class FiscalPeriodsService {
  constructor(
    @InjectRepository(FiscalPeriodEntity)
    private readonly repo: Repository<FiscalPeriodEntity>,
  ) {}

  async create(dto: CreateFiscalPeriodDto): Promise<FiscalPeriodEntity> {
    if (dto.endsOn < dto.startsOn) {
      throw new BadRequestException('endsOn cannot be before startsOn');
    }
    const clash = await this.repo.findOne({
      where: {
        label: dto.label,
        categoryCode: dto.categoryCode,
        periodType: dto.periodType,
      },
    });
    if (clash) {
      throw new BadRequestException(
        'This fiscal period already exists for the category',
      );
    }
    return this.repo.save(this.repo.create({ ...dto }));
  }

  findAll(): Promise<FiscalPeriodEntity[]> {
    return this.repo.find({ order: { startsOn: 'DESC' } });
  }

  async findOne(id: string): Promise<FiscalPeriodEntity> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException(`Fiscal period '${id}' not found`);
    return entity;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repo.softDelete(id);
  }
}
