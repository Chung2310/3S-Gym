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
  'frontend/src/components/workouts/WorkoutAvailabilityEditor.tsx',
  'frontend/src/components/workouts/CustomerWorkoutPlans.tsx',
  'frontend/src/components/workouts/CustomerWorkoutPlanModal.tsx',
  'frontend/src/components/workouts/CustomerWorkoutPlanPanel.tsx',
].map((path) => readFileSync(path, 'utf8')).join('\n');
const workoutStudioPage = readFileSync('frontend/src/pages/pt/WorkoutStudioPage.tsx', 'utf8');
const workoutStudioControlSources = [
  'frontend/src/components/workout-studio/StudioHeader.tsx',
  'frontend/src/components/workout-studio/AvailabilityWarningBanner.tsx',
  'frontend/src/components/workout-studio/TemplateMetadataForm.tsx',
  'frontend/src/components/workout-studio/StudioDayNavigator.tsx',
  'frontend/src/components/workout-studio/ExercisePalette.tsx',
].map((path) => readFileSync(path, 'utf8')).join('\n');
const studioTimeline = readFileSync('frontend/src/components/workout-studio/DayTimeline.tsx', 'utf8');
const studioInspectorSources = [
  'frontend/src/components/workout-studio/ExerciseInspector.tsx',
  'frontend/src/components/workout-studio/StudioSidebar.tsx',
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
    for (const selector of ['.workout-ai-wizard', '.workout-wizard-progress', '.workout-availability', '.workout-availability-day', '.workout-availability-slot', '.workout-customer-plans', '.workout-customer-plan-card', '.workout-customer-plan-form']) expect(css).toContain(selector);
  });

  it('defines a semantic responsive shell for Workout Studio', () => {
    expect(workoutStudioPage).not.toMatch(/style=\{\{/);
    expect(workoutStudioPage).not.toMatch(/(?:sm:|md:|lg:|xl:|min-\[|!gap|!grid|rounded-|bg-|text-slate-|border-slate-|shadow-\[)/);
    for (const selector of ['.studio-view-tabs', '.studio-workspace', '.studio-library-region', '.studio-schedule-region', '.studio-inspector-region']) expect(css).toContain(selector);
  });

  it('keeps Studio controls in semantic index CSS classes', () => {
    expect(workoutStudioControlSources).not.toMatch(/style=\{\{/);
    expect(workoutStudioControlSources).not.toMatch(/(?:sm:|md:|lg:|xl:|min-\[|!gap|!grid|rounded-|bg-|text-slate-|border-slate-|shadow-\[|["'`\s](?:flex|grid|gap-\d+|p-\d+|px-\d+|py-\d+)(?=["'`\s]))/);
    for (const selector of ['.studio-header', '.studio-save-state', '.studio-availability-warning', '.studio-metadata', '.studio-period-navigation', '.studio-week-list button', '.studio-day-list button', '.studio-palette', '.studio-exercise-option']) expect(css).toContain(selector);
    expect(css).toMatch(/\.studio-week-list button,\s*\.studio-day-list button\s*\{[^}]*padding:\s*0 16px;[^}]*white-space:\s*nowrap;/s);
  });

  it('uses typed data-only positioning and semantic timeline controls', () => {
    expect(studioTimeline).toContain("'--studio-item-top'");
    expect(studioTimeline).toContain("'--studio-item-height'");
    expect(studioTimeline).not.toContain('style={{ top:');
    expect(`${studioTimeline}\n${studioInspectorSources}`).not.toMatch(/style=\{\{\s*(?:top|height|background|color|padding)/);
    expect(`${studioTimeline}\n${studioInspectorSources}`).not.toMatch(/(?:rounded-|bg-|text-slate-|border-slate-|shadow-\[|sm:|md:|lg:|xl:|min-\[|max-\[|!block)/);
    for (const selector of ['.studio-hour-grid', '.studio-scheduled-item', '.studio-scheduled-item.is-compact .studio-scheduled-content', '.studio-sidebar', '.studio-inspector-duration', '.studio-inspector-danger']) expect(css).toContain(selector);
    expect(css).toMatch(/\.studio-scheduled-item\.is-compact \.studio-scheduled-content\s*\{[^}]*display:\s*flex;[^}]*padding:\s*0 8px;/s);
    expect(css).toMatch(/\.studio-scheduled-item\.is-compact \.studio-resize-handle::after\s*\{[^}]*display:\s*none;/s);
  });

  it('styles exercise tracking additions with semantic classes', () => {
    expect(exerciseSources).toContain('exercise-card-tracking');
    expect(exerciseSources).toContain('is-unclassified');
    expect(studioInspectorSources).toContain('studio-inspector-tracking');
    for (const selector of ['.exercise-card-tracking', '.exercise-badge.is-unclassified', '.studio-inspector-tracking']) expect(css).toContain(selector);
  });

  it('routes coarse-pointer timeline interaction through nonoverlapping 44px actions', () => {
    expect(css).toContain('@media (max-width: 1023px) and (pointer: coarse)');
    expect(css).toMatch(/\.studio-touch-schedule-action\s*\{[^}]*min-height:\s*44px;/);
    expect(css).toMatch(/@media \(max-width: 1023px\) and \(pointer: coarse\)\s*\{[^}]*\.studio-scheduled-item\s*\{\s*pointer-events:\s*none;/);
  });

  it('keeps the timeline header in its panel flow instead of offsetting it over the schedule', () => {
    expect(css).toMatch(/\.studio-timeline-header\s*\{[^}]*top:\s*0;/);
    expect(css).not.toContain('.studio-timeline-header { top: var(--studio-sticky-header-offset); }');
  });

  it('stacks mobile Studio detail panels above the view tabs', () => {
    const workspaceStart = css.indexOf('/* Workout Studio responsive workspace */');
    const tabletStart = css.indexOf('@media (min-width: 640px) and (max-width: 1023px)', workspaceStart);
    const desktopStart = css.indexOf('@media (min-width: 1024px)', tabletStart);
    const tabletCss = css.slice(tabletStart, desktopStart);
    const zIndexOf = (selector: string) => Number(tabletCss.match(new RegExp(`${selector}\\s*\\{[^}]*z-index:\\s*(\\d+);`))?.[1]);

    const tabsZIndex = zIndexOf('\\.studio-view-tabs');
    const backdropZIndex = zIndexOf('\\.studio-panel-backdrop');
    const panelZIndex = zIndexOf('\\.studio-library-region,[\\s\\S]*?\\.studio-inspector-region');

    expect(backdropZIndex).toBeGreaterThan(tabsZIndex);
    expect(panelZIndex).toBeGreaterThan(backdropZIndex);
  });

  it('does not retain orphaned workout presentation selectors', () => {
    for (const selector of ['.studio-meta {', '.studio-days {', '.studio-grid {', '.studio-timeline-wrap', '.studio-exercise-card', '.exercise-video-section', '.exercise-video-card', '.exercise-video-links']) expect(css).not.toContain(selector);
  });
});
