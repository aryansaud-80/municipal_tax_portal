import { NotFoundException } from '@nestjs/common';
import { FindOneOptions, FindOptionsWhere, Repository } from 'typeorm';

export async function findEntityOrFail<T extends object>(
  repository: Repository<T>,
  where: FindOptionsWhere<T> | FindOptionsWhere<T>[],
  entityLabel: string,
  identifier?: string,
  options?: Omit<FindOneOptions<T>, 'where'>,
): Promise<T> {
  const entity = await repository.findOne({ where, ...options });

  if (!entity) {
    const idSuffix = identifier ? ` '${identifier}'` : '';
    throw new NotFoundException(`${entityLabel} with ID${idSuffix} not found`);
  }

  return entity;
}

export async function findEntitiesOrFail<T extends object>(
  repository: Repository<T>,
  where: FindOptionsWhere<T> | FindOptionsWhere<T>[],
  expectedCount: number,
  entityLabel: string,
  missingIdentifiers?: string[],
): Promise<T[]> {
  const entities = await repository.find({ where });

  if (entities.length !== expectedCount) {
    const detail = missingIdentifiers?.length
      ? `: ${missingIdentifiers.join(', ')}`
      : '';
    throw new NotFoundException(`${entityLabel}(s) not found${detail}`);
  }

  return entities;
}
