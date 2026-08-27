import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

it('builds a native Node ESM backend artifact without tsx imports', () => {
  const npmCli = process.env.npm_execpath;
  if (!npmCli) throw new Error('npm_execpath is required for the artifact test');
  execFileSync(process.execPath, [npmCli, 'run', 'build:backend'], {
    cwd: path.resolve('.'), stdio: 'pipe', timeout: 60_000,
  });
  const bootstrap = path.resolve('dist/backend/bootstrap.js');
  const frontendService = path.resolve('dist/backend/services/frontendService.js');
  expect(fs.existsSync(bootstrap)).toBe(true);
  expect(fs.readFileSync(bootstrap, 'utf8')).not.toContain("from 'tsx'");
  const frontendArtifact = fs.readFileSync(frontendService, 'utf8');
  expect(frontendArtifact).not.toContain("from 'vite'");
  expect(frontendArtifact).toContain("import('vite')");
});
