// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import SeoHead, { buildSchemas, SITE_URL } from '../../src/components/SeoHead';

afterEach(cleanup);

describe('SeoHead – JSON-LD Structured Data', () => {
  it('buildSchemas returns 4 schema objects with correct @type', () => {
    const schemas = buildSchemas();
    expect(schemas).toHaveLength(4);

    const types = schemas.map((s) => s['@type']);
    expect(types).toContain('HealthClub');
    expect(types).toContain('FAQPage');
    expect(types).toContain('WebSite');
    expect(types).toContain('BreadcrumbList');
  });

  it('HealthClub schema contains required business info', () => {
    const schemas = buildSchemas();
    const healthClub = schemas.find((s) => s['@type'] === 'HealthClub') as any;

    expect(healthClub.name).toBe('3S Wellness Fitness & Yoga');
    expect(healthClub.telephone).toBe('+84889926222');
    expect(healthClub.url).toBe(SITE_URL);
    expect(healthClub.address).toBeDefined();
    expect((healthClub.address as Record<string, string>).addressLocality).toBe('Thành phố Bắc Ninh');
    expect(healthClub.geo).toBeDefined();
    expect(healthClub.openingHoursSpecification).toBeDefined();
  });

  it('FAQPage schema contains at least 4 questions with accepted answers', () => {
    const schemas = buildSchemas();
    const faqPage = schemas.find((s) => s['@type'] === 'FAQPage') as any;
    const questions = faqPage.mainEntity as Array<Record<string, unknown>>;

    expect(questions.length).toBeGreaterThanOrEqual(4);
    for (const q of questions) {
      expect(q['@type']).toBe('Question');
      expect(q.name).toBeTruthy();
      expect(q.acceptedAnswer).toBeDefined();
      expect((q.acceptedAnswer as Record<string, string>)['@type']).toBe('Answer');
      expect((q.acceptedAnswer as Record<string, string>).text).toBeTruthy();
    }
  });

  it('injects JSON-LD script tags into document.head on mount', () => {
    const before = document.head.querySelectorAll('script[type="application/ld+json"]').length;
    const { unmount } = render(<SeoHead />);

    const scripts = document.head.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts.length).toBe(before + 4);

    // Validate each script is parseable JSON
    scripts.forEach((script) => {
      const parsed = JSON.parse(script.textContent || '');
      expect(parsed['@context']).toBe('https://schema.org');
    });

    unmount();

    // Scripts should be cleaned up after unmount
    const after = document.head.querySelectorAll('script[type="application/ld+json"]').length;
    expect(after).toBe(before);
  });

  it('SITE_URL uses https protocol', () => {
    expect(SITE_URL).toMatch(/^https:\/\//);
  });
});
