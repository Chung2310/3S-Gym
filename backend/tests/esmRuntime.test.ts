import { spawnSync } from 'node:child_process';
import path from 'node:path';

it('imports the Express app in native ESM runtime without CommonJS globals', () => {
  const result = spawnSync(process.execPath, ['--import', 'tsx', '--input-type=module', '--eval', "process.env.NODE_ENV='test'; await import('./backend/app.ts');"], {
    cwd: path.resolve('.'),
    encoding: 'utf8',
  });
  expect(result.status, result.stderr || result.stdout).toBe(0);
});
