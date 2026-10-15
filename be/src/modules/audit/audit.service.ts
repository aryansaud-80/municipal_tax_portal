import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditEventEntity } from './entities/audit-event.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditEventEntity)
    private readonly repo: Repository<AuditEventEntity>,
  ) {}

  async record(
    action: string,
    entity: string,
    entityId?: string,
    metadata: Record<string, unknown> = {},
    actorId?: string,
    ipAddress?: string,
  ): Promise<void> {
    try {
      await this.repo.save(
        this.repo.create({
          action,
          entity,
          entityId,
          metadata,
          actorId,
          ipAddress,
        }),
      );
    } catch {
      // Audit writes must never break the primary transaction path.
    }
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    entity?: string;
    actorId?: string;
  }) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const qb = this.repo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.actor', 'actor')
      .orderBy('a.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    if (query.entity)
      qb.andWhere('a.entity = :entity', { entity: query.entity });
    if (query.actorId)
      qb.andWhere('a.actorId = :actorId', { actorId: query.actorId });
    const [data, total] = await qb.getManyAndCount();
    const sanitized = data.map((row) => ({
      ...row,
      actor: row.actor
        ? {
            id: row.actor.id,
            firstName: row.actor.firstName,
            lastName: row.actor.lastName,
            email: row.actor.email,
          }
        : null,
    }));
    return {
      data: sanitized,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
