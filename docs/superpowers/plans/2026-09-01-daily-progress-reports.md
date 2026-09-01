# Daily Progress Reports Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hiển thị một nhóm báo cáo cho mỗi ngày PT đã ghi nhận buổi tập, kèm buổi tập, số đo và ảnh cùng ngày, trong tab Báo cáo của chi tiết tiến độ.

**Architecture:** `ProgressPage` dùng một service thuần để nhóm dữ liệu `journey` theo ngày và truyền kết quả xuống modal. `DailyProgressReports` chỉ render các nhóm đã hoàn chỉnh; `CustomerJourney` nhận nội dung này qua prop tùy chọn để luồng PT có báo cáo ngày mà luồng read-only khác không bị thay đổi.

**Tech Stack:** React 19, TypeScript 7, Tailwind CSS v4, Vitest 4, Testing Library.

## Global Constraints

- Không thay đổi API hoặc schema backend.
- Không tạo thêm `ProgressReport` khi hiển thị báo cáo ngày.
- Chỉ ngày có ít nhất một `session` mới tạo nhóm.
- Ngày mới nhất hiển thị trước; nhiều buổi cùng ngày nằm trong cùng nhóm.
- Giao diện dùng Tailwind CSS v4 và token hiện có; không thêm inline style, CSS module hoặc namespace CSS mới.
- Test nằm trong `frontend/tests/`, không đặt test trong `src/`.
- Không dùng subagent, worktree hoặc commit vì người dùng chưa ủy quyền các thao tác đó.

---

### Task 1: Nhóm dữ liệu hành trình theo ngày

**Files:**
- Modify: `frontend/src/types/progress.ts`
- Create: `frontend/src/services/dailyProgressReports.ts`
- Create: `frontend/tests/services/dailyProgressReports.test.ts`

**Interfaces:**
- Consumes: `WorkoutSessionDto`, `BodyMeasurementDto`, `CustomerJourneyDto`.
- Produces: `JourneyProgressPhoto`, `DailyProgressGroup`, `buildDailyProgressGroups(journey)`.

- [ ] **Step 1: Viết test thất bại cho grouping, sorting và joining**

```ts
import { describe, expect, it } from 'vitest';
import { buildDailyProgressGroups } from '../../src/services/dailyProgressReports';
import type { CustomerJourneyDto } from '../../src/types/progress';

const session = (id: string, performedAt: string) => ({
  _id: id,
  performedAt,
  attendance: 'PRESENT',
  planSnapshot: { title: 'Giáo án', session: { name: id } },
  exerciseLogs: [],
}) as CustomerJourneyDto['sessions'][number];

describe('buildDailyProgressGroups', () => {
  it('groups sessions by day, joins measurements and photos, and orders newest first', () => {
    const sessions = [
      session('s-old', '2026-08-30T08:00:00.000Z'),
      session('s-new-1', '2026-09-01T08:00:00.000Z'),
      session('s-new-2', '2026-09-01T10:00:00.000Z'),
    ];
    const measurements = [
      { _id: 'm1', measuredAt: '2026-09-01T00:00:00.000Z', weight: 68, measurements: {} },
    ];
    const photos = [
      { _id: 'p1', takenDate: '2026-09-01T00:00:00.000Z', photoUrl: '/progress.jpg', angle: 'FRONT' },
    ];
    const journey = { sessions, measurements, photos } as CustomerJourneyDto;

    const result = buildDailyProgressGroups(journey);

    expect(result.map((group) => group.dateKey)).toEqual(['2026-09-01', '2026-08-30']);
    expect(result[0].sessions.map((item) => item._id)).toEqual(['s-new-2', 's-new-1']);
    expect(result[0].measurements).toEqual(measurements);
    expect(result[0].photos).toEqual(photos);
    expect(sessions.map((item) => item._id)).toEqual(['s-old', 's-new-1', 's-new-2']);
  });

  it('ignores invalid dates and does not create groups from standalone measurements or photos', () => {
    const result = buildDailyProgressGroups({
      sessions: [session('invalid', 'not-a-date')],
      measurements: [{ _id: 'm1', measuredAt: '2026-09-01', measurements: {} }],
      photos: [{ _id: 'p1', takenDate: '2026-09-01', photoUrl: '/progress.jpg' }],
    } as CustomerJourneyDto);

    expect(result).toEqual([]);
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận RED**

Run:

```powershell
node node_modules/vitest/vitest.mjs run --config vitest.config.ts frontend/tests/services/dailyProgressReports.test.ts --reporter=verbose --maxWorkers=1
```

Expected: FAIL vì module `dailyProgressReports` chưa tồn tại.

- [ ] **Step 3: Thêm type dùng chung**

Trong `frontend/src/types/progress.ts`, tách type ảnh khỏi `CustomerJourneyDto` và thêm group:

```ts
export interface JourneyProgressPhoto {
  _id?: string;
  photoUrl?: string;
  stage?: string;
  angle?: string;
  takenDate?: string;
  [key: string]: unknown;
}

