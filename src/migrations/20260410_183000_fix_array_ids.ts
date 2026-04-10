import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Drop old tables with wrong ID types
    DROP TABLE IF EXISTS products_variants_rels CASCADE;
    DROP TABLE IF EXISTS products_variants CASCADE;
    DROP TABLE IF EXISTS products_color_terms_rels CASCADE;
    DROP TABLE IF EXISTS products_color_terms CASCADE;
    DROP TABLE IF EXISTS products_size_terms CASCADE;
    DROP TABLE IF EXISTS products_colors_sizes CASCADE;
    DROP TABLE IF EXISTS products_colors_rels CASCADE;
    DROP TABLE IF EXISTS products_colors CASCADE;
    DROP TABLE IF EXISTS products_sizes CASCADE;

    -- Recreate with text IDs (Payload default for array items)
    CREATE TABLE products_color_terms (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      _order integer NOT NULL,
      _parent_id integer NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      name varchar NOT NULL,
      hex varchar NOT NULL DEFAULT '#ccc'
    );
    CREATE INDEX products_color_terms_order_idx ON products_color_terms(_order);
    CREATE INDEX products_color_terms_parent_id_idx ON products_color_terms(_parent_id);

    CREATE TABLE products_size_terms (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      _order integer NOT NULL,
      _parent_id integer NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      value varchar NOT NULL
    );
    CREATE INDEX products_size_terms_order_idx ON products_size_terms(_order);
    CREATE INDEX products_size_terms_parent_id_idx ON products_size_terms(_parent_id);

    CREATE TABLE products_variants (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      _order integer NOT NULL,
      _parent_id integer NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      color varchar,
      size varchar,
      price numeric,
      availability varchar DEFAULT 'in_stock'
    );
    CREATE INDEX products_variants_order_idx ON products_variants(_order);
    CREATE INDEX products_variants_parent_id_idx ON products_variants(_parent_id);

    CREATE TABLE products_variants_rels (
      id serial PRIMARY KEY,
      order_idx integer,
      parent_id varchar NOT NULL REFERENCES products_variants(id) ON DELETE CASCADE,
      path varchar NOT NULL DEFAULT 'images',
      media_id integer REFERENCES media(id) ON DELETE CASCADE
    );
    CREATE INDEX products_variants_rels_order_idx ON products_variants_rels(order_idx);
    CREATE INDEX products_variants_rels_parent_idx ON products_variants_rels(parent_id);
    CREATE INDEX products_variants_rels_media_idx ON products_variants_rels(media_id);
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS products_variants_rels CASCADE;
    DROP TABLE IF EXISTS products_variants CASCADE;
    DROP TABLE IF EXISTS products_size_terms CASCADE;
    DROP TABLE IF EXISTS products_color_terms CASCADE;
  `)
}
