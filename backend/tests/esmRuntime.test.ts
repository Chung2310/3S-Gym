import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

it('imports the Express app in native ESM runtime without CommonJS globals', async () => {
  const script = "process.env.NODE_ENV='test'; await import('./backend/app.ts'); process.stdout.write('APP_IMPORTED');";
  const result = await execFileAsync(process.execPath, ['--import', 'tsx', '--input-type=module', '--eval', script], {
    cwd: path.resolve('.'),
    encoding: 'utf8',
    timeout: 55_000,
  });
  expect(result.stderr).toBe('');
  expect(result.stdout).toContain('APP_IMPORTED');
}, 60_000);
