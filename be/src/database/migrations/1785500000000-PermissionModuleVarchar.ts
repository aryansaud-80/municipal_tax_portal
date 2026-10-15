import { MigrationInterface, QueryRunner } from 'typeorm';

export class PermissionModuleVarchar1785500000000 implements MigrationInterface {
  name = 'PermissionModuleVarchar1785500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // The permissions.module enum cannot gain new values inside a
    // transaction (Postgres restriction on ALTER TYPE ... ADD VALUE), so
    // convert it to varchar. TypeORM entity stays a TS enum; with
    // synchronize:false this is runtime-compatible (plain strings).
    await queryRunner.query(
      `ALTER TABLE "permissions" ALTER COLUMN "module" TYPE varchar USING "module"::text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "permissions" ALTER COLUMN "module" TYPE "permissions_module_enum" USING "module"::"permissions_module_enum"`,
    );
  }
}
