// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('frontend/src/index.css', 'utf8');
const exerciseSources = [
  'frontend/src/pages/pt/ExerciseLibraryPage.tsx',
  'frontend/src/components/exercises/ExerciseFilter.tsx',
  'frontend/src/components/exercises/ExerciseLibraryCard.tsx',
  'frontend/src/components/exercises/ExerciseFormModal.tsx',
  'frontend/src/components/exercises/ExerciseVideoFields.tsx',
].map((path) => readFileSync(path, 'utf8')).join('\n');
const workoutTemplateSources = [
  'frontend/src/components/workouts/MyWorkoutPlans.tsx',
  'frontend/src/components/workouts/WorkoutTemplateList.tsx',
  'frontend/src/components/workouts/WorkoutTemplateCard.tsx',
].map((path) => readFileSync(path, 'utf8')).join('\n');
const workoutFlowSources = [
  'frontend/src/components/workouts/AiWorkoutWizard.tsx',
  'frontend/src/components/workouts/CustomerWorkoutPlans.tsx',
  'frontend/src/components/workouts/CustomerWorkoutPlanModal.tsx',
  'frontend/src/components/workouts/CustomerWorkoutPlanPanel.tsx',
].map((path) => readFileSync(path, 'utf8')).join('\n');
const workoutStudioPage = readFileSync('frontend/src/pages/pt/WorkoutStudioPage.tsx', 'utf8');
const workoutStudioControlSources = [
  'frontend/src/components/workout-studio/StudioHeader.tsx',
  'frontend/src/components/workout-studio/TemplateMetadataForm.tsx',
  'frontend/src/components/workout-studio/StudioDayNavigator.tsx',
  'frontend/src/components/workout-studio/ExercisePalette.tsx',
].map((path) => readFileSync(path, 'utf8')).join('\n');

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

  it('keeps Exercise Library styling in semantic index CSS classes', () => {
    expect(exerciseSources).not.toMatch(/style=\{\{/);
    expect(exerciseSources).not.toMatch(/(?:sm:|md:|lg:|xl:|rounded-|bg-|text-slate-|border-slate-|shadow-\[|["'`\s](?:flex|grid|gap-\d+|p-\d+|px-\d+|py-\d+)(?=["'`\s]))/);
    for (const selector of ['.exercise-page', '.exercise-toolbar', '.exercise-grid', '.exercise-card', '.exercise-form-section']) expect(css).toContain(selector);
  });

  it('keeps workout template styling in semantic index CSS classes', () => {
    expect(workoutTemplateSources).not.toMatch(/style=\{\{/);
    expect(workoutTemplateSources).not.toMatch(/(?:sm:|md:|lg:|xl:|rounded-|bg-|text-slate-|border-slate-|shadow-\[|["'`\s](?:flex|grid|gap-\d+|p-\d+|px-\d+|py-\d+)(?=["'`\s]))/);
    for (const selector of ['.workout-page', '.workout-toolbar', '.workout-template-grid', '.workout-template-card']) expect(css).toContain(selector);
  });

  it('keeps AI and customer-plan styling in semantic index CSS classes', () => {
    expect(workoutFlowSources).not.toMatch(/style=\{\{/);
    expect(workoutFlowSources).not.toMatch(/(?:sm:|md:|lg:|xl:|rounded-|bg-|text-slate-|border-slate-|shadow-\[|["'`\s](?:flex|grid|gap-\d+|p-\d+|px-\d+|py-\d+)(?=["'`\s]))/);
    for (const selector of ['.workout-ai-wizard', '.workout-wizard-progress', '.workout-customer-plans', '.workout-customer-plan-card', '.workout-customer-plan-form']) expect(css).toContain(selector);
  });

  it('defines a semantic responsive shell for Workout Studio', () => {
    expect(workoutStudioPage).not.toMatch(/style=\{\{/);
    expect(workoutStudioPage).not.toMatch(/(?:sm:|md:|lg:|xl:|min-\[|!gap|!grid|rounded-|bg-|text-slate-|border-slate-|shadow-\[)/);
    for (const selector of ['.studio-view-tabs', '.studio-workspace', '.studio-library-region', '.studio-schedule-region', '.studio-inspector-region']) expect(css).toContain(selector);
  });

  it('keeps Studio controls in semantic index CSS classes', () => {
    expect(workoutStudioControlSources).not.toMatch(/style=\{\{/);
    expect(workoutStudioControlSources).not.toMatch(/(?:sm:|md:|lg:|xl:|min-\[|!gap|!grid|rounded-|bg-|text-slate-|border-slate-|shadow-\[|["'`\s](?:flex|grid|gap-\d+|p-\d+|px-\d+|py-\d+)(?=["'`\s]))/);
    for (const selector of ['.studio-header', '.studio-save-state', '.studio-metadata', '.studio-period-navigation', '.studio-palette', '.studio-exercise-option']) expect(css).toContain(selector);
  });
});