export interface DailyProgressGroup {
  dateKey: string;
  sessions: WorkoutSessionDto[];
  measurements: BodyMeasurementDto[];
  photos: JourneyProgressPhoto[];
}
```

Thay khai báo inline của `CustomerJourneyDto.photos` bằng:

```ts
photos: JourneyProgressPhoto[];
```

- [ ] **Step 4: Viết implementation tối thiểu của service**

Tạo `frontend/src/services/dailyProgressReports.ts`:

```ts
import type { CustomerJourneyDto, DailyProgressGroup } from '../types/progress';

function validDateKey(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  const [, year, month, day] = match;
  const parsed = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  if (
    parsed.getUTCFullYear() !== Number(year)
    || parsed.getUTCMonth() + 1 !== Number(month)
    || parsed.getUTCDate() !== Number(day)
  ) return null;
  return `${year}-${month}-${day}`;
}

export function buildDailyProgressGroups(
  journey: Pick<CustomerJourneyDto, 'sessions' | 'measurements' | 'photos'>,
): DailyProgressGroup[] {
  const groups = new Map<string, DailyProgressGroup>();

  for (const session of journey.sessions) {
    const dateKey = validDateKey(session.performedAt);
    if (!dateKey) continue;
    const group = groups.get(dateKey) || { dateKey, sessions: [], measurements: [], photos: [] };
    group.sessions.push(session);
    groups.set(dateKey, group);
  }

  for (const measurement of journey.measurements) {
    const dateKey = validDateKey(measurement.measuredAt);
    if (dateKey && groups.has(dateKey)) groups.get(dateKey)!.measurements.push(measurement);
  }

  for (const photo of journey.photos) {
    const dateKey = validDateKey(photo.takenDate);
    if (dateKey && groups.has(dateKey)) groups.get(dateKey)!.photos.push(photo);
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      sessions: [...group.sessions].sort(
        (left, right) => new Date(right.performedAt).getTime() - new Date(left.performedAt).getTime(),
      ),
    }))
    .sort((left, right) => right.dateKey.localeCompare(left.dateKey));
}
```

- [ ] **Step 5: Chạy test để xác nhận GREEN**

Run cùng lệnh Step 2.

Expected: 2 tests PASS.

---

### Task 2: Render báo cáo ngày

**Files:**
- Create: `frontend/src/components/progress/DailyProgressReports.tsx`
- Create: `frontend/tests/components/progress/DailyProgressReports.test.tsx`

**Interfaces:**
- Consumes: `groups: DailyProgressGroup[]` từ Task 1.
- Produces: component `DailyProgressReports` không gọi API và không mutate props.

- [ ] **Step 1: Viết component test thất bại**

```tsx
// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, within } from '@testing-library/react';
import DailyProgressReports from '../../../src/components/progress/DailyProgressReports';
import type { DailyProgressGroup } from '../../../src/types/progress';

const groups = [{
  dateKey: '2026-09-01',
  sessions: [{
    _id: 's1',
    performedAt: '2026-09-01T08:00:00.000Z',
    attendance: 'PRESENT',
    planSnapshot: { title: 'Giáo án tăng cơ', session: { name: 'Buổi chân' } },
    exerciseLogs: [],
    feeling: 'Khỏe',
    notes: 'Hoàn thành tốt',
  }],
  measurements: [{ _id: 'm1', measuredAt: '2026-09-01', weight: 68, measurements: { waist: 72 } }],
  photos: [{ _id: 'p1', takenDate: '2026-09-01', photoUrl: '/progress.jpg', angle: 'FRONT' }],
}] as DailyProgressGroup[];

