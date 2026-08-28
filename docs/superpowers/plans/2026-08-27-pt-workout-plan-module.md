# PT Workout Plan Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tách module Giáo án của PT khỏi check-in/tiến độ, đồng thời cho phép tạo giáo án khách hàng từ một giáo án mẫu và quản lý vòng đời công bố.

**Architecture:** Route `/portal/pt/workout-plans` render workspace hai tab dùng hai API hiện có: template và workout plan. Hàm ánh xạ thuần tạo dữ liệu form độc lập từ template; các component check-in/lịch sử được chuyển sang `ProgressWorkspace`. Route cũ chỉ redirect để tương thích.

**Tech Stack:** React 19, React Router 7, TypeScript, Vitest, Testing Library, API REST hiện có.

## Global Constraints

- Không thay đổi backend hoặc schema trong phạm vi này.
- Giáo án tạo từ mẫu luôn là bản nháp độc lập.
- Route Giáo án dùng feature `EXERCISE_LIBRARY`; route Tiến độ dùng `PROGRESS`.
- Công bố, thu hồi và xóa phải qua popup xác nhận.
- Không tạo commit nếu người dùng chưa yêu cầu.

---

### Task 1: Điều hướng và phân tách workspace

**Files:**
- Modify: `frontend/src/config/portalNavigation.ts`
- Modify: `frontend/src/pages/PortalPage.tsx`
- Modify: `frontend/src/features/workouts/WorkoutWorkspace.tsx`
- Modify: `frontend/src/features/progress/ProgressWorkspace.tsx`
- Test: `frontend/src/pages/PortalPage.test.tsx`

**Interfaces:**
- Produces route `/portal/pt/workout-plans` và redirect `/portal/pt/workouts`.
- Produces `WorkoutWorkspace` chỉ chứa nội dung giáo án.
- Produces `ProgressWorkspace` chứa `WorkoutCheckIn` và `WorkoutSessionHistory`.

- [ ] Viết test thất bại: PT thấy menu `Giáo án`, route mới render heading Giáo án, route cũ redirect, trang Giáo án không có heading `Check-in buổi tập`, trang Tiến độ có heading đó.
- [ ] Chạy `npx vitest run --config vitest.config.ts frontend/src/pages/PortalPage.test.tsx` và xác nhận test mới thất bại do route/menu chưa tồn tại.
- [ ] Đổi navigation sang `{ path: '/portal/pt/workout-plans', label: 'Giáo án', feature: 'EXERCISE_LIBRARY' }`; thêm route mới và redirect route cũ; chuyển hai component buổi tập sang `ProgressWorkspace`.
- [ ] Chạy lại test và xác nhận pass.

### Task 2: Ánh xạ giáo án mẫu sang bản nháp khách hàng

**Files:**
- Create: `frontend/src/features/workouts/workoutPlanMapper.ts`
- Create: `frontend/src/features/workouts/workoutPlanMapper.test.ts`
- Modify: `frontend/src/features/workouts/WorkoutTemplateList.tsx`

**Interfaces:**
- Consumes `WorkoutTemplate`.
- Produces `CustomerWorkoutPlanDraft` và `workoutTemplateToDraft(template): CustomerWorkoutPlanDraft`.
- `WorkoutTemplateList` nhận thêm `onAssign(template)`.

- [ ] Viết test thất bại cho `workoutTemplateToDraft`: giữ title/session/exercise; đổi `restSeconds` thành chuỗi `rest`; loại bỏ metadata template; dữ liệu lồng nhau không dùng chung tham chiếu.
- [ ] Chạy `npx vitest run --config vitest.config.ts frontend/src/features/workouts/workoutPlanMapper.test.ts` và xác nhận fail vì module chưa tồn tại.
- [ ] Cài đặt type và hàm mapper thuần; thêm nút `Gán cho khách` cho template ACTIVE.
- [ ] Chạy lại test và xác nhận pass.

### Task 3: Form giáo án khách hàng

**Files:**
- Create: `frontend/src/features/workouts/CustomerWorkoutPlanModal.tsx`
- Create: `frontend/src/features/workouts/CustomerWorkoutPlanModal.test.tsx`
- Modify: `frontend/src/components/ContentFormModal.tsx`

**Interfaces:**
- Props: `{ open: boolean; item?: CustomerWorkoutPlan | null; initialDraft?: CustomerWorkoutPlanDraft | null; onClose(): void; onSaved(): void }`.
- Gửi `POST /api/workout-plans` khi tạo và `PATCH /api/workout-plans/:id` khi sửa.

- [ ] Viết test thất bại: initial draft từ template điền sẵn tiêu đề/buổi/bài; PT nhập customerId; submit gọi POST với dates và sessions; lỗi giữ modal mở.
- [ ] Chạy test riêng và xác nhận fail vì component chưa tồn tại.
- [ ] Tách/tái sử dụng phần form workout plan từ `ContentFormModal`, giữ UI thêm/xóa buổi và bài, giữ trạng thái khi request lỗi.
- [ ] Chạy lại test form và các test `ContentFormModal` liên quan.

### Task 4: Danh sách và vòng đời giáo án khách hàng

**Files:**
- Create: `frontend/src/features/workouts/CustomerWorkoutPlanPanel.tsx`
- Create: `frontend/src/features/workouts/CustomerWorkoutPlanPanel.test.tsx`
- Modify: `frontend/src/features/workouts/WorkoutWorkspace.tsx`

**Interfaces:**
- GET `/api/workout-plans?page=:page&limit=20&customerId=:id&status=:status`.
- PATCH `/:id/publish`, PATCH `/:id/unpublish`, DELETE `/:id`.
- Nhận `initialDraft` từ thao tác gán template và mở `CustomerWorkoutPlanModal`.

- [ ] Viết test thất bại cho lọc, tạo mới, sửa, xác nhận công bố/thu hồi/xóa và refresh sau thành công.
- [ ] Chạy test riêng và xác nhận fail vì panel chưa tồn tại.
- [ ] Cài đặt panel với `DataList`, `Pagination`, `ConfirmModal`, toast và modal form.
- [ ] Nâng `WorkoutWorkspace` thành hai tab `Giáo án mẫu`/`Giáo án khách hàng`, nối `onAssign` vào draft của tab khách hàng.
- [ ] Chạy test panel/workspace và xác nhận pass.

### Task 5: Kiểm thử hồi quy và build

**Files:**
- Modify khi cần: các test frontend liên quan đến label/path cũ.

**Interfaces:** Không tạo interface mới.

- [ ] Chạy nhóm test liên quan: `npx vitest run --config vitest.config.ts frontend/src/pages/PortalPage.test.tsx frontend/src/features/workouts frontend/src/features/progress`.
- [ ] Sửa các regression chỉ phát sinh từ thay đổi route/layout, không nới lỏng assertion nghiệp vụ.
- [ ] Chạy `npm run typecheck` và sửa toàn bộ lỗi TypeScript.
- [ ] Chạy `npm run lint` và sửa lỗi thuộc các file thay đổi.
- [ ] Chạy `npm test` và xác nhận không có test thất bại.
- [ ] Chạy `npm run build` và xác nhận Vite build thành công.
- [ ] Đối chiếu từng tiêu chí trong spec và kiểm tra `git diff --check`.
