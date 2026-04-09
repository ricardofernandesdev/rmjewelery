import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_products_availability" AS ENUM('in_stock', 'out_of_stock');
  CREATE TYPE "public"."enum_home_settings_blocks_divider_style" AS ENUM('line', 'spacer', 'ornament');
  CREATE TYPE "public"."enum_home_settings_blocks_divider_spacing" AS ENUM('small', 'medium', 'large');
  CREATE TYPE "public"."enum_home_settings_blocks_divider_background" AS ENUM('white', 'cream', 'dark');
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"blur_data_u_r_l" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_detail_url" varchar,
  	"sizes_detail_width" numeric,
  	"sizes_detail_height" numeric,
  	"sizes_detail_mime_type" varchar,
  	"sizes_detail_filesize" numeric,
  	"sizes_detail_filename" varchar,
  	"sizes_zoom_url" varchar,
  	"sizes_zoom_width" numeric,
  	"sizes_zoom_height" numeric,
  	"sizes_zoom_mime_type" varchar,
  	"sizes_zoom_filesize" numeric,
  	"sizes_zoom_filename" varchar
  );
  
  CREATE TABLE "categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar,
  	"description" varchar,
  	"image_id" integer,
  	"sort_order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "products" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar,
  	"description" jsonb,
  	"price" numeric NOT NULL,
  	"availability" "enum_products_availability" DEFAULT 'in_stock',
  	"category_id" integer NOT NULL,
  	"sort_order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "products_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"avatar_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer,
  	"categories_id" integer,
  	"products_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"logo_id" integer,
  	"instagram_url" varchar DEFAULT 'https://ig.me/m/rmjewelry.collection',
  	"instagram_page_url" varchar DEFAULT 'https://www.instagram.com/rmjewelry.collection/',
  	"maintenance_mode" boolean DEFAULT false,
  	"maintenance_message" varchar DEFAULT 'Estamos a fazer melhorias. Voltamos em breve.',
  	"coming_soon" boolean DEFAULT false,
  	"coming_soon_message" varchar DEFAULT 'Estamos a preparar algo especial. Em breve.',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "home_settings_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"show_eyebrow" boolean DEFAULT true,
  	"eyebrow" varchar DEFAULT 'A COLEÇÃO 2026',
  	"title" varchar DEFAULT 'Elegância Atemporal',
  	"show_primary_button" boolean DEFAULT true,
  	"primary_button_label" varchar DEFAULT 'EXPLORAR COLEÇÃO',
  	"primary_button_link" varchar DEFAULT '/products',
  	"show_secondary_button" boolean DEFAULT true,
  	"secondary_button_label" varchar DEFAULT 'VER LOOKBOOK',
  	"secondary_button_link" varchar DEFAULT '/products',
  	"block_name" varchar
  );
  
  CREATE TABLE "home_settings_blocks_categories_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar DEFAULT 'Dimensões Essenciais',
  	"description" varchar DEFAULT 'Precisão geométrica encontra-se com permanência. A nossa coleção essencial define a interseção entre artesanato e elegância contemporânea.',
  	"label" varchar DEFAULT '01 / CATEGORIAS',
  	"block_name" varchar
  );
  
  CREATE TABLE "home_settings_blocks_philosophy" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"show_badge" boolean DEFAULT true,
  	"badge" varchar DEFAULT 'COLEÇÃO 2026',
  	"title" varchar DEFAULT 'Elegância que Perdura',
  	"text" varchar DEFAULT 'Selecionamos à mão cada peça da nossa coleção, dando preferência a materiais duradouros e desenhos intemporais. O nosso compromisso é trazer-te elegância que resiste ao tempo.',
  	"show_link" boolean DEFAULT true,
  	"link_label" varchar DEFAULT 'Sobre Nós',
  	"link_url" varchar DEFAULT '/about',
  	"block_name" varchar
  );
  
  CREATE TABLE "home_settings_blocks_divider" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"style" "enum_home_settings_blocks_divider_style" DEFAULT 'line',
  	"spacing" "enum_home_settings_blocks_divider_spacing" DEFAULT 'medium',
  	"background" "enum_home_settings_blocks_divider_background" DEFAULT 'white',
  	"block_name" varchar
  );
  
  CREATE TABLE "home_settings_blocks_featured_products" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'SELEÇÃO ESPECIAL',
  	"title" varchar DEFAULT 'Produtos em Destaque',
  	"block_name" varchar
  );
  
  CREATE TABLE "home_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "home_settings_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"products_id" integer
  );
  
  CREATE TABLE "footer_settings_columns_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"url" varchar NOT NULL,
  	"new_tab" boolean DEFAULT false
  );
  
  CREATE TABLE "footer_settings_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL
  );
  
  CREATE TABLE "footer_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"copyright" varchar DEFAULT '© {year} RM Jewelry. Todos os direitos reservados.',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "categories" ADD CONSTRAINT "categories_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users" ADD CONSTRAINT "users_avatar_id_media_id_fk" FOREIGN KEY ("avatar_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_settings_blocks_hero" ADD CONSTRAINT "home_settings_blocks_hero_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_settings_blocks_hero" ADD CONSTRAINT "home_settings_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_settings_blocks_categories_grid" ADD CONSTRAINT "home_settings_blocks_categories_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_settings_blocks_philosophy" ADD CONSTRAINT "home_settings_blocks_philosophy_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_settings_blocks_philosophy" ADD CONSTRAINT "home_settings_blocks_philosophy_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_settings_blocks_divider" ADD CONSTRAINT "home_settings_blocks_divider_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_settings_blocks_featured_products" ADD CONSTRAINT "home_settings_blocks_featured_products_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_settings_rels" ADD CONSTRAINT "home_settings_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."home_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_settings_rels" ADD CONSTRAINT "home_settings_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_settings_columns_links" ADD CONSTRAINT "footer_settings_columns_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer_settings_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_settings_columns" ADD CONSTRAINT "footer_settings_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_detail_sizes_detail_filename_idx" ON "media" USING btree ("sizes_detail_filename");
  CREATE INDEX "media_sizes_zoom_sizes_zoom_filename_idx" ON "media" USING btree ("sizes_zoom_filename");
  CREATE UNIQUE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");
  CREATE INDEX "categories_image_idx" ON "categories" USING btree ("image_id");
  CREATE INDEX "categories_updated_at_idx" ON "categories" USING btree ("updated_at");
  CREATE INDEX "categories_created_at_idx" ON "categories" USING btree ("created_at");
  CREATE UNIQUE INDEX "products_slug_idx" ON "products" USING btree ("slug");
  CREATE INDEX "products_category_idx" ON "products" USING btree ("category_id");
  CREATE INDEX "products_updated_at_idx" ON "products" USING btree ("updated_at");
  CREATE INDEX "products_created_at_idx" ON "products" USING btree ("created_at");
  CREATE INDEX "products_rels_order_idx" ON "products_rels" USING btree ("order");
  CREATE INDEX "products_rels_parent_idx" ON "products_rels" USING btree ("parent_id");
  CREATE INDEX "products_rels_path_idx" ON "products_rels" USING btree ("path");
  CREATE INDEX "products_rels_media_id_idx" ON "products_rels" USING btree ("media_id");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_avatar_idx" ON "users" USING btree ("avatar_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("categories_id");
  CREATE INDEX "payload_locked_documents_rels_products_id_idx" ON "payload_locked_documents_rels" USING btree ("products_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "site_settings_logo_idx" ON "site_settings" USING btree ("logo_id");
  CREATE INDEX "home_settings_blocks_hero_order_idx" ON "home_settings_blocks_hero" USING btree ("_order");
  CREATE INDEX "home_settings_blocks_hero_parent_id_idx" ON "home_settings_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "home_settings_blocks_hero_path_idx" ON "home_settings_blocks_hero" USING btree ("_path");
  CREATE INDEX "home_settings_blocks_hero_image_idx" ON "home_settings_blocks_hero" USING btree ("image_id");
  CREATE INDEX "home_settings_blocks_categories_grid_order_idx" ON "home_settings_blocks_categories_grid" USING btree ("_order");
  CREATE INDEX "home_settings_blocks_categories_grid_parent_id_idx" ON "home_settings_blocks_categories_grid" USING btree ("_parent_id");
  CREATE INDEX "home_settings_blocks_categories_grid_path_idx" ON "home_settings_blocks_categories_grid" USING btree ("_path");
  CREATE INDEX "home_settings_blocks_philosophy_order_idx" ON "home_settings_blocks_philosophy" USING btree ("_order");
  CREATE INDEX "home_settings_blocks_philosophy_parent_id_idx" ON "home_settings_blocks_philosophy" USING btree ("_parent_id");
  CREATE INDEX "home_settings_blocks_philosophy_path_idx" ON "home_settings_blocks_philosophy" USING btree ("_path");
  CREATE INDEX "home_settings_blocks_philosophy_image_idx" ON "home_settings_blocks_philosophy" USING btree ("image_id");
  CREATE INDEX "home_settings_blocks_divider_order_idx" ON "home_settings_blocks_divider" USING btree ("_order");
  CREATE INDEX "home_settings_blocks_divider_parent_id_idx" ON "home_settings_blocks_divider" USING btree ("_parent_id");
  CREATE INDEX "home_settings_blocks_divider_path_idx" ON "home_settings_blocks_divider" USING btree ("_path");
  CREATE INDEX "home_settings_blocks_featured_products_order_idx" ON "home_settings_blocks_featured_products" USING btree ("_order");
  CREATE INDEX "home_settings_blocks_featured_products_parent_id_idx" ON "home_settings_blocks_featured_products" USING btree ("_parent_id");
  CREATE INDEX "home_settings_blocks_featured_products_path_idx" ON "home_settings_blocks_featured_products" USING btree ("_path");
  CREATE INDEX "home_settings_rels_order_idx" ON "home_settings_rels" USING btree ("order");
  CREATE INDEX "home_settings_rels_parent_idx" ON "home_settings_rels" USING btree ("parent_id");
  CREATE INDEX "home_settings_rels_path_idx" ON "home_settings_rels" USING btree ("path");
  CREATE INDEX "home_settings_rels_products_id_idx" ON "home_settings_rels" USING btree ("products_id");
  CREATE INDEX "footer_settings_columns_links_order_idx" ON "footer_settings_columns_links" USING btree ("_order");
  CREATE INDEX "footer_settings_columns_links_parent_id_idx" ON "footer_settings_columns_links" USING btree ("_parent_id");
  CREATE INDEX "footer_settings_columns_order_idx" ON "footer_settings_columns" USING btree ("_order");
  CREATE INDEX "footer_settings_columns_parent_id_idx" ON "footer_settings_columns" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "media" CASCADE;
  DROP TABLE "categories" CASCADE;
  DROP TABLE "products" CASCADE;
  DROP TABLE "products_rels" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  DROP TABLE "home_settings_blocks_hero" CASCADE;
  DROP TABLE "home_settings_blocks_categories_grid" CASCADE;
  DROP TABLE "home_settings_blocks_philosophy" CASCADE;
  DROP TABLE "home_settings_blocks_divider" CASCADE;
  DROP TABLE "home_settings_blocks_featured_products" CASCADE;
  DROP TABLE "home_settings" CASCADE;
  DROP TABLE "home_settings_rels" CASCADE;
  DROP TABLE "footer_settings_columns_links" CASCADE;
  DROP TABLE "footer_settings_columns" CASCADE;
  DROP TABLE "footer_settings" CASCADE;
  DROP TYPE "public"."enum_products_availability";
  DROP TYPE "public"."enum_home_settings_blocks_divider_style";
  DROP TYPE "public"."enum_home_settings_blocks_divider_spacing";
  DROP TYPE "public"."enum_home_settings_blocks_divider_background";`)
}
