import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Create all home_settings block tables that Payload expects but
  // were never created on Neon. Uses IF NOT EXISTS so it's safe to
  // re-run and won't overwrite existing data.
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS home_settings_blocks_hero (
      _order integer NOT NULL,
      _parent_id integer NOT NULL REFERENCES home_settings(id) ON DELETE CASCADE,
      _path text NOT NULL,
      id varchar PRIMARY KEY,
      image_id integer REFERENCES media(id) ON DELETE SET NULL,
      show_eyebrow boolean DEFAULT true,
      eyebrow varchar DEFAULT 'A COLEÇÃO 2026',
      title varchar DEFAULT 'Elegância Atemporal',
      show_primary_button boolean DEFAULT true,
      primary_button_label varchar DEFAULT 'EXPLORAR COLEÇÃO',
      primary_button_link varchar DEFAULT '/products',
      show_secondary_button boolean DEFAULT true,
      secondary_button_label varchar DEFAULT 'VER LOOKBOOK',
      secondary_button_link varchar DEFAULT '/products',
      block_name varchar
    );
    CREATE INDEX IF NOT EXISTS home_settings_blocks_hero_order_idx ON home_settings_blocks_hero(_order);
    CREATE INDEX IF NOT EXISTS home_settings_blocks_hero_parent_id_idx ON home_settings_blocks_hero(_parent_id);
    CREATE INDEX IF NOT EXISTS home_settings_blocks_hero_path_idx ON home_settings_blocks_hero(_path);

    CREATE TABLE IF NOT EXISTS home_settings_blocks_categories_grid (
      _order integer NOT NULL,
      _parent_id integer NOT NULL REFERENCES home_settings(id) ON DELETE CASCADE,
      _path text NOT NULL,
      id varchar PRIMARY KEY,
      title varchar DEFAULT 'Dimensões Essenciais',
      description text,
      label varchar DEFAULT '01 / CATEGORIAS',
      block_name varchar
    );
    CREATE INDEX IF NOT EXISTS home_settings_blocks_cg_order_idx ON home_settings_blocks_categories_grid(_order);
    CREATE INDEX IF NOT EXISTS home_settings_blocks_cg_parent_id_idx ON home_settings_blocks_categories_grid(_parent_id);
    CREATE INDEX IF NOT EXISTS home_settings_blocks_cg_path_idx ON home_settings_blocks_categories_grid(_path);

    CREATE TABLE IF NOT EXISTS home_settings_blocks_philosophy (
      _order integer NOT NULL,
      _parent_id integer NOT NULL REFERENCES home_settings(id) ON DELETE CASCADE,
      _path text NOT NULL,
      id varchar PRIMARY KEY,
      image_id integer REFERENCES media(id) ON DELETE SET NULL,
      show_badge boolean DEFAULT true,
      badge varchar DEFAULT 'COLEÇÃO 2026',
      title varchar DEFAULT 'Elegância que Perdura',
      text text,
      show_link boolean DEFAULT true,
      link_label varchar DEFAULT 'Sobre Nós',
      link_url varchar DEFAULT '/about',
      block_name varchar
    );
    CREATE INDEX IF NOT EXISTS home_settings_blocks_phil_order_idx ON home_settings_blocks_philosophy(_order);
    CREATE INDEX IF NOT EXISTS home_settings_blocks_phil_parent_id_idx ON home_settings_blocks_philosophy(_parent_id);
    CREATE INDEX IF NOT EXISTS home_settings_blocks_phil_path_idx ON home_settings_blocks_philosophy(_path);

    CREATE TABLE IF NOT EXISTS home_settings_blocks_divider (
      _order integer NOT NULL,
      _parent_id integer NOT NULL REFERENCES home_settings(id) ON DELETE CASCADE,
      _path text NOT NULL,
      id varchar PRIMARY KEY,
      style varchar DEFAULT 'line',
      spacing varchar DEFAULT 'medium',
      background varchar DEFAULT 'white',
      block_name varchar
    );
    CREATE INDEX IF NOT EXISTS home_settings_blocks_div_order_idx ON home_settings_blocks_divider(_order);
    CREATE INDEX IF NOT EXISTS home_settings_blocks_div_parent_id_idx ON home_settings_blocks_divider(_parent_id);
    CREATE INDEX IF NOT EXISTS home_settings_blocks_div_path_idx ON home_settings_blocks_divider(_path);

    CREATE TABLE IF NOT EXISTS home_settings_blocks_featured_products (
      _order integer NOT NULL,
      _parent_id integer NOT NULL REFERENCES home_settings(id) ON DELETE CASCADE,
      _path text NOT NULL,
      id varchar PRIMARY KEY,
      eyebrow varchar DEFAULT 'SELEÇÃO ESPECIAL',
      title varchar DEFAULT 'Produtos em Destaque',
      count numeric DEFAULT 10,
      block_name varchar
    );
    CREATE INDEX IF NOT EXISTS home_settings_blocks_fp_order_idx ON home_settings_blocks_featured_products(_order);
    CREATE INDEX IF NOT EXISTS home_settings_blocks_fp_parent_id_idx ON home_settings_blocks_featured_products(_parent_id);
    CREATE INDEX IF NOT EXISTS home_settings_blocks_fp_path_idx ON home_settings_blocks_featured_products(_path);
  `)
}

export async function down({ db: _db }: MigrateDownArgs): Promise<void> {
  // No-op — dropping these would lose data
}
