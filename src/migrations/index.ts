import * as migration_20260409_183937_initial from './20260409_183937_initial';

export const migrations = [
  {
    up: migration_20260409_183937_initial.up,
    down: migration_20260409_183937_initial.down,
    name: '20260409_183937_initial'
  },
];
