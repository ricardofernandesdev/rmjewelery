import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Delete orphaned relationship rows from home_settings_rels
  // These were created by the old featuredProducts block when it had
  // a "products" relationship field. After changing to "count" number
  // field, these rels became orphaned and cause the Drizzle SQL
  // "aggregate function calls cannot be nested" error on findGlobal.
  //
  // This only deletes the orphaned relationship records — no blocks
  // or other homepage configuration is touched.
  await db.execute(sql`
    DELETE FROM home_settings_rels
    WHERE path LIKE 'sections.%.products';
  `)
}

export async function down({ db: _db }: MigrateDownArgs): Promise<void> {
  // No-op — orphaned data is not restorable
}
