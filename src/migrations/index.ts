import * as migration_20260409_183937_initial from './20260409_183937_initial';
import * as migration_20260409_204756_add_pages from './20260409_204756_add_pages';

export const migrations = [
  {
    up: migration_20260409_183937_initial.up,
    down: migration_20260409_183937_initial.down,
    name: '20260409_183937_initial',
  },
  {
    up: migration_20260409_204756_add_pages.up,
    down: migration_20260409_204756_add_pages.down,
    name: '20260409_204756_add_pages'
  },
];
