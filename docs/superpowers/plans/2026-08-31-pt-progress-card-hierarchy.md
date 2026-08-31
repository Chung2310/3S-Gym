# PT Progress Card Hierarchy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Flatten the PT progress dashboard summary and customer information hierarchy so rounded cards no longer sit tightly inside other rounded cards.

**Architecture:** Keep all calculations and callbacks inside the existing `ProgressDashboard`. Change only its semantic grouping and Tailwind layout: one shared summary surface with divided segments, and one flat definition grid inside each customer card.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, Vitest, Testing Library

## Global Constraints

- Preserve all displayed values, filtering, empty state, and callbacks.
- Keep one outer rounded surface for the summary and one outer card per customer.
- Remove independent rounded backgrounds from summary metrics and customer detail values.
- Retain responsive layout, minimum touch-target heights, hover, and focus-visible states.
- Do not add dependencies or modify API/data flow.

---

### Task 1: Flatten summary and customer information groups

**Files:**
- Modify: `frontend/tests/components/progress/ProgressDashboard.test.tsx`
- Modify: `frontend/src/components/progress/ProgressDashboard.tsx`

**Interfaces:**
- Consumes: existing `CustomerProgressOverview[]`, `onView(item)`, and `onLogWorkout(item)` props.
- Produces: a labelled `region` named `Tổng quan tiến độ` and one labelled definition list named `Thông tin tiến độ của <customer>` per visible customer.

- [ ] **Step 1: Write the failing hierarchy test**

Add `within` to the Testing Library import and add this test:

```tsx
it('uses shared flat groups for summary metrics and customer information', () => {
  render(<ProgressDashboard items={items} onView={vi.fn()} onLogWorkout={vi.fn()} />);

  const summary = screen.getByRole('region', { name: 'Tổng quan tiến độ' });
  expect(summary).toHaveClass('divide-slate-200');
  expect(within(summary).getAllByRole('group')).toHaveLength(4);

  const customerInfo = screen.getByRole('group', { name: 'Thông tin tiến độ của Nguyễn An' });
  expect(customerInfo).toHaveClass('divide-slate-200');
  expect(customerInfo.querySelectorAll('.rounded-lg, .rounded-xl')).toHaveLength(0);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- frontend/tests/components/progress/ProgressDashboard.test.tsx`

Expected: FAIL because the dashboard has no labelled summary region or customer information group and still renders independently rounded cells.

- [ ] **Step 3: Implement the shared summary surface**

Replace the four-card wrapper with one shared surface:

```tsx
<section
  aria-label="Tổng quan tiến độ"
  className="grid overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-200 sm:grid-cols-2 sm:divide-y-0 xl:grid-cols-4"
>
  {metrics.map((metric, index) => (
    <article
      role="group"
      className={`p-6 sm:min-h-36 ${index % 2 === 1 ? 'sm:border-l sm:border-slate-200' : ''} ${index >= 2 ? 'sm:border-t sm:border-slate-200 xl:border-t-0' : ''} ${index > 0 ? 'xl:border-l xl:border-slate-200' : ''}`}
      key={metric.label}
    >
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-bold uppercase leading-5 tracking-wide text-slate-500">{metric.label}</p>
        <metric.icon className="shrink-0 text-secondary" size={20} />
      </div>
      <p className="mt-5 font-oswald text-3xl font-bold leading-tight text-primary">{metric.value}</p>
    </article>
  ))}
</section>
```

Define the metric array before the return so the JSX stays readable:

```tsx
const metrics = [
  { label: 'Khách được quản lý', value: `${items.length} khách hàng`, icon: Users },
  { label: 'Khách có hoạt động', value: `${activeCustomers}`, icon: Activity },
  { label: 'Tổng buổi đã ghi nhận', value: number(totalSessions), icon: CalendarDays },
  { label: 'Tham gia trung bình', value: items.length ? `${number(averageAttendance)}%` : '—', icon: TrendingDown },
];
```

- [ ] **Step 4: Implement the flat customer definition grid**

Give the existing customer `dl` an accessible label and replace each rounded cell with a divided flat cell:

```tsx
<dl
  aria-label={`Thông tin tiến độ của ${item.customer.fullName}`}
  className="mt-7 grid grid-cols-2 border-y border-slate-200 text-sm divide-x divide-y divide-slate-200"
>
  <div className="px-1 py-5 pr-4">
    <dt className="leading-5 text-slate-500">Buổi đã tập</dt>
    <dd className="mt-2 font-bold leading-5 text-slate-900">{item.sessionCount}</dd>
  </div>
  <div className="px-1 py-5 pl-4">
    <dt className="leading-5 text-slate-500">Tỷ lệ tham gia</dt>
    <dd className="mt-2 font-bold leading-5 text-slate-900">{item.analytics.attendance.rate === null ? '—' : `${number(item.analytics.attendance.rate)}%`}</dd>
  </div>
  <div className="px-1 py-5 pr-4">
    <dt className="leading-5 text-slate-500">Cân nặng</dt>
    <dd className="mt-2 font-bold leading-5 text-slate-900">{item.latestMeasurement?.weight ? `${number(item.latestMeasurement.weight)} kg` : '—'}{typeof weightDelta === 'number' && <span className="ml-1 text-xs text-emerald-700">({weightDelta > 0 ? '+' : ''}{number(weightDelta)})</span>}</dd>
  </div>
  <div className="px-1 py-5 pl-4">
    <dt className="leading-5 text-slate-500">Buổi gần nhất</dt>
    <dd className="mt-2 font-bold leading-5 text-slate-900">{date(item.lastSessionAt)}</dd>
  </div>
</dl>
```

Increase the actions wrapper spacing from `mt-6` to `mt-7`.

- [ ] **Step 5: Run the focused tests and verify GREEN**

Run: `npm test -- frontend/tests/components/progress/ProgressDashboard.test.tsx`

Expected: PASS with both hierarchy and existing interaction tests passing.

- [ ] **Step 6: Run typecheck and inspect the focused diff**

Run: `npm run typecheck`

Expected: exit code 0 with no TypeScript errors.

Run: `git -c safe.directory='D:/Igen Tech/3S Gym' diff --check`

Expected: exit code 0 with no whitespace errors.

Run: `git -c safe.directory='D:/Igen Tech/3S Gym' diff -- frontend/src/components/progress/ProgressDashboard.tsx frontend/tests/components/progress/ProgressDashboard.test.tsx docs/superpowers/specs/2026-08-31-pt-progress-card-hierarchy-design.md docs/superpowers/plans/2026-08-31-pt-progress-card-hierarchy.md`

Expected: only the approved visual hierarchy change, its focused tests, and documentation are present. Do not commit because commits were not authorized.
