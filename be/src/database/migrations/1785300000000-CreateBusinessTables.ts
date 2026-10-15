import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBusinessTables1785300000000 implements MigrationInterface {
  name = 'CreateBusinessTables1785300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(
      `CREATE TYPE "property_status_enum" AS ENUM('active', 'inactive', 'sold', 'demolished')`,
    );
    await queryRunner.query(
      `CREATE TYPE "property_type_enum" AS ENUM('residential', 'commercial', 'industrial', 'agricultural')`,
    );
    await queryRunner.query(
      `CREATE TYPE "tax_category_code_enum" AS ENUM('property_tax', 'house_rent_tax', 'business_tax', 'land_tax', 'advertisement_tax')`,
    );
    await queryRunner.query(
      `CREATE TYPE "rate_type_enum" AS ENUM('percentage', 'fixed')`,
    );
    await queryRunner.query(
      `CREATE TYPE "tax_assessment_status_enum" AS ENUM('pending', 'partially_paid', 'paid', 'overdue', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TYPE "payment_method_enum" AS ENUM('khalti', 'esewa', 'cash')`,
    );
    await queryRunner.query(
      `CREATE TYPE "payment_status_enum" AS ENUM('pending', 'processing', 'success', 'failed', 'cancelled', 'verified')`,
    );
    await queryRunner.query(
      `CREATE TYPE "notification_type_enum" AS ENUM('info', 'warning', 'success', 'error')`,
    );

    // Properties
    await queryRunner.query(`
      CREATE TABLE "properties" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        "property_number" varchar(50) NOT NULL UNIQUE,
        "user_id" uuid NOT NULL,
        "owner_name" varchar(255) NOT NULL,
        "address" varchar(500) NOT NULL,
        "ward" int NOT NULL,
        "tole" varchar(255),
        "area_sq_meters" decimal(12,2) NOT NULL,
        "property_type" "property_type_enum" NOT NULL DEFAULT 'residential',
        "status" "property_status_enum" NOT NULL DEFAULT 'active',
        "land_ownership_number" varchar(100),
        "floor_count" int NOT NULL DEFAULT 1,
        "building_age_years" int,
        CONSTRAINT "fk_properties_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Tax Categories
    await queryRunner.query(`
      CREATE TABLE "tax_categories" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        "name" varchar(255) NOT NULL,
        "code" "tax_category_code_enum" NOT NULL UNIQUE,
        "description" text,
        "rate_type" "rate_type_enum" NOT NULL DEFAULT 'percentage',
        "rate" decimal(10,4) NOT NULL DEFAULT 0,
        "min_amount" decimal(12,2) NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true
      )
    `);

    // Tax Assessments
    await queryRunner.query(`
      CREATE TABLE "tax_assessments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        "assessment_number" varchar(50) NOT NULL UNIQUE,
        "user_id" uuid NOT NULL,
        "property_id" uuid,
        "tax_category_id" uuid NOT NULL,
        "fiscal_year" varchar(20) NOT NULL,
        "assessed_value" decimal(14,2) NOT NULL DEFAULT 0,
        "tax_amount" decimal(14,2) NOT NULL DEFAULT 0,
        "discount" decimal(14,2) NOT NULL DEFAULT 0,
        "penalty" decimal(14,2) NOT NULL DEFAULT 0,
        "total_due" decimal(14,2) NOT NULL DEFAULT 0,
        "amount_paid" decimal(14,2) NOT NULL DEFAULT 0,
        "status" "tax_assessment_status_enum" NOT NULL DEFAULT 'pending',
        "due_date" date NOT NULL,
        "notes" text,
        CONSTRAINT "fk_tax_assessments_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_tax_assessments_property" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_tax_assessments_category" FOREIGN KEY ("tax_category_id") REFERENCES "tax_categories"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_tax_assessments_user" ON "tax_assessments" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_tax_assessments_status" ON "tax_assessments" ("status")`,
    );

    // Payments
    await queryRunner.query(`
      CREATE TABLE "payments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        "payment_number" varchar(50) NOT NULL UNIQUE,
        "user_id" uuid NOT NULL,
        "tax_assessment_id" uuid NOT NULL,
        "amount" decimal(14,2) NOT NULL,
        "method" "payment_method_enum" NOT NULL,
        "gateway_transaction_id" varchar(255),
        "status" "payment_status_enum" NOT NULL DEFAULT 'pending',
        "paid_at" timestamptz,
        "verified_at" timestamptz,
        "verified_by" uuid,
        "failure_reason" text,
        CONSTRAINT "fk_payments_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_payments_assessment" FOREIGN KEY ("tax_assessment_id") REFERENCES "tax_assessments"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_payments_user" ON "payments" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_payments_status" ON "payments" ("status")`,
    );

    // Receipts
    await queryRunner.query(`
      CREATE TABLE "receipts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        "receipt_number" varchar(50) NOT NULL UNIQUE,
        "payment_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "tax_assessment_id" uuid NOT NULL,
        "amount" decimal(14,2) NOT NULL,
        "issued_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_receipts_payment" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_receipts_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_receipts_assessment" FOREIGN KEY ("tax_assessment_id") REFERENCES "tax_assessments"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_receipts_user" ON "receipts" ("user_id")`,
    );

    // Notifications
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        "user_id" uuid NOT NULL,
        "title" varchar(255) NOT NULL,
        "message" text NOT NULL,
        "type" "notification_type_enum" NOT NULL DEFAULT 'info',
        "is_read" boolean NOT NULL DEFAULT false,
        "link" varchar(500),
        CONSTRAINT "fk_notifications_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_notifications_user" ON "notifications" ("user_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TABLE "receipts"`);
    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(`DROP TABLE "tax_assessments"`);
    await queryRunner.query(`DROP TABLE "tax_categories"`);
    await queryRunner.query(`DROP TABLE "properties"`);
    await queryRunner.query(`DROP TYPE "notification_type_enum"`);
    await queryRunner.query(`DROP TYPE "payment_status_enum"`);
    await queryRunner.query(`DROP TYPE "payment_method_enum"`);
    await queryRunner.query(`DROP TYPE "tax_assessment_status_enum"`);
    await queryRunner.query(`DROP TYPE "rate_type_enum"`);
    await queryRunner.query(`DROP TYPE "tax_category_code_enum"`);
    await queryRunner.query(`DROP TYPE "property_type_enum"`);
    await queryRunner.query(`DROP TYPE "property_status_enum"`);
  }
}
