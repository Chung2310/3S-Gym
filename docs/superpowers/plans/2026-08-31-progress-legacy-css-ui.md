# Progress Legacy CSS UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chuyển toàn bộ JSX trong module Tiến độ từ Tailwind/inline style sang CSS legacy dùng chung và namespace `progress-*` mà không đổi hành vi.

**Architecture:** JSX chỉ giữ class chung hiện có hoặc class `progress-*`; toàn bộ responsive, state và visual rules đặt trong `frontend/src/index.css`. Migration chia theo dashboard, modal/workspace, workout/measurement và reports để mỗi lát cắt có test riêng.

**Tech Stack:** React 19, TypeScript, CSS global `frontend/src/index.css`, Vitest, Testing Library.

## Global Constraints

- Không thay đổi API, payload, state flow hoặc nội dung nghiệp vụ.
- Không dùng Tailwind utility hoặc `style={{ ... }}` trong các file thuộc phạm vi.
- Ưu tiên `section-header`, `panel`, `button`, `button-primary`, `button-secondary`, `form-grid`, `field`, `inline-actions`, `empty-state`, `modal-backdrop`, `modal-actions`.
- Selector mới dùng namespace `progress-*` và không ảnh hưởng module khác.
- Giữ responsive, role, aria, focus trap, Escape và keyboard behavior.
- Không commit nếu người dùng chưa yêu cầu.

---

### Task 1: Styling contract và dashboard

**Files:**
- Modify: `frontend/tests/components/progress/ProgressDashboard.test.tsx`
- Modify: `frontend/tests/pages/pt/ProgressPage.test.tsx`
- Modify: `frontend/src/pages/pt/ProgressPage.tsx`
- Modify: `frontend/src/components/progress/ProgressDashboard.tsx`
- Modify: `frontend/src/index.css`

**Interfaces:**
- Produces class contract: `progress-page`, `progress-page-header`, `progress-loading`, `progress-dashboard`, `progress-metrics`, `progress-metric-card`, `progress-search-panel`, `progress-customer-grid`, `progress-customer-card`, `progress-customer-summary`, `progress-card-actions`.

- [ ] Thêm test yêu cầu root dashboard có `progress-dashboard`, KPI có `progress-metric-card`, customer card có `progress-customer-card`, action có `progress-card-actions`, và không có class chứa `!`/`bg-emerald-55`.
- [ ] Chạy `npx vitest run --config vitest.config.ts frontend/tests/components/progress/ProgressDashboard.test.tsx frontend/tests/pages/pt/ProgressPage.test.tsx --maxWorkers=1`; kỳ vọng FAIL do class contract chưa tồn tại.
- [ ] Đổi class JSX sang contract trên; giữ nguyên label, callback, filter và nút.
- [ ] Thêm CSS grid 1/2/4 cột cho KPI, 1/2/3 cột cho customer card, card/button states, breakpoint `768px` và `1280px`, cùng `prefers-reduced-motion`.
- [ ] Chạy lại hai test; kỳ vọng PASS.

### Task 2: Modal và workspace tabs

**Files:**
- Modify: `frontend/tests/components/progress/ProgressWorkspace.test.tsx`
- Modify: `frontend/tests/components/progress/WorkoutSessionLogger.test.tsx`
- Modify: `frontend/src/components/progress/ProgressModal.tsx`
- Modify: `frontend/src/components/progress/ProgressDetailModal.tsx`
- Modify: `frontend/src/components/progress/WorkoutSessionModal.tsx`
- Modify: `frontend/src/components/progress/PtProgressWorkspace.tsx`
- Modify: `frontend/src/index.css`

**Interfaces:**
- Consumes Task 1 legacy base.
- Produces: `progress-modal`, `progress-modal-header`, `progress-modal-body`, `progress-modal-close`, `progress-workspace`, `progress-tabs`, `progress-tab`, `progress-tab-active`, `progress-photo-grid`, `progress-plan-card`.

- [ ] Thêm test yêu cầu modal dùng `modal-backdrop progress-modal-backdrop`, dialog dùng `progress-modal`, tabs dùng `progress-tabs`/`progress-tab-active`; giữ assertion Escape/focus hiện có.
- [ ] Chạy test workspace/logger; kỳ vọng FAIL do class mới thiếu.
- [ ] Chuyển JSX của bốn component sang class contract, loại hai inline padding trong `ProgressModal`.
- [ ] Thêm CSS modal max-height, body scroll, mobile padding, tabs horizontal scroll và focus-visible.
- [ ] Chạy lại test; kỳ vọng PASS.

### Task 3: Buổi tập và số đo

