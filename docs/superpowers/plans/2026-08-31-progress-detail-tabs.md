# Progress Detail Tabs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chuyển nội dung modal “Xem tiến độ” thành bảy tab read-only với panel/card rõ ràng và responsive.

**Architecture:** Giữ nguyên `ProgressPage`, API và `ProgressDetailModal`. `CustomerJourney` quản lý duy nhất `activeTab` ở mức UI, dùng các component Progress hiện có để render một panel tại một thời điểm; test component xác nhận semantic tab, chuyển tab và empty state.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Vitest, Testing Library, user-event.

## Global Constraints

- Bảy tab là: `Tổng quan`, `Lịch & buổi tập`, `Chỉ số cơ thể`, `Thành tích`, `Ảnh tiến độ`, `Giáo án`, `Báo cáo`.
- Tab mặc định là `Tổng quan`; chỉ panel đang chọn được render.
- Modal chi tiết chỉ đọc; không thêm API call, mutation hoặc form.
- Dùng Tailwind và token hiện có; không thêm global CSS, CSS module hoặc inline style.
- Tab phải có `tablist`, `tab`, `tabpanel`, `aria-selected`, `aria-controls` và `aria-labelledby`.
- Thanh tab phải cuộn ngang trên mobile và giữ vùng bấm tối thiểu 44px.

---

### Task 1: Tab hóa Customer Journey bằng TDD

**Files:**
- Modify: `frontend/tests/components/customer-portal/CustomerJourney.test.tsx`
- Modify: `frontend/src/components/customer-portal/CustomerJourney.tsx`

**Interfaces:**
- Consumes: `CustomerJourneyDto` từ `frontend/src/types/progress.ts` và các component `ProgressOverview`, `ProgressSection`, `ProgressEmptyState`, `WorkoutSessionDetail`, `ProgressCharts`, `AchievementList`, `CustomerProgress`.
- Produces: `CustomerJourney({ journey }: { journey: CustomerJourneyDto }): JSX.Element` với state tab cục bộ; không thay đổi props công khai.

- [ ] **Step 1: Viết test đỏ cho semantic tab và chuyển panel**

Thay test render-toàn-bộ hiện tại bằng test dùng `userEvent`:

```tsx
import userEvent from '@testing-library/user-event';

it('shows one clearly separated journey tab panel at a time', async () => {
  const user = userEvent.setup();
  render(<CustomerJourney journey={journey} />);

  for (const name of [
    'Tổng quan',
    'Lịch & buổi tập',
    'Chỉ số cơ thể',
    'Thành tích',
    'Ảnh tiến độ',
    'Giáo án',
    'Báo cáo',
  ]) {
    expect(screen.getByRole('tab', { name })).toBeVisible();
  }

  expect(screen.getByRole('tab', { name: 'Tổng quan' })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByRole('tabpanel', { name: 'Tổng quan' })).toBeVisible();
  expect(screen.queryByText('Tập chân')).not.toBeInTheDocument();

  await user.click(screen.getByRole('tab', { name: 'Lịch & buổi tập' }));
  expect(screen.getByRole('tab', { name: 'Lịch & buổi tập' })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByRole('tabpanel', { name: 'Lịch & buổi tập' })).toBeVisible();
  expect(screen.getByText('Tập chân')).toBeVisible();
  expect(screen.getByText('Strength · Ngày 1')).toBeVisible();

  await user.click(screen.getByRole('tab', { name: 'Ảnh tiến độ' }));
  expect(screen.getByAltText('Ảnh tiến độ BEFORE')).toBeVisible();

  await user.click(screen.getByRole('tab', { name: 'Giáo án' }));
  expect(screen.getByText('Giáo án hiện tại')).toBeVisible();
  expect(screen.getByText('Giáo án cũ')).toBeVisible();

  await user.click(screen.getByRole('tab', { name: 'Báo cáo' }));
  expect(screen.getByText('Tiến bộ tốt')).toBeVisible();
});
```

- [ ] **Step 2: Chạy test và xác nhận RED đúng nguyên nhân**

Run:

```powershell
npx vitest run frontend/tests/components/customer-portal/CustomerJourney.test.tsx
```

Expected: FAIL tại truy vấn `getByRole('tab', { name: 'Tổng quan' })` vì `CustomerJourney` hiện chưa render tab.

- [ ] **Step 3: Viết test đỏ cho empty state theo tab**

Thêm test thứ hai với dữ liệu collection rỗng:

```tsx
it('shows contextual empty cards inside collection tabs', async () => {
  const user = userEvent.setup();
  const emptyJourney = {
    ...journey,
    sessions: [],
    calendar: [],
    photos: [],
    plans: { active: null, history: [] },
    reports: [],
  } as unknown as CustomerJourneyDto;

  render(<CustomerJourney journey={emptyJourney} />);

  await user.click(screen.getByRole('tab', { name: 'Lịch & buổi tập' }));
  expect(screen.getByRole('heading', { name: 'Chưa có lịch tập' })).toBeVisible();
  expect(screen.getByRole('heading', { name: 'Chưa có buổi tập' })).toBeVisible();

  await user.click(screen.getByRole('tab', { name: 'Ảnh tiến độ' }));
  expect(screen.getByRole('heading', { name: 'Chưa có ảnh tiến độ' })).toBeVisible();

  await user.click(screen.getByRole('tab', { name: 'Giáo án' }));
  expect(screen.getByRole('heading', { name: 'Chưa có giáo án' })).toBeVisible();
});
```

- [ ] **Step 4: Chạy test và xác nhận test empty vẫn RED do chưa có tab**

Run:

```powershell
npx vitest run frontend/tests/components/customer-portal/CustomerJourney.test.tsx
```

Expected: 2 tests FAIL vì chưa tìm thấy các tab.

- [ ] **Step 5: Implement state, tablist và tabpanel tối thiểu**

Trong `CustomerJourney.tsx`, thêm `useId`, `useState`, icon cho empty state và khai báo tab:

```tsx
const tabs = [
  'Tổng quan',
  'Lịch & buổi tập',
  'Chỉ số cơ thể',
  'Thành tích',
  'Ảnh tiến độ',
  'Giáo án',
  'Báo cáo',
] as const;
type JourneyTab = typeof tabs[number];

export default function CustomerJourney({ journey }: { journey: CustomerJourneyDto }) {
  const [activeTab, setActiveTab] = useState<JourneyTab>('Tổng quan');
  const tabsId = useId();
  const activeIndex = tabs.indexOf(activeTab);

  return (
    <section className="space-y-4 font-montserrat">
      <div
        className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-100/80 p-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="Chi tiết tiến độ khách hàng"
      >
        {tabs.map((tab, index) => (
          <button
            id={`${tabsId}-tab-${index}`}
            type="button"
            className={activeTab === tab
              ? 'min-h-11 shrink-0 whitespace-nowrap rounded-xl bg-white px-4 text-sm font-bold text-primary shadow-[0_3px_10px_rgba(0,59,112,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary'
              : 'min-h-11 shrink-0 whitespace-nowrap rounded-xl px-4 text-sm font-semibold text-slate-600 transition hover:bg-white/70 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary motion-reduce:transition-none'}
            role="tab"
            aria-selected={activeTab === tab}
            aria-controls={`${tabsId}-panel-${index}`}
            key={tab}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div
        id={`${tabsId}-panel-${activeIndex}`}
        role="tabpanel"
        aria-labelledby={`${tabsId}-tab-${activeIndex}`}
        className="min-w-0"
      >
        {activeTab === 'Tổng quan' && <ProgressOverview analytics={journey.analytics} />}
        {activeTab === 'Chỉ số cơ thể' && <ProgressCharts measurements={journey.measurements} />}
        {activeTab === 'Thành tích' && <AchievementList achievements={journey.analytics.achievements} />}
        {activeTab === 'Báo cáo' && <CustomerProgress reports={journey.reports} />}
      </div>
    </section>
  );
}
```

Trong cùng `tabpanel`, bổ sung bốn nhánh còn lại bằng `ProgressSection` và `ProgressEmptyState`:

```tsx
{activeTab === 'Lịch & buổi tập' && (
  <div className="space-y-4">
    <ProgressSection title="Lịch tập" count={journey.calendar.length} description="Các lịch hẹn tập luyện đã được sắp xếp cho khách hàng.">
      {journey.calendar.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {journey.calendar.map((event) => (
            <article className="rounded-xl border border-slate-200 bg-slate-50/60 p-4" key={String(event._id)}>
              <h3 className="font-bold text-slate-900">{String(event.title)}</h3>
              <p className="mt-1 text-sm text-slate-500">{new Date(String(event.startsAt)).toLocaleString('vi-VN')}</p>
            </article>
          ))}
        </div>
      ) : <ProgressEmptyState icon={CalendarDays} title="Chưa có lịch tập" description="Lịch tập sắp tới sẽ xuất hiện tại đây." />}
    </ProgressSection>
    <ProgressSection title="Buổi đã tập" count={journey.sessions.length} description="Kết quả thực tế của các buổi đã được ghi nhận.">
      {journey.sessions.length > 0
        ? <div className="space-y-3">{journey.sessions.map((session) => <WorkoutSessionDetail session={session} key={session._id} />)}</div>
        : <ProgressEmptyState icon={Dumbbell} title="Chưa có buổi tập" description="Buổi tập đầu tiên sẽ xuất hiện sau khi PT ghi nhận." />}
    </ProgressSection>
  </div>
)}

{activeTab === 'Ảnh tiến độ' && (
  <ProgressSection title="Ảnh tiến độ" count={journey.photos.length} description="Các mốc hình thể đã được ghi nhận trong hành trình.">
    {journey.photos.length > 0
      ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{journey.photos.map((photo) => <img className="aspect-[3/4] w-full rounded-2xl object-cover ring-1 ring-slate-200" src={String(photo.photoUrl)} alt={`Ảnh tiến độ ${String(photo.stage)}`} key={String(photo._id)} />)}</div>
      : <ProgressEmptyState icon={Camera} title="Chưa có ảnh tiến độ" description="Ảnh Before, Progress và After sẽ xuất hiện tại đây." />}
  </ProgressSection>
)}

{activeTab === 'Giáo án' && (
  <ProgressSection title="Giáo án" description="Giáo án đang áp dụng và lịch sử giáo án của khách hàng.">
    {journey.plans.active || journey.plans.history.length > 0 ? (
      <div className="space-y-3">
        {journey.plans.active && <article className="rounded-xl border border-sky-200 bg-sky-50 p-4 font-bold text-primary">{String(journey.plans.active.title)}</article>}
        {journey.plans.history.map((plan) => <article className="rounded-xl border border-slate-200 bg-slate-50/60 p-4" key={String(plan._id)}>{String(plan.title)}</article>)}
      </div>
    ) : <ProgressEmptyState icon={ClipboardList} title="Chưa có giáo án" description="Giáo án sẽ xuất hiện sau khi được gán cho khách hàng." />}
  </ProgressSection>
)}
```

- [ ] **Step 6: Chạy focused test và xác nhận GREEN**

Run:

```powershell
npx vitest run frontend/tests/components/customer-portal/CustomerJourney.test.tsx
```

Expected: 2 tests PASS.

- [ ] **Step 7: Chạy nhóm test Progress liên quan**

Run:

```powershell
npx vitest run frontend/tests/components/customer-portal/CustomerJourney.test.tsx frontend/tests/pages/pt/ProgressPage.test.tsx frontend/tests/components/progress/ProgressWorkspace.test.tsx frontend/tests/components/progress/ProgressTailwindContract.test.ts
```

Expected: tất cả test PASS; không có test failure hoặc unhandled error.

- [ ] **Step 8: Commit thay đổi component và test**

```powershell
git add frontend/src/components/customer-portal/CustomerJourney.tsx frontend/tests/components/customer-portal/CustomerJourney.test.tsx
git commit -m "fix: clarify customer progress detail tabs"
```

### Task 2: Xác minh tích hợp frontend

**Files:**
- Verify only: `frontend/src/components/customer-portal/CustomerJourney.tsx`
- Verify only: `frontend/tests/components/customer-portal/CustomerJourney.test.tsx`

**Interfaces:**
- Consumes: kết quả Task 1.
- Produces: bằng chứng typecheck, lint và production build thành công.

- [ ] **Step 1: Typecheck**

Run từ repository root, nơi chứa `package.json`:

```powershell
npm run typecheck
```

Expected: exit code 0, không có TypeScript error.

- [ ] **Step 2: Lint các file thay đổi qua script dự án**

Run từ repository root:

```powershell
npm run lint
```

Expected: exit code 0; không phát sinh warning mới trong hai file thay đổi.

- [ ] **Step 3: Production build**

Run từ repository root:

```powershell
npm run build
```

Expected: TypeScript và Vite build exit code 0; cảnh báo chunk size hiện hữu được phép nếu không phải regression từ thay đổi này.

- [ ] **Step 4: Kiểm tra working tree**

```powershell
git status --short
```

Expected: chỉ còn file plan nếu chưa commit, hoặc working tree sạch sau khi commit tài liệu kế hoạch.
