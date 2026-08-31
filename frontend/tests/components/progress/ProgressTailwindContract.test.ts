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
];

describe('Progress Tailwind contract', () => {
  it.each(files)('%s uses no inline style or legacy progress class', (file) => {
    const source = readFileSync(resolve(file), 'utf8');
    expect(source).not.toContain('style={{');
    const classValues = [...source.matchAll(/className=(?:"([^"]*)"|'([^']*)'|`([^`]*)`)/g)]
      .map((match) => match[1] || match[2] || match[3] || '');
    expect(classValues.filter((value) => /(?:^|\s)progress-/.test(value))).toEqual([]);
  });

  it('uses index theme tokens without a progress CSS namespace', () => {
    const css = readFileSync(resolve('frontend/src/index.css'), 'utf8');
    expect(css).toContain('@theme');
    expect(css).not.toContain('Progress module — legacy CSS contract');
    expect(css).not.toMatch(/^\.progress-/m);
  });
});