**Files:**
- Modify: `frontend/tests/components/progress/WorkoutSessionLogger.test.tsx`
- Modify: `frontend/tests/components/progress/MeasurementForm.test.tsx`
- Modify: `frontend/src/components/progress/WorkoutSessionLogger.tsx`
- Modify: `frontend/src/components/progress/WorkoutSessionDetail.tsx`
- Modify: `frontend/src/components/progress/MeasurementForm.tsx`
- Modify: `frontend/src/index.css`

**Interfaces:**
- Produces: `progress-form`, `progress-form-header`, `progress-form-grid`, `progress-form-section`, `progress-exercise-card`, `progress-set-grid`, `progress-check-field`, `progress-session-card`, `progress-session-stats`, `progress-session-exercises`.

- [ ] Thêm test class contract cho form, exercise fieldset, set grid và session detail; giữ assertion payload POST hiện có.
- [ ] Chạy hai test; kỳ vọng FAIL do class contract chưa có.
- [ ] Chuyển JSX sang class chung `field`, `button button-primary` và các class `progress-*`; không đổi input props/payload.
- [ ] Thêm CSS mobile-first cho field grid, set grid 2 cột rồi 5 cột từ `640px`, session detail và disabled/focus states.
- [ ] Chạy lại test; kỳ vọng PASS.

### Task 4: Overview, charts và achievements

**Files:**
- Modify: `frontend/tests/components/progress/ProgressCharts.test.tsx`
- Modify: `frontend/tests/components/progress/ProgressWorkspace.test.tsx`
- Modify: `frontend/src/components/progress/ProgressOverview.tsx`
- Modify: `frontend/src/components/progress/ProgressCharts.tsx`
- Modify: `frontend/src/components/progress/AchievementList.tsx`
- Modify: `frontend/src/index.css`

**Interfaces:**
- Produces: `progress-overview`, `progress-overview-grid`, `progress-overview-card`, `progress-data-warning`, `progress-chart-section`, `progress-chart-grid`, `progress-chart-card`, `progress-chart-empty`, `progress-chart-svg`, `progress-achievement-grid`, `progress-achievement-card`.

- [ ] Thêm test class contract và assertion không còn attribute `style` trên overview/chart card.
- [ ] Chạy charts/workspace test; kỳ vọng FAIL do inline style và class mới thiếu.
- [ ] Chuyển JSX, giữ nguyên SVG coordinates, aria-label và dữ liệu chart.
- [ ] Thêm CSS grid responsive, padding, card states và SVG sizing.
- [ ] Chạy lại test; kỳ vọng PASS.

### Task 5: Reports và quét toàn module

**Files:**
- Modify: `frontend/tests/components/progress/ProgressReportEditor.test.tsx`
- Modify: `frontend/src/components/progress/ProgressReportGenerator.tsx`
- Modify: `frontend/src/components/progress/ProgressReportEditor.tsx`
- Modify: `frontend/src/components/progress/ProgressReportList.tsx`
- Modify: `frontend/src/index.css`
- Verify: mọi `.tsx` trong `frontend/src/components/progress/` và `frontend/src/pages/pt/ProgressPage.tsx`.

**Interfaces:**
- Produces: `progress-report`, `progress-report-header`, `progress-report-draft`, `progress-report-warning`, `progress-report-actions` và module không còn Tailwind/inline style.

- [ ] Thêm test yêu cầu report dùng `panel progress-report`, `form-grid`, `field`, `inline-actions progress-report-actions`; giữ assertion save/publish.
- [ ] Chạy report test; kỳ vọng FAIL do class contract chưa có.
- [ ] Chuyển ba report component sang class chung và `progress-*`; giữ API calls.
- [ ] Thêm CSS report warnings/draft/actions và responsive.
- [ ] Chạy report test; kỳ vọng PASS.
- [ ] Chạy `rg -n 'style=\{|className=.*(!|(?:^|\s)(?:flex|grid|rounded-|bg-|text-|p-|m-|space-|gap-|border-|shadow-|sm:|md:|lg:|xl:))' frontend/src/pages/pt/ProgressPage.tsx frontend/src/components/progress`; kỳ vọng không có kết quả Tailwind/inline style.

### Task 6: Verification

**Files:**
- Verify all modified files.

- [ ] Chạy `npx vitest run --config vitest.config.ts frontend/tests/components/progress frontend/tests/pages/pt/ProgressPage.test.tsx --maxWorkers=1`; kỳ vọng tất cả PASS.
- [ ] Chạy `npm run typecheck`; kỳ vọng exit 0.
- [ ] Chạy `npx oxlint frontend/src/pages/pt/ProgressPage.tsx frontend/src/components/progress frontend/tests/components/progress frontend/tests/pages/pt/ProgressPage.test.tsx`; kỳ vọng exit 0.
- [ ] Chạy `npm run build`; kỳ vọng exit 0.
- [ ] Rà diff để xác nhận chỉ styling contract/test thay đổi, không có API/payload/business logic bị sửa.
