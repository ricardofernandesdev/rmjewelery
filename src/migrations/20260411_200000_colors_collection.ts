import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Refactor product colors from inline array (products_color_terms) into a
 * proper global "colors" collection with a hasMany relationship from
 * products -> colors, plus variant.color now stores the color id.
 *
 * Data preservation strategy:
 *   - Seed the new `colors` table from DISTINCT rows in products_color_terms
 *   - Rebuild the relationship through products_rels.colors_id
 *   - Rewrite products_variants.color from color name -> color id string
 *   - Leave products_color_terms and products_color_terms_rels IN PLACE as
 *     a safety net. A later migration can DROP them once everything is
 *     confirmed to work end to end.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- ─────────────────────────────────────────────
    -- 1. Create the new colors collection table
    -- ─────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS "colors" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "hex" varchar NOT NULL DEFAULT '#cccccc',
      "slug" varchar NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS "colors_slug_idx" ON "colors" ("slug");
    CREATE UNIQUE INDEX IF NOT EXISTS "colors_name_idx" ON "colors" ("name");
    CREATE INDEX IF NOT EXISTS "colors_updated_at_idx" ON "colors" ("updated_at");
    CREATE INDEX IF NOT EXISTS "colors_created_at_idx" ON "colors" ("created_at");

    -- ─────────────────────────────────────────────
    -- 2. Extend products_rels to reference colors
    -- ─────────────────────────────────────────────
    ALTER TABLE "products_rels"
      ADD COLUMN IF NOT EXISTS "colors_id" integer;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'products_rels_colors_fk'
          AND table_name = 'products_rels'
      ) THEN
        ALTER TABLE "products_rels"
          ADD CONSTRAINT "products_rels_colors_fk"
          FOREIGN KEY ("colors_id") REFERENCES "colors"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "products_rels_colors_id_idx"
      ON "products_rels" ("colors_id");

    -- Payload's polymorphic "locked documents" table also needs a FK
    -- column for every collection. Missing this column causes runtime
    -- query failures as soon as any admin page hits the locked-docs join.
    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "colors_id" integer;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'payload_locked_documents_rels_colors_fk'
          AND table_name = 'payload_locked_documents_rels'
      ) THEN
        ALTER TABLE "payload_locked_documents_rels"
          ADD CONSTRAINT "payload_locked_documents_rels_colors_fk"
          FOREIGN KEY ("colors_id") REFERENCES "colors"("id") ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_colors_id_idx"
      ON "payload_locked_documents_rels" ("colors_id");

    -- ─────────────────────────────────────────────
    -- 3. Seed the new colors collection from
    --    existing inline products_color_terms rows.
    --    One row per distinct (trimmed, case-insensitive) color name.
    -- ─────────────────────────────────────────────
    INSERT INTO "colors" ("name", "hex", "slug")
    SELECT DISTINCT ON (lower(trim(pct."name")))
      trim(pct."name"),
      pct."hex",
      lower(regexp_replace(trim(pct."name"), '\\s+', '-', 'g'))
    FROM "products_color_terms" pct
    WHERE pct."name" IS NOT NULL
      AND trim(pct."name") <> ''
    ORDER BY lower(trim(pct."name")), pct."id"
    ON CONFLICT ("slug") DO NOTHING;

    -- ─────────────────────────────────────────────
    -- 4. Populate products_rels with the new
    --    product -> colors relationship entries.
    -- ─────────────────────────────────────────────
    INSERT INTO "products_rels" ("parent_id", "path", "colors_id", "order")
    SELECT
      pct."_parent_id",
      'colors',
      c."id",
      pct."_order"
    FROM "products_color_terms" pct
    JOIN "colors" c
      ON lower(trim(pct."name")) = lower(trim(c."name"))
    WHERE NOT EXISTS (
      SELECT 1 FROM "products_rels" pr
      WHERE pr."parent_id" = pct."_parent_id"
        AND pr."path" = 'colors'
        AND pr."colors_id" = c."id"
    );

    -- ─────────────────────────────────────────────
    -- 5. Rewrite products_variants.color from the
    --    color name string to the color id string.
    -- ─────────────────────────────────────────────
    UPDATE "products_variants" pv
    SET "color" = c."id"::varchar
    FROM "colors" c
    WHERE pv."color" IS NOT NULL
      AND pv."color" <> ''
      AND lower(trim(pv."color")) = lower(trim(c."name"));
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Revert variant.color values from id back to color name
    UPDATE "products_variants" pv
    SET "color" = c."name"
    FROM "colors" c
    WHERE pv."color" ~ '^[0-9]+$'
      AND c."id" = pv."color"::integer;

    -- Drop the product -> colors relationship entries
    DELETE FROM "products_rels" WHERE "path" = 'colors';

    -- Drop the foreign key + column on products_rels
    ALTER TABLE "products_rels"
      DROP CONSTRAINT IF EXISTS "products_rels_colors_fk";
    ALTER TABLE "products_rels"
      DROP COLUMN IF EXISTS "colors_id";

    -- Drop the foreign key + column on payload_locked_documents_rels
    ALTER TABLE "payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_colors_fk";
    ALTER TABLE "payload_locked_documents_rels"
      DROP COLUMN IF EXISTS "colors_id";

    -- Finally drop the colors table
    DROP TABLE IF EXISTS "colors" CASCADE;
  `)
}
