import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Seeder } from '../base/seeder.interface';
import { RolesEntity } from '../../../modules/roles/entities/roles.entity';
import { ROLE_SEED_DATA } from './role-seed-data';

@Injectable()
export class RoleSeeder implements Seeder {
  private readonly logger = new Logger(RoleSeeder.name);

  async run(manager: EntityManager): Promise<void> {
    const repository = manager.getRepository(RolesEntity);
    let created = 0;
    let updated = 0;
    let restored = 0;

    for (const def of ROLE_SEED_DATA) {
      const existing = await repository.findOne({
        where: { code: def.code },
        withDeleted: true,
      });

      if (!existing) {
        await repository.save(
          repository.create({
            name: def.name,
            code: def.code,
            description: def.description,
            isSystem: def.isSystem,
            isActive: true,
          }),
        );
        created++;
        continue;
      }

      let needsSave = false;

      if (existing.deletedAt) {
        existing.deletedAt = undefined;
        restored++;
        needsSave = true;
      }

      if (
        existing.description !== def.description ||
        existing.name !== def.name
      ) {
        existing.description = def.description;
        existing.name = def.name;
        updated++;
        needsSave = true;
      }

      if (needsSave) {
        await repository.save(existing);
      }
    }

    this.logger.log(
      `Roles: ${created} created, ${updated} updated, ${restored} restored (${ROLE_SEED_DATA.length} defined).`,
    );
  }
}
