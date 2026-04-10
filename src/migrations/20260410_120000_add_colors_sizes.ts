import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE products ADD COLUMN IF NOT EXISTS enable_colors boolean DEFAULT false;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS enable_sizes boolean DEFAULT false;
    ALTER TABLE products DROP COLUMN IF EXISTS option_label1;
    ALTER TABLE products DROP COLUMN IF EXISTS option_label2;

    CREATE TABLE IF NOT EXISTS products_colors (
      id serial PRIMARY KEY,
      _order integer NOT NULL,
      _parent_id integer NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      name varchar NOT NULL,
      hex varchar NOT NULL DEFAULT '#ccc',
      price numeric,
      availability varchar DEFAULT 'in_stock'
    );
    CREATE INDEX IF NOT EXISTS products_colors_order_idx ON products_colors(_order);
    CREATE INDEX IF NOT EXISTS products_colors_parent_id_idx ON products_colors(_parent_id);

    CREATE TABLE IF NOT EXISTS products_colors_rels (
      id serial PRIMARY KEY,
      order_idx integer,
      parent_id integer NOT NULL REFERENCES products_colors(id) ON DELETE CASCADE,
      path varchar NOT NULL DEFAULT 'images',
      media_id integer REFERENCES media(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS products_colors_rels_order_idx ON products_colors_rels(order_idx);
    CREATE INDEX IF NOT EXISTS products_colors_rels_parent_idx ON products_colors_rels(parent_id);
    CREATE INDEX IF NOT EXISTS products_colors_rels_media_idx ON products_colors_rels(media_id);

    CREATE TABLE IF NOT EXISTS products_colors_sizes (
      id serial PRIMARY KEY,
      _order integer NOT NULL,
      _parent_id integer NOT NULL REFERENCES products_colors(id) ON DELETE CASCADE,
      value varchar NOT NULL,
      price numeric,
      availability varchar DEFAULT 'in_stock'
    );
    CREATE INDEX IF NOT EXISTS products_colors_sizes_order_idx ON products_colors_sizes(_order);
    CREATE INDEX IF NOT EXISTS products_colors_sizes_parent_idx ON products_colors_sizes(_parent_id);

    CREATE TABLE IF NOT EXISTS products_sizes (
      id serial PRIMARY KEY,
      _order integer NOT NULL,
      _parent_id integer NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      value varchar NOT NULL,
      price numeric,
      availability varchar DEFAULT 'in_stock'
    );
    CREATE INDEX IF NOT EXISTS products_sizes_order_idx ON products_sizes(_order);
    CREATE INDEX IF NOT EXISTS products_sizes_parent_id_idx ON products_sizes(_parent_id);

    DROP TABLE IF EXISTS products_variants CASCADE;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS products_colors_sizes CASCADE;
    DROP TABLE IF EXISTS products_colors_rels CASCADE;
    DROP TABLE IF EXISTS products_colors CASCADE;
    DROP TABLE IF EXISTS products_sizes CASCADE;
    ALTER TABLE products DROP COLUMN IF EXISTS enable_colors;
    ALTER TABLE products DROP COLUMN IF EXISTS enable_sizes;
  `)
}
