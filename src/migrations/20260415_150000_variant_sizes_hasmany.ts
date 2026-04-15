import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Promote variant.size from a single text id to a hasMany relationship to
 * sizes. The relationship lives in products_variants_rels (one row per
 * variant × size). The legacy text column products_variants.size is left
 * in place — Payload now reads from rels and ignores it.
 *
 * No data backfill needed: no existing variant in this database has a
 * non-empty size value yet.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products_variants_rels"
      ADD COLUMN IF NOT EXISTS "sizes_id" integer;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'products_variants_rels_sizes_fk'
          AND table_name = 'products_variants_rels'
      ) THEN
        ALTER TABLE "products_variants_rels"
          ADD CONSTRAINT "products_variants_rels_sizes_fk"
          FOREIGN KEY ("sizes_id") REFERENCES "sizes"("id") ON DELETE cascade;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "products_variants_rels_sizes_id_idx"
      ON "products_variants_rels" ("sizes_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products_variants_rels"
      DROP CONSTRAINT IF EXISTS "products_variants_rels_sizes_fk";
    ALTER TABLE "products_variants_rels"
      DROP COLUMN IF EXISTS "sizes_id";
  `)
}
