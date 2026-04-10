import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Drop old structure
    DROP TABLE IF EXISTS products_colors_sizes CASCADE;
    DROP TABLE IF EXISTS products_colors_rels CASCADE;
    DROP TABLE IF EXISTS products_colors CASCADE;
    DROP TABLE IF EXISTS products_sizes CASCADE;
    DROP TABLE IF EXISTS products_variants CASCADE;

    -- Passo 2: Color terms
    CREATE TABLE IF NOT EXISTS products_color_terms (
      id serial PRIMARY KEY,
      _order integer NOT NULL,
      _parent_id integer NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      name varchar NOT NULL,
      hex varchar NOT NULL DEFAULT '#ccc'
    );
    CREATE INDEX IF NOT EXISTS products_color_terms_order_idx ON products_color_terms(_order);
    CREATE INDEX IF NOT EXISTS products_color_terms_parent_id_idx ON products_color_terms(_parent_id);

    CREATE TABLE IF NOT EXISTS products_color_terms_rels (
      id serial PRIMARY KEY,
      order_idx integer,
      parent_id integer NOT NULL REFERENCES products_color_terms(id) ON DELETE CASCADE,
      path varchar NOT NULL DEFAULT 'images',
      media_id integer REFERENCES media(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS products_color_terms_rels_order_idx ON products_color_terms_rels(order_idx);
    CREATE INDEX IF NOT EXISTS products_color_terms_rels_parent_idx ON products_color_terms_rels(parent_id);
    CREATE INDEX IF NOT EXISTS products_color_terms_rels_media_idx ON products_color_terms_rels(media_id);

    -- Passo 2: Size terms
    CREATE TABLE IF NOT EXISTS products_size_terms (
      id serial PRIMARY KEY,
      _order integer NOT NULL,
      _parent_id integer NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      value varchar NOT NULL
    );
    CREATE INDEX IF NOT EXISTS products_size_terms_order_idx ON products_size_terms(_order);
    CREATE INDEX IF NOT EXISTS products_size_terms_parent_id_idx ON products_size_terms(_parent_id);

    -- Passo 3: Variants
    CREATE TABLE IF NOT EXISTS products_variants (
      id serial PRIMARY KEY,
      _order integer NOT NULL,
      _parent_id integer NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      color varchar,
      size varchar,
      price numeric,
      availability varchar DEFAULT 'in_stock'
    );
    CREATE INDEX IF NOT EXISTS products_variants_order_idx ON products_variants(_order);
    CREATE INDEX IF NOT EXISTS products_variants_parent_id_idx ON products_variants(_parent_id);

    CREATE TABLE IF NOT EXISTS products_variants_rels (
      id serial PRIMARY KEY,
      order_idx integer,
      parent_id integer NOT NULL REFERENCES products_variants(id) ON DELETE CASCADE,
      path varchar NOT NULL DEFAULT 'images',
      media_id integer REFERENCES media(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS products_variants_rels_order_idx ON products_variants_rels(order_idx);
    CREATE INDEX IF NOT EXISTS products_variants_rels_parent_idx ON products_variants_rels(parent_id);
    CREATE INDEX IF NOT EXISTS products_variants_rels_media_idx ON products_variants_rels(media_id);
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS products_variants_rels CASCADE;
    DROP TABLE IF EXISTS products_variants CASCADE;
    DROP TABLE IF EXISTS products_size_terms CASCADE;
    DROP TABLE IF EXISTS products_color_terms_rels CASCADE;
    DROP TABLE IF EXISTS products_color_terms CASCADE;
  `)
}
