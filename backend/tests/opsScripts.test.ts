import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '../..');
const run = (script: string, args: string[]) => spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-File', path.join(root, 'scripts', script), ...args], { cwd: root, encoding: 'utf8' });

it('backup supports staging dry-run without contacting MongoDB', () => {
  const result = run('backup-mongodb.ps1', ['-Environment', 'staging', '-OutputPath', 'backups/test-backup', '-MongoUri', 'mongodb://localhost:27017/test', '-DryRun']);
  expect(result.status).toBe(0);
  expect(result.stdout).toContain('mongodump');
});

it('backup and restore reject production without explicit confirmation', () => {
  const backup = run('backup-mongodb.ps1', ['-Environment', 'production', '-OutputPath', 'backups/test-backup', '-MongoUri', 'mongodb://localhost:27017/test', '-DryRun']);
  expect(backup.status).not.toBe(0);
  const restore = run('restore-mongodb.ps1', ['-Environment', 'production', '-BackupPath', 'backups/test-backup', '-MongoUri', 'mongodb://localhost:27017/test', '-DryRun']);
  expect(restore.status).not.toBe(0);
});

it('restore supports staging dry-run and prints the exact target', () => {
  const result = run('restore-mongodb.ps1', ['-Environment', 'staging', '-BackupPath', 'backups/test-backup', '-MongoUri', 'mongodb://localhost:27017/test', '-DryRun']);
  expect(result.status).toBe(0);
  expect(result.stdout).toContain('mongorestore');
  expect(result.stdout).toContain('mongodb://localhost:27017/test');
});
