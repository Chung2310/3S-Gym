import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const files = [
  'frontend/src/pages/pt/ProgressPage.tsx',
  'frontend/src/components/progress/ProgressDashboard.tsx',
  'frontend/src/components/progress/ProgressModal.tsx',
  'frontend/src/components/progress/ProgressDetailModal.tsx',
  'frontend/src/components/progress/WorkoutSessionModal.tsx',
  'frontend/src/components/progress/PtProgressWorkspace.tsx',
  'frontend/src/components/progress/WorkoutSessionLogger.tsx',
  'frontend/src/components/progress/WorkoutSessionDetail.tsx',
  'frontend/src/components/progress/MeasurementForm.tsx',
  'frontend/src/components/progress/ProgressCharts.tsx',
  'frontend/src/components/progress/ProgressOverview.tsx',
  'frontend/src/components/progress/AchievementList.tsx',
  'frontend/src/components/progress/ProgressReportGenerator.tsx',
  'frontend/src/components/progress/ProgressReportEditor.tsx',
  'frontend/src/components/progress/ProgressReportList.tsx',
];

const tailwindToken = /(?:^|\s)(?:sm:|md:|lg:|xl:|2xl:|hover:|focus-visible:|active:|disabled:|motion-reduce:|!|flex|grid|block|inline-flex|space-y-|gap-|rounded-|border-|bg-|text-|font-|p[trblxy]?-|m[trblxy]?-|w-|h-|min-|max-|overflow-|shadow-|items-|justify-|place-|divide-|tracking-|leading-|uppercase|truncate|whitespace-|shrink-|aspect-|object-)/;

describe('Progress legacy CSS contract', () => {
  it.each(files)('%s does not use inline styles or Tailwind utilities', (file) => {
    const source = readFileSync(resolve(file), 'utf8');
    expect(source).not.toContain('style={{');
    const classValues = [...source.matchAll(/className=(?:"([^"]*)"|'([^']*)'|`([^`]*)`)/g)].map((match) => match[1] || match[2] || match[3] || '');
    expect(classValues.filter((value) => tailwindToken.test(value))).toEqual([]);
  });

  it('defines the shared progress legacy namespace', () => {
    const css = readFileSync(resolve('frontend/src/index.css'), 'utf8');
    for (const selector of ['.progress-page', '.progress-dashboard', '.progress-modal', '.progress-form', '.progress-chart-card', '.progress-report']) {
      expect(css).toContain(selector);
    }
  });
});
