import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Drop all home_settings block tables to force clean recreation
    DROP TABLE IF EXISTS home_settings_blocks_hero CASCADE;
    DROP TABLE IF EXISTS home_settings_blocks_categories_grid CASCADE;
    DROP TABLE IF EXISTS home_settings_blocks_philosophy CASCADE;
    DROP TABLE IF EXISTS home_settings_blocks_divider CASCADE;
    DROP TABLE IF EXISTS home_settings_blocks_featured_products CASCADE;
    DROP TABLE IF EXISTS home_settings_rels CASCADE;

    -- Clear the home_settings row so Payload creates fresh
    DELETE FROM home_settings;
  `)
}

export async function down({ db: _db }: MigrateDownArgs): Promise<void> {
  // No-op — tables will be recreated by Payload
}
