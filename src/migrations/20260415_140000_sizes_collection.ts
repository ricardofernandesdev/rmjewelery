import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Refactor product sizes from inline array (products_size_terms) into a
 * proper global "sizes" collection with a hasMany relationship from
 * products -> sizes, plus variant.size now stores the size id.
 *
 * Mirrors the colors migration; products_size_terms is left in place so a
 * later migration can drop it once everything is verified end to end.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- 1. New sizes collection
    CREATE TABLE IF NOT EXISTS "sizes" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "slug" varchar NOT NULL,
      "auto_select" boolean DEFAULT false,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS "sizes_slug_idx" ON "sizes" ("slug");
    CREATE UNIQUE INDEX IF NOT EXISTS "sizes_name_idx" ON "sizes" ("name");
    CREATE INDEX IF NOT EXISTS "sizes_updated_at_idx" ON "sizes" ("updated_at");
    CREATE INDEX IF NOT EXISTS "sizes_created_at_idx" ON "sizes" ("created_at");

    -- 2. Extend products_rels to reference sizes
    ALTER TABLE "products_rels"
      ADD COLUMN IF NOT EXISTS "sizes_id" integer;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'products_rels_sizes_fk'
          AND table_name = 'products_rels'
      ) THEN
        ALTER TABLE "products_rels"
          ADD CONSTRAINT "products_rels_sizes_fk"
          FOREIGN KEY ("sizes_id") REFERENCES "sizes"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "products_rels_sizes_id_idx"
      ON "products_rels" ("sizes_id");

    -- payload_locked_documents_rels needs the same FK column
    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "sizes_id" integer;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'payload_locked_documents_rels_sizes_fk'
          AND table_name = 'payload_locked_documents_rels'
      ) THEN
        ALTER TABLE "payload_locked_documents_rels"
          ADD CONSTRAINT "payload_locked_documents_rels_sizes_fk"
          FOREIGN KEY ("sizes_id") REFERENCES "sizes"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_sizes_id_idx"
      ON "payload_locked_documents_rels" ("sizes_id");

    -- 3. Seed sizes from existing products_size_terms (only if the table
    --    exists — older databases may have already dropped it).
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_name = 'products_size_terms'
      ) THEN
        INSERT INTO "sizes" ("name", "slug")
        SELECT DISTINCT ON (lower(trim(pst."value")))
          trim(pst."value"),
          lower(regexp_replace(trim(pst."value"), '\s+', '-', 'g'))
        FROM "products_size_terms" pst
        WHERE pst."value" IS NOT NULL
          AND trim(pst."value") <> ''
        ORDER BY lower(trim(pst."value")), pst."id"
        ON CONFLICT ("slug") DO NOTHING;

        -- 4. Populate products_rels with the new product -> sizes entries
        INSERT INTO "products_rels" ("parent_id", "path", "sizes_id", "order")
        SELECT
          pst."_parent_id",
          'sizes',
          s."id",
          pst."_order"
        FROM "products_size_terms" pst
        JOIN "sizes" s ON lower(trim(pst."value")) = lower(trim(s."name"))
        WHERE NOT EXISTS (
          SELECT 1 FROM "products_rels" pr
          WHERE pr."parent_id" = pst."_parent_id"
            AND pr."path" = 'sizes'
            AND pr."sizes_id" = s."id"
        );

        -- 5. Rewrite products_variants.size from value string -> size id string
        UPDATE "products_variants" pv
        SET "size" = s."id"::varchar
        FROM "sizes" s
        WHERE pv."size" IS NOT NULL
          AND pv."size" <> ''
          AND lower(trim(pv."size")) = lower(trim(s."name"));
      END IF;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Revert variant.size from id back to size name
    UPDATE "products_variants" pv
    SET "size" = s."name"
    FROM "sizes" s
    WHERE pv."size" ~ '^[0-9]+$'
      AND s."id" = pv."size"::integer;

    DELETE FROM "products_rels" WHERE "path" = 'sizes';

    ALTER TABLE "products_rels" DROP CONSTRAINT IF EXISTS "products_rels_sizes_fk";
    ALTER TABLE "products_rels" DROP COLUMN IF EXISTS "sizes_id";

    ALTER TABLE "payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_sizes_fk";
    ALTER TABLE "payload_locked_documents_rels"
      DROP COLUMN IF EXISTS "sizes_id";

    DROP TABLE IF EXISTS "sizes" CASCADE;
  `)
}
