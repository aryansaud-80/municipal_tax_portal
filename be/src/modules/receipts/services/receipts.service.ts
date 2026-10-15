import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { ReceiptEntity } from '../entities/receipt.entity';
import { findEntityOrFail } from '../../../common/utils/find-or-fail.util';

@Injectable()
export class ReceiptsService {
  constructor(
    @InjectRepository(ReceiptEntity)
    private readonly repo: Repository<ReceiptEntity>,
  ) {}

  async create(
    paymentId: string,
    userId: string,
    taxAssessmentId: string,
    amount: number,
  ): Promise<ReceiptEntity> {
    const receiptNumber = await this.generateReceiptNumber();
    const entity = this.repo.create({
      receiptNumber,
      paymentId,
      userId,
      taxAssessmentId,
      amount,
    });
    return this.repo.save(entity);
  }

  async findAll(query: { page?: number; limit?: number; userId?: string }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where: FindOptionsWhere<ReceiptEntity> = {};
    if (query.userId) where.userId = query.userId;
    const [data, total] = await this.repo.findAndCount({
      where,
      relations: {
        payment: true,
        taxAssessment: { taxCategory: true },
      },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string): Promise<ReceiptEntity> {
    return findEntityOrFail(this.repo, { id }, 'Receipt', id);
  }

  async findByPaymentId(paymentId: string): Promise<ReceiptEntity | null> {
    return this.repo.findOne({ where: { paymentId } });
  }

  async findByUserId(userId: string): Promise<ReceiptEntity[]> {
    return this.repo.find({
      where: { userId },
      relations: {
        payment: true,
        taxAssessment: { taxCategory: true },
      },
      order: { createdAt: 'DESC' },
    });
  }

  private async generateReceiptNumber(): Promise<string> {
    const count = await this.repo.count();
    const num = count + 1;
    return `RCP-${String(num).padStart(6, '0')}`;
  }
}
