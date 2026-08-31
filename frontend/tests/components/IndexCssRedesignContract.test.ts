// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('frontend/src/index.css', 'utf8');

describe('index CSS redesign contract', () => {
  it('defines the shared module foundation and approved breakpoints', () => {
    for (const selector of [
      '.module-page', '.module-header', '.module-heading', '.module-description',
      '.module-toolbar', '.module-card', '.module-card-actions', '.module-form',
      '.module-field', '.module-field-error', '.module-modal', '.module-skeleton',
      '.module-empty', '.module-filtered-empty', '.module-error',
    ]) expect(css).toContain(selector);
    expect(css).toContain('@media (max-width: 639px)');
    expect(css).toContain('@media (min-width: 640px) and (max-width: 1023px)');
    expect(css).toContain('@media (min-width: 1024px)');
    expect(css).toContain('@media (min-width: 1280px)');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
  });
});