it('renders sessions, attendance, measurements and photos inside their day', () => {
  render(<DailyProgressReports groups={groups} />);
  const day = screen.getByRole('article', { name: 'Ghi nhận ngày 01/09/2026' });
  expect(within(day).getByText('1 buổi')).toBeVisible();
  expect(within(day).getByText('Có mặt')).toBeVisible();
  expect(within(day).getByText('Giáo án tăng cơ · Buổi chân')).toBeVisible();
  expect(within(day).getByText('68 kg')).toBeVisible();
  expect(within(day).getByText('72 cm')).toBeVisible();
  expect(within(day).getByAltText('Ảnh tiến độ ngày 01/09/2026 · FRONT')).toBeVisible();
});

it('renders a dedicated empty state when there are no recorded days', () => {
  render(<DailyProgressReports groups={[]} />);
  expect(screen.getByRole('heading', { name: 'Chưa có ghi nhận theo ngày' })).toBeVisible();
});
```

- [ ] **Step 2: Chạy test để xác nhận RED**

Run:

```powershell
node node_modules/vitest/vitest.mjs run --config vitest.config.ts frontend/tests/components/progress/DailyProgressReports.test.tsx --reporter=verbose --maxWorkers=1
```

Expected: FAIL vì component chưa tồn tại.

- [ ] **Step 3: Viết component tối thiểu**

Tạo `DailyProgressReports.tsx` với các phần sau:

```tsx
import { CalendarDays, Camera, Ruler } from 'lucide-react';
import type { BodyMeasurementDto, DailyProgressGroup } from '../../types/progress';
import ProgressEmptyState from './ProgressEmptyState';
import ProgressSection from './ProgressSection';
import WorkoutSessionDetail from './WorkoutSessionDetail';

