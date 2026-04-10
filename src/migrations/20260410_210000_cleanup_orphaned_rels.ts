import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Use DO block so the existence check is part of the same statement
  // and doesn't abort the migration transaction if the table doesn't exist.
  //
  // Deletes orphaned home_settings_rels rows from the old featuredProducts
  // `products` relationship field (now replaced with `count` number).
  // Only runs if the table exists (Neon may not have it).
  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'home_settings_rels'
      ) THEN
        DELETE FROM home_settings_rels
        WHERE path LIKE 'sections.%.products';
      END IF;
    END $$;
  `)
}

export async function down({ db: _db }: MigrateDownArgs): Promise<void> {
  // No-op
}
