// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const workflow = readFileSync('.github/workflows/cd.yml', 'utf8');
const deployScripts = workflow
  .split(/\n {10}script: \|\r?\n/)
  .slice(1)
  .map((block) => block.split(/\n {6}(?:# ---|- name:)/)[0]);

describe('deployment workflow', () => {
  it('fails and reports when the VPS is not running the image that was pulled', () => {
    expect(deployScripts).toHaveLength(2);
    for (const script of deployScripts) {
      expect(script).toMatch(/^\s*set -eu/m);
      expect(script).toContain('docker compose pull');
      expect(script).toContain('docker compose up -d --force-recreate --remove-orphans');
      expect(script).toContain('EXPECTED_IMAGE_ID=');
      expect(script).toContain('RUNNING_IMAGE_ID=');
      expect(script).toContain('exit 1');
    }
  });
});
