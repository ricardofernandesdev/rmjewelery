import * as migration_20260409_183937_initial from './20260409_183937_initial';
import * as migration_20260409_204756_add_pages from './20260409_204756_add_pages';
import * as migration_20260410_090139_add_banner_position from './20260410_090139_add_banner_position';
import * as migration_20260410_091859_add_product_variants from './20260410_091859_add_product_variants';

export const migrations = [
  {
    up: migration_20260409_183937_initial.up,
    down: migration_20260409_183937_initial.down,
    name: '20260409_183937_initial',
  },
  {
    up: migration_20260409_204756_add_pages.up,
    down: migration_20260409_204756_add_pages.down,
    name: '20260409_204756_add_pages',
  },
  {
    up: migration_20260410_090139_add_banner_position.up,
    down: migration_20260410_090139_add_banner_position.down,
    name: '20260410_090139_add_banner_position',
  },
  {
    up: migration_20260410_091859_add_product_variants.up,
    down: migration_20260410_091859_add_product_variants.down,
    name: '20260410_091859_add_product_variants'
  },
];
