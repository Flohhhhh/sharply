import * as migration_20260903_133652_payload_baseline from './20260903_133652_payload_baseline';
import * as migration_20260903_134423_add_learn_read_next from './20260903_134423_add_learn_read_next';

export const migrations = [
  {
    up: migration_20260903_133652_payload_baseline.up,
    down: migration_20260903_133652_payload_baseline.down,
    name: '20260903_133652_payload_baseline',
  },
  {
    up: migration_20260903_134423_add_learn_read_next.up,
    down: migration_20260903_134423_add_learn_read_next.down,
    name: '20260903_134423_add_learn_read_next'
  },
];
