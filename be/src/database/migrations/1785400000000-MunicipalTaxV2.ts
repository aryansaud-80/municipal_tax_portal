import { MigrationInterface, QueryRunner } from 'typeorm';

export class MunicipalTaxV21785400000000 implements MigrationInterface {
  name = 'MunicipalTaxV21785400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "property_application_status_enum" AS ENUM('pending', 'correction_requested', 'approved', 'rejected')`,
    );
    await queryRunner.query(
      `CREATE TYPE "verification_status_enum" AS ENUM('unverified', 'pending', 'verified', 'rejected')`,
    );
    await queryRunner.query(
      `CREATE TYPE "billing_period_enum" AS ENUM('annual', 'monthly', 'one_time')`,
    );
    await queryRunner.query(
      `CREATE TYPE "penalty_base_enum" AS ENUM('principal', 'outstanding')`,
    );
    await queryRunner.query(
      `CREATE TYPE "bill_status_enum" AS ENUM('issued', 'partially_paid', 'paid', 'overdue', 'cancelled', 'void')`,
    );

    await queryRunner.query(`
      CREATE TABLE "fiscal_periods" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        "label" varchar(20) NOT NULL,
        "category_code" varchar(50) NOT NULL,
        "period_type" "billing_period_enum" NOT NULL,
        "starts_on" date NOT NULL,
        "ends_on" date NOT NULL,
        "due_date" date,
        "is_active" boolean NOT NULL DEFAULT true
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_fiscal_period_label" ON "fiscal_periods" ("label", "category_code", "period_type")`,
    );

    await queryRunner.query(`
      CREATE TABLE "tax_rules" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        "tax_category_id" uuid NOT NULL REFERENCES "tax_categories"("id") ON DELETE RESTRICT,
        "name" varchar(255) NOT NULL,
        "fiscal_year" varchar(20) NOT NULL,
        "billing_period" "billing_period_enum" NOT NULL,
        "effective_from" date NOT NULL,
        "effective_to" date,
        "rate_type" "rate_type_enum" NOT NULL,
        "rate" decimal(10,4) NOT NULL DEFAULT 0,
        "min_amount" decimal(14,2) NOT NULL DEFAULT 0,
        "fixed_amount" decimal(14,2),
        "penalty_percent" decimal(7,4) NOT NULL DEFAULT 0,
        "penalty_base" "penalty_base_enum" NOT NULL DEFAULT 'outstanding',
        "grace_days" int NOT NULL DEFAULT 0,
        "due_date" date,
        "calculation_config" jsonb NOT NULL DEFAULT '{}',
        "required_documents" jsonb NOT NULL DEFAULT '[]',
        "is_active" boolean NOT NULL DEFAULT true,
        "created_by" uuid
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_tax_rule_active" ON "tax_rules" ("tax_category_id", "fiscal_year", "billing_period") WHERE "is_active" = true`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_tax_rules_category" ON "tax_rules" ("tax_category_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "property_applications" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        "application_number" varchar(50) NOT NULL UNIQUE,
        "applicant_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "owner_name" varchar(255) NOT NULL,
        "address" varchar(500) NOT NULL,
        "ward" int NOT NULL,
        "tole" varchar(255),
        "area_sq_meters" decimal(12,2) NOT NULL,
        "property_type" "property_type_enum" NOT NULL,
        "land_ownership_number" varchar(100),
        "floor_count" int NOT NULL DEFAULT 1,
        "building_age_years" int,
        "status" "property_application_status_enum" NOT NULL DEFAULT 'pending',
        "review_notes" text,
        "reviewed_by" uuid,
        "reviewed_at" timestamptz,
        "property_id" uuid REFERENCES "properties"("id") ON DELETE SET NULL,
        "resubmission_count" int NOT NULL DEFAULT 0,
        "submitted_by_staff_id" uuid
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_prop_apps_applicant" ON "property_applications" ("applicant_user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_prop_apps_status" ON "property_applications" ("status")`,
    );

    await queryRunner.query(`
      CREATE TABLE "property_documents" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        "application_id" uuid REFERENCES "property_applications"("id") ON DELETE CASCADE,
        "property_id" uuid REFERENCES "properties"("id") ON DELETE CASCADE,
        "file_name" varchar(255) NOT NULL,
        "stored_path" varchar(500) NOT NULL,
        "mime_type" varchar(100) NOT NULL,
        "size_bytes" int NOT NULL,
        "uploaded_by" uuid NOT NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "property_ownerships" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        "property_id" uuid NOT NULL REFERENCES "properties"("id") ON DELETE CASCADE,
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "share_percent" decimal(5,2) NOT NULL DEFAULT 100,
        "acquired_at" timestamptz NOT NULL DEFAULT now(),
        "released_at" timestamptz,
        "is_current" boolean NOT NULL DEFAULT true,
        "acquisition_type" varchar(50) NOT NULL DEFAULT 'registration',
        "recorded_by" uuid,
        "notes" text
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_ownership_property" ON "property_ownerships" ("property_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_ownership_user" ON "property_ownerships" ("user_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "bills" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        "bill_number" varchar(50) NOT NULL UNIQUE,
        "assessment_id" uuid REFERENCES "tax_assessments"("id") ON DELETE SET NULL,
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "property_id" uuid REFERENCES "properties"("id") ON DELETE SET NULL,
        "tax_category_id" uuid NOT NULL REFERENCES "tax_categories"("id") ON DELETE RESTRICT,
        "rule_id" uuid REFERENCES "tax_rules"("id") ON DELETE SET NULL,
        "fiscal_year" varchar(20) NOT NULL,
        "billing_period" "billing_period_enum" NOT NULL DEFAULT 'annual',
        "period_label" varchar(50) NOT NULL,
        "issue_date" date NOT NULL,
        "due_date" date NOT NULL,
        "principal" decimal(14,2) NOT NULL,
        "discount" decimal(14,2) NOT NULL DEFAULT 0,
        "penalty" decimal(14,2) NOT NULL DEFAULT 0,
        "total_payable" decimal(14,2) NOT NULL,
        "amount_paid" decimal(14,2) NOT NULL DEFAULT 0,
        "status" "bill_status_enum" NOT NULL DEFAULT 'issued',
        "calculation_breakdown" jsonb NOT NULL DEFAULT '{}',
        "version" int NOT NULL DEFAULT 1,
        "supersedes_bill_id" uuid,
        "issued_by" uuid,
        "cancelled_reason" text
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_bills_assessment" ON "bills" ("assessment_id") WHERE "assessment_id" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_bills_user" ON "bills" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_bills_status" ON "bills" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_bills_period" ON "bills" ("fiscal_year", "period_label")`,
    );

    await queryRunner.query(`
      CREATE TABLE "fine_assessments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        "fine_number" varchar(50) NOT NULL UNIQUE,
        "bill_id" uuid NOT NULL REFERENCES "bills"("id") ON DELETE CASCADE,
        "rule_id" uuid REFERENCES "tax_rules"("id") ON DELETE SET NULL,
        "base_amount" decimal(14,2) NOT NULL,
        "penalty_base" "penalty_base_enum" NOT NULL,
        "percent" decimal(7,4) NOT NULL,
        "amount" decimal(14,2) NOT NULL,
        "assessed_date" date NOT NULL,
        "period_label" varchar(50) NOT NULL,
        "assessed_by" varchar(20) NOT NULL DEFAULT 'system',
        "waived" boolean NOT NULL DEFAULT false,
        "waiver_reason" text,
        "waived_by" uuid,
        "waived_at" timestamptz
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_fine_bill_period" ON "fine_assessments" ("bill_id", "period_label") WHERE "waived" = false`,
    );

    await queryRunner.query(`
      CREATE TABLE "payment_allocations" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        "payment_id" uuid NOT NULL REFERENCES "payments"("id") ON DELETE CASCADE,
        "bill_id" uuid NOT NULL REFERENCES "bills"("id") ON DELETE RESTRICT,
        "amount" decimal(14,2) NOT NULL,
        "allocated_by" uuid
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "audit_events" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        "actor_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
        "action" varchar(100) NOT NULL,
        "entity" varchar(100) NOT NULL,
        "entity_id" varchar(100),
        "metadata" jsonb NOT NULL DEFAULT '{}',
        "ip_address" varchar(100)
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_audit_entity" ON "audit_events" ("entity", "entity_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_audit_actor" ON "audit_events" ("actor_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "employee_profiles" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        "user_id" uuid NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
        "position" varchar(100),
        "ward_assignments" int[] NOT NULL DEFAULT '{}',
        "can_verify_payments" boolean NOT NULL DEFAULT false,
        "can_assess" boolean NOT NULL DEFAULT false,
        "can_approve_property" boolean NOT NULL DEFAULT false
      )
    `);

    await queryRunner.query(
      `ALTER TABLE "properties" ADD COLUMN "verification_status" "verification_status_enum" NOT NULL DEFAULT 'unverified'`,
    );
    await queryRunner.query(
      `ALTER TABLE "properties" ADD COLUMN "verified_by" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "properties" ADD COLUMN "verified_at" timestamptz`,
    );
    await queryRunner.query(
      `UPDATE "properties" SET "verification_status" = 'verified' WHERE "status" = 'active'`,
    );

    await queryRunner.query(
      `ALTER TABLE "tax_assessments" ADD COLUMN "rule_id" uuid REFERENCES "tax_rules"("id") ON DELETE SET NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "tax_assessments" ADD COLUMN "calculation_breakdown" jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "tax_assessments" ADD COLUMN "is_locked" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "tax_assessments" ADD COLUMN "billing_period" varchar(20) NOT NULL DEFAULT 'annual'`,
    );
    await queryRunner.query(
      `ALTER TABLE "tax_assessments" ADD COLUMN "period_label" varchar(50)`,
    );
    await queryRunner.query(
      `UPDATE "tax_assessments" SET "period_label" = "fiscal_year" WHERE "period_label" IS NULL`,
    );
    await queryRunner.query(
      `UPDATE "tax_assessments" SET "is_locked" = true WHERE "status" IN ('paid', 'partially_paid')`,
    );

    await queryRunner.query(
      `ALTER TABLE "payments" ADD COLUMN "bill_id" uuid REFERENCES "bills"("id") ON DELETE RESTRICT`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD COLUMN "provider" varchar(50) NOT NULL DEFAULT 'office'`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD COLUMN "provider_ref" varchar(255) UNIQUE`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD COLUMN "idempotency_key" varchar(255) UNIQUE`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD COLUMN "raw_callback" jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD COLUMN "receipt_number" varchar(50)`,
    );

    await queryRunner.query(
      `ALTER TABLE "receipts" ADD COLUMN "balance_after" decimal(14,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "receipts" ADD COLUMN "issued_by" uuid`,
    );

    // Backfill ownership history from the current single-owner column.
    await queryRunner.query(`
      INSERT INTO "property_ownerships" ("property_id", "user_id", "share_percent", "acquired_at", "is_current", "acquisition_type")
      SELECT "id", "user_id", 100, COALESCE("created_at", now()), true, 'registration'
      FROM "properties"
    `);

    // Backfill one bill per existing assessment, preserving amounts.
    await queryRunner.query(`
      INSERT INTO "bills" ("bill_number", "assessment_id", "user_id", "property_id", "tax_category_id", "fiscal_year", "billing_period", "period_label", "issue_date", "due_date", "principal", "discount", "penalty", "total_payable", "amount_paid", "status", "calculation_breakdown", "version")
      SELECT
        'BILL-' || SUBSTRING("assessment_number" FROM 5),
        "id",
        "user_id",
        "property_id",
        "tax_category_id",
        "fiscal_year",
        'annual',
        "fiscal_year",
        COALESCE("created_at"::date, CURRENT_DATE),
        "due_date",
        "tax_amount",
        "discount",
        "penalty",
        "total_due",
        "amount_paid",
        CASE "status"
          WHEN 'pending' THEN 'issued'::"bill_status_enum"
          WHEN 'partially_paid' THEN 'partially_paid'::"bill_status_enum"
          WHEN 'paid' THEN 'paid'::"bill_status_enum"
          WHEN 'overdue' THEN 'overdue'::"bill_status_enum"
          WHEN 'cancelled' THEN 'cancelled'::"bill_status_enum"
          ELSE 'issued'::"bill_status_enum"
        END,
        jsonb_build_object('legacyAssessmentId', "id", 'assessedValue', "assessed_value", 'notes', COALESCE("notes", '')),
        1
      FROM "tax_assessments"
    `);

    // Link existing payments to their backfilled bills.
    await queryRunner.query(`
      UPDATE "payments" p SET "bill_id" = b."id"
      FROM "bills" b WHERE b."assessment_id" = p."tax_assessment_id"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "receipts" DROP COLUMN "issued_by"`);
    await queryRunner.query(
      `ALTER TABLE "receipts" DROP COLUMN "balance_after"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP COLUMN "receipt_number"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP COLUMN "raw_callback"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP COLUMN "idempotency_key"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP COLUMN "provider_ref"`,
    );
    await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "provider"`);
    await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "bill_id"`);
    await queryRunner.query(
      `ALTER TABLE "tax_assessments" DROP COLUMN "period_label"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tax_assessments" DROP COLUMN "billing_period"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tax_assessments" DROP COLUMN "is_locked"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tax_assessments" DROP COLUMN "calculation_breakdown"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tax_assessments" DROP COLUMN "rule_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "properties" DROP COLUMN "verified_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "properties" DROP COLUMN "verified_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "properties" DROP COLUMN "verification_status"`,
    );
    await queryRunner.query(`DROP TABLE "employee_profiles"`);
    await queryRunner.query(`DROP TABLE "audit_events"`);
    await queryRunner.query(`DROP TABLE "payment_allocations"`);
    await queryRunner.query(`DROP TABLE "fine_assessments"`);
    await queryRunner.query(`DROP TABLE "bills"`);
    await queryRunner.query(`DROP TABLE "property_ownerships"`);
    await queryRunner.query(`DROP TABLE "property_documents"`);
    await queryRunner.query(`DROP TABLE "property_applications"`);
    await queryRunner.query(`DROP TABLE "tax_rules"`);
    await queryRunner.query(`DROP TABLE "fiscal_periods"`);
    await queryRunner.query(`DROP TYPE "bill_status_enum"`);
    await queryRunner.query(`DROP TYPE "penalty_base_enum"`);
    await queryRunner.query(`DROP TYPE "billing_period_enum"`);
    await queryRunner.query(`DROP TYPE "verification_status_enum"`);
    await queryRunner.query(`DROP TYPE "property_application_status_enum"`);
  }
}
