import { EntityManager } from 'typeorm';

export interface Seeder {
  run(manager: EntityManager): Promise<void>;
}