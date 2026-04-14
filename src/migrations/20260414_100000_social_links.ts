import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Add tiktok_url and facebook_url columns to site_settings.
 * Purely additive — both fields are nullable text.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "site_settings"
      ADD COLUMN IF NOT EXISTS "tiktok_url" varchar,
      ADD COLUMN IF NOT EXISTS "facebook_url" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "site_settings"
      DROP COLUMN IF EXISTS "tiktok_url",
      DROP COLUMN IF EXISTS "facebook_url";
  `)
}
