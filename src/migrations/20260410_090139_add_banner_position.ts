import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_categories_banner_position_x" AS ENUM('left', 'center', 'right');
  CREATE TYPE "public"."enum_categories_banner_position_y" AS ENUM('top', 'center', 'bottom');
  ALTER TABLE "categories" ADD COLUMN "banner_position_x" "enum_categories_banner_position_x" DEFAULT 'center';
  ALTER TABLE "categories" ADD COLUMN "banner_position_y" "enum_categories_banner_position_y" DEFAULT 'center';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "categories" DROP COLUMN "banner_position_x";
  ALTER TABLE "categories" DROP COLUMN "banner_position_y";
  DROP TYPE "public"."enum_categories_banner_position_x";
  DROP TYPE "public"."enum_categories_banner_position_y";`)
}
