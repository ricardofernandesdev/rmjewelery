import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Add auto_select boolean to colors.
 * When true, the color is pre-selected on new product imports.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "colors"
      ADD COLUMN IF NOT EXISTS "auto_select" boolean DEFAULT false;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "colors" DROP COLUMN IF EXISTS "auto_select";
  `)
}