const attendance = {
  PRESENT: { label: 'Có mặt', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  LATE: { label: 'Đi muộn', className: 'bg-amber-50 text-amber-800 ring-amber-200' },
  ABSENT: { label: 'Vắng', className: 'bg-rose-50 text-rose-700 ring-rose-200' },
} as const;

const measurementFields: Array<{
  label: string;
  unit: string;
  value: (item: BodyMeasurementDto) => number | undefined;
}> = [
  { label: 'Cân nặng', unit: 'kg', value: (item) => item.weight },
  { label: 'Tỷ lệ mỡ', unit: '%', value: (item) => item.bodyFatPercentage },
  { label: 'Khối lượng cơ', unit: 'kg', value: (item) => item.muscleMass },
  { label: 'Vòng ngực', unit: 'cm', value: (item) => item.measurements.chest },
  { label: 'Vòng eo', unit: 'cm', value: (item) => item.measurements.waist },
  { label: 'Vòng hông', unit: 'cm', value: (item) => item.measurements.hips },
  { label: 'Vòng tay', unit: 'cm', value: (item) => item.measurements.arm },
  { label: 'Vòng đùi', unit: 'cm', value: (item) => item.measurements.thigh },
  { label: 'Vòng bắp chân', unit: 'cm', value: (item) => item.measurements.calf },
];

const formatDate = (dateKey: string) => new Date(`${dateKey}T00:00:00`).toLocaleDateString('vi-VN');

export default function DailyProgressReports({ groups }: { groups: DailyProgressGroup[] }) {
  return (
    <ProgressSection
      title="Ghi nhận theo ngày"
      description="Tự động tổng hợp từ những ngày PT đã hoàn tất ghi nhận buổi tập."
      count={groups.length}
    >
      {groups.length === 0 ? (
        <ProgressEmptyState
          icon={CalendarDays}
          title="Chưa có ghi nhận theo ngày"
          description="Mỗi ngày PT hoàn tất một buổi tập sẽ xuất hiện tại đây."
        />
      ) : (
        <div className="space-y-5">
          {groups.map((group) => {
            const displayDate = formatDate(group.dateKey);
            return (
              <article
                className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5"
                aria-label={`Ghi nhận ngày ${displayDate}`}
                key={group.dateKey}
              >
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-sky-50 text-secondary ring-1 ring-inset ring-sky-100"><CalendarDays size={18} aria-hidden="true" /></span>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Ngày ghi nhận</p>
                      <time className="font-oswald text-xl font-bold text-primary" dateTime={group.dateKey}>{displayDate}</time>
                    </div>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-primary ring-1 ring-inset ring-slate-200">{group.sessions.length} buổi</span>
                </header>

                <div className="space-y-4">
                  {group.sessions.map((session) => {
                    const state = attendance[session.attendance];
                    return (
                      <div className="space-y-2" key={session._id}>
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${state.className}`}>{state.label}</span>
                        <WorkoutSessionDetail session={session} />
                      </div>
                    );
                  })}
                </div>

                {group.measurements.length > 0 && (
                  <section className="rounded-xl border border-slate-200 bg-white p-4" aria-label={`Số đo ngày ${displayDate}`}>
                    <h3 className="flex items-center gap-2 font-bold text-primary"><Ruler size={17} aria-hidden="true" />Số đo cùng ngày</h3>
                    <dl className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {group.measurements.flatMap((measurement) => measurementFields.flatMap((field) => {
                        const value = field.value(measurement);
                        return typeof value === 'number' ? [(
                          <div className="rounded-lg bg-slate-50 px-3 py-2" key={`${measurement._id}-${field.label}`}>
                            <dt className="text-xs font-semibold text-slate-500">{field.label}</dt>
                            <dd className="mt-0.5 font-bold text-slate-900">{value.toLocaleString('vi-VN')} {field.unit}</dd>
                          </div>
                        )] : [];
                      }))}
                    </dl>
                  </section>
                )}

                {group.photos.some((photo) => Boolean(photo.photoUrl)) && (
                  <section className="rounded-xl border border-slate-200 bg-white p-4" aria-label={`Ảnh ngày ${displayDate}`}>
                    <h3 className="flex items-center gap-2 font-bold text-primary"><Camera size={17} aria-hidden="true" />Ảnh cùng ngày</h3>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {group.photos.map((photo, index) => photo.photoUrl ? (
                        <img className="aspect-[3/4] w-full rounded-xl object-cover ring-1 ring-slate-200" src={photo.photoUrl} alt={`Ảnh tiến độ ngày ${displayDate} · ${String(photo.angle || 'OTHER')}`} key={String(photo._id || `${group.dateKey}-${index}`)} />
                      ) : null)}
                    </div>
                  </section>
                )}
              </article>
            );
          })}
        </div>
      )}
    </ProgressSection>
  );
}
```

- [ ] **Step 4: Chạy component test để xác nhận GREEN**

Run cùng lệnh Step 2.

Expected: 2 tests PASS.

---

### Task 3: Tích hợp vào tab Báo cáo của PT

**Files:**
- Modify: `frontend/src/pages/pt/ProgressPage.tsx`
- Modify: `frontend/src/components/progress/ProgressDetailModal.tsx`
- Modify: `frontend/src/components/customer-portal/CustomerJourney.tsx`
- Modify: `frontend/tests/pages/pt/ProgressPage.test.tsx`

**Interfaces:**
- Consumes: `buildDailyProgressGroups(journey)` và `DailyProgressReports groups` từ Task 1–2.
- Produces: prop `dailyReportContent?: ReactNode` trên `CustomerJourney`; prop `dailyReportGroups: DailyProgressGroup[]` trên `ProgressDetailModal`.

- [ ] **Step 1: Viết integration test thất bại**

Trong fixture `journey` của `ProgressPage.test.tsx`, tạo biến riêng:

```ts
const journeyWithDailyReport = {
  ...journey,
  sessions: [{
    _id: 's-daily',
    performedAt: '2026-09-01T08:00:00.000Z',
    attendance: 'PRESENT',
    planSnapshot: { title: 'Giáo án 12 tuần', session: { name: 'Buổi chân' } },
    exerciseLogs: [],
  }],
} as CustomerJourneyDto;
```

Thêm test:

```tsx
it('shows daily workout records together with report composer and report history', async () => {
  vi.mocked(api.get).mockImplementation(async (path: string) => (
    path === '/api/customers/progress-overview'
      ? { data: [overview], message: '' }
      : { data: journeyWithDailyReport, message: '' }
  ));
  const user = userEvent.setup();
  renderPage();

  await user.click(await screen.findByRole('button', { name: 'Xem tiến độ Nguyễn An' }));
  await user.click(await screen.findByRole('tab', { name: 'Báo cáo' }));

  expect(screen.getByRole('region', { name: 'Ghi nhận theo ngày' })).toBeVisible();
  expect(screen.getByRole('article', { name: 'Ghi nhận ngày 01/09/2026' })).toBeVisible();
  expect(screen.getByLabelText('Từ ngày')).toBeVisible();
  expect(screen.getByRole('region', { name: 'Báo cáo tiến độ' })).toBeVisible();
});
```

- [ ] **Step 2: Chạy integration test để xác nhận RED**

Run:

```powershell
node node_modules/vitest/vitest.mjs run --config vitest.config.ts frontend/tests/pages/pt/ProgressPage.test.tsx --reporter=verbose --maxWorkers=1
```

Expected: FAIL vì chưa có region **Ghi nhận theo ngày**.

- [ ] **Step 3: Nối service tại page**

Trong `ProgressPage.tsx`:

```tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { buildDailyProgressGroups } from '../../services/dailyProgressReports';

const dailyReportGroups = useMemo(
  () => journey ? buildDailyProgressGroups(journey) : [],
  [journey],
);
```

Truyền vào modal:

```tsx
<ProgressDetailModal
  item={detailItem}
  journey={detailItem ? journey : null}
  dailyReportGroups={detailItem ? dailyReportGroups : []}
  loading={journeyLoading}
  onClose={close}
  onRefresh={() => void refreshDetail()}
/>
```

- [ ] **Step 4: Render component trong modal và tab**

Trong `ProgressDetailModal.tsx`, thêm prop `dailyReportGroups: DailyProgressGroup[]`, import `DailyProgressReports`, rồi truyền:

```tsx
<CustomerJourney
  journey={journey}
  reportComposer={<ProgressReportGenerator customerId={journey.customer._id} onSaved={onRefresh} />}
  dailyReportContent={<DailyProgressReports groups={dailyReportGroups} />}
/>
```

Trong `CustomerJourney.tsx`, nhận `dailyReportContent?: ReactNode`, truyền vào `JourneyPanel` và render giữa form với lịch sử:

```tsx
return (
  <div className="space-y-4">
    {reportComposer}
    {dailyReportContent}
    <CustomerProgress reports={journey.reports} />
  </div>
);
```

- [ ] **Step 5: Chạy integration test để xác nhận GREEN**

Run cùng lệnh Step 2.

Expected: toàn bộ test `ProgressPage.test.tsx` PASS.

- [ ] **Step 6: Chạy kiểm tra tập trung cuối**

Run:

```powershell
node node_modules/vitest/vitest.mjs run --config vitest.config.ts frontend/tests/services/dailyProgressReports.test.ts frontend/tests/components/progress/DailyProgressReports.test.tsx frontend/tests/pages/pt/ProgressPage.test.tsx --reporter=verbose --maxWorkers=1
```

Expected: tất cả test mới và test trang Progress PASS.

Run typecheck trên các file production thay đổi:

```powershell
npx tsc --ignoreConfig --noEmit --target ES2022 --lib 'ES2022,DOM,DOM.Iterable' --module ESNext --moduleResolution Bundler --moduleDetection force --jsx react-jsx --strict --esModuleInterop --allowSyntheticDefaultImports --resolveJsonModule --skipLibCheck --types 'node,vitest/globals,@testing-library/jest-dom' --forceConsistentCasingInFileNames frontend/src/types/progress.ts frontend/src/services/dailyProgressReports.ts frontend/src/components/progress/DailyProgressReports.tsx frontend/src/components/customer-portal/CustomerJourney.tsx frontend/src/components/progress/ProgressDetailModal.tsx frontend/src/pages/pt/ProgressPage.tsx
```

Expected: exit code 0.

Run lint:

```powershell
npx oxlint frontend/src/types/progress.ts frontend/src/services/dailyProgressReports.ts frontend/src/components/progress/DailyProgressReports.tsx frontend/src/components/customer-portal/CustomerJourney.tsx frontend/src/components/progress/ProgressDetailModal.tsx frontend/src/pages/pt/ProgressPage.tsx frontend/tests/services/dailyProgressReports.test.ts frontend/tests/components/progress/DailyProgressReports.test.tsx frontend/tests/pages/pt/ProgressPage.test.tsx
```

Expected: exit code 0.

Run diff check:

```powershell
git -c safe.directory='D:/Igen Tech/3S Gym' diff --check
```

Expected: exit code 0; cảnh báo chuyển LF/CRLF được chấp nhận nếu không có whitespace error.
