import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateAuthenticationTable1784640096027 implements MigrationInterface {
    name = 'UpdateAuthenticationTable1784640096027'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_a000cca60bcf04454e727699490"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "phone"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "username" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username")`);
        await queryRunner.query(`ALTER TABLE "users" ADD "phone_number" character varying(15) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_17d1817f241f10a3dbafb169fd2" UNIQUE ("phone_number")`);
        await queryRunner.query(`ALTER TABLE "users" ADD "is_system" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "permissions" DROP COLUMN "module"`);
        await queryRunner.query(`CREATE TYPE "public"."permissions_module_enum" AS ENUM('auth', 'user', 'role', 'permission', 'dashboard', 'citizen', 'propertyTax', 'houseRentTax', 'businessTax', 'landTax', 'vehicleTax', 'payment', 'receipt', 'report', 'auditLog', 'setting')`);
        await queryRunner.query(`ALTER TABLE "permissions" ADD "module" "public"."permissions_module_enum" NOT NULL`);
        await queryRunner.query(`ALTER TABLE "permissions" DROP COLUMN "action"`);
        await queryRunner.query(`CREATE TYPE "public"."permissions_action_enum" AS ENUM('create', 'view', 'update', 'delete', 'approve', 'reject', 'verify', 'assign', 'remove', 'import', 'export', 'print', 'restore')`);
        await queryRunner.query(`ALTER TABLE "permissions" ADD "action" "public"."permissions_action_enum" NOT NULL`);
        await queryRunner.query(`ALTER TABLE "permissions" ADD CONSTRAINT "UQ_48ce552495d14eae9b187bb6716" UNIQUE ("name")`);
        await queryRunner.query(`ALTER TABLE "permissions" ADD CONSTRAINT "UQ_8dad765629e83229da6feda1c1d" UNIQUE ("code")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "permissions" DROP CONSTRAINT "UQ_8dad765629e83229da6feda1c1d"`);
        await queryRunner.query(`ALTER TABLE "permissions" DROP CONSTRAINT "UQ_48ce552495d14eae9b187bb6716"`);
        await queryRunner.query(`ALTER TABLE "permissions" DROP COLUMN "action"`);
        await queryRunner.query(`DROP TYPE "public"."permissions_action_enum"`);
        await queryRunner.query(`ALTER TABLE "permissions" ADD "action" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "permissions" DROP COLUMN "module"`);
        await queryRunner.query(`DROP TYPE "public"."permissions_module_enum"`);
        await queryRunner.query(`ALTER TABLE "permissions" ADD "module" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_system"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_17d1817f241f10a3dbafb169fd2"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "phone_number"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "username"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "phone" character varying(15) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_a000cca60bcf04454e727699490" UNIQUE ("phone")`);
    }

}
