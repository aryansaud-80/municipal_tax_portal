import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Seeder } from '../base/seeder.interface';
import { PermissionsEntity } from '../../../modules/permissions/entities/permissions.entity';
import { PERMISSION_SEED_DATA } from './permission-seed-data';

@Injectable()
export class PermissionSeeder implements Seeder {
  private readonly logger = new Logger(PermissionSeeder.name);

  async run(manager: EntityManager): Promise<void> {
    const repository = manager.getRepository(PermissionsEntity);
    let created = 0;
    let updated = 0;
    let restored = 0;

    for (const def of PERMISSION_SEED_DATA) {
      const code = `${def.module}.${def.action}`;

      const existing = await repository.findOne({
        where: { code },
        withDeleted: true,
      });

      if (!existing) {
        await repository.save(
          repository.create({
            module: def.module,
            action: def.action,
            name: def.name,
            code,
            description: def.description,
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
      `Permissions: ${created} created, ${updated} updated, ${restored} restored (${PERMISSION_SEED_DATA.length} defined).`,
    );
  }
}
