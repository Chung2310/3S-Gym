# Workout Plans Roadmap-Aligned Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Làm mới danh sách Giáo án, Thư viện bài tập và Workout Studio theo ngôn ngữ giao diện Roadmap mà không thay đổi API hoặc nghiệp vụ hiện tại.

**Architecture:** Giữ state và API orchestration tại các page/component hiện có, thay DataList bằng các feature card có semantic HTML và tách `WorkoutTemplateCard` để kiểm thử độc lập. Các component Studio tiếp tục nhận dữ liệu/callback từ `WorkoutStudioPage`; responsive được giải quyết bằng Tailwind và trạng thái panel hiện có, không thêm dependency.

**Tech Stack:** React 19, TypeScript, React Router, Tailwind CSS v4, Lucide React, Vitest, Testing Library.

## Global Constraints

- Không thay đổi API, payload hoặc cấu trúc dữ liệu backend.
- Giữ nguyên quyền sở hữu bài tập và các quyền thao tác hiện tại.
- Chỉ dùng Tailwind CSS v4 cho UI được sửa; không thêm CSS framework, CSS module hoặc inline style mới.
- Dùng `font-oswald` cho tiêu đề và `font-montserrat` cho nội dung.
- Card ngoài bo mềm; nội dung bên trong dùng khoảng trắng và đường phân cách, không lồng card dày đặc.
- Không tạo commit, worktree hoặc subagent vì người dùng chưa cấp quyền cho các thao tác đó.

---

### Task 1: Danh sách giáo án dạng card và toolbar

**Files:**
- Create: `frontend/src/components/workouts/WorkoutTemplateCard.tsx`
- Modify: `frontend/src/components/workouts/WorkoutTemplateList.tsx`
- Modify: `frontend/src/components/workouts/MyWorkoutPlans.tsx`
- Test: `frontend/tests/components/workouts/MyWorkoutPlans.test.tsx`

**Interfaces:**
- `WorkoutTemplateCardProps`: `{ template: WorkoutTemplate; onEdit(template): void; onArchive(template): void; onDelete(template): void; onAssign?(template): void }`.
- `WorkoutTemplateList` tiếp tục nhận `{ refreshKey, onEdit, onAssign? }` để không phá consumer hiện tại.

- [ ] **Step 1: Viết test thất bại cho card và toolbar**

  Thay assertion bảng cũ bằng semantic card và thêm kiểm tra lọc:

  ```tsx
  expect(await screen.findByRole('article', { name: template.title })).toBeVisible();
  expect(screen.getByText('1 buổi')).toBeVisible();
  expect(screen.getByText('Cơ bản')).toBeVisible();
  await user.selectOptions(screen.getByLabelText('Trạng thái giáo án'), 'ARCHIVED');
  expect(api.get).toHaveBeenLastCalledWith(expect.stringContaining('status=ARCHIVED'));
  ```

- [ ] **Step 2: Chạy test để xác nhận thất bại**

  Run: `npm test -- frontend/tests/components/workouts/MyWorkoutPlans.test.tsx`

  Expected: FAIL vì chưa có article/card và assertion cột bảng cũ không còn phù hợp.

- [ ] **Step 3: Tạo `WorkoutTemplateCard`**

  Component dùng `<article aria-label={template.title}>`, header có status/version, phần metrics phân cách bằng `divide-x`, footer action có accessible name `Chỉnh sửa ${title}`, `Lưu trữ ${title}` hoặc `Xóa ${title}`. Cấp độ map `BEGINNER → Cơ bản`, `INTERMEDIATE → Trung cấp`, `ADVANCED → Nâng cao`; số bài tập tính bằng tổng `sessions[].exercises.length`.

- [ ] **Step 4: Làm mới `WorkoutTemplateList`**

  Bổ sung state `search`, giữ `status`, render toolbar Tailwind, skeleton card khi loading, empty state khác nhau cho danh sách trống và bộ lọc không có kết quả. Giữ endpoint `/api/workout-templates?page=&limit=20&status=` và thêm `search` chỉ khi backend hiện đã hỗ trợ; nếu chưa hỗ trợ thì lọc tên/mục tiêu cục bộ trên page hiện tại để không thay API.

- [ ] **Step 5: Đồng bộ shell `MyWorkoutPlans`**

  Giữ query-string tabs, thay tab/header bằng spacing và surface đồng bộ Roadmap; không đổi routes tạo/sửa.

- [ ] **Step 6: Chạy test Task 1**

  Run: `npm test -- frontend/tests/components/workouts/MyWorkoutPlans.test.tsx frontend/tests/pages/pt/WorkoutPlansPage.test.tsx`

  Expected: PASS.

### Task 2: Thư viện bài tập dạng card

**Files:**
- Create: `frontend/src/components/exercises/ExerciseLibraryCard.tsx`
- Modify: `frontend/src/pages/pt/ExerciseLibraryPage.tsx`
- Modify: `frontend/src/components/exercises/ExerciseFilter.tsx`
- Test: `frontend/tests/components/exercises/ExerciseLibrary.test.tsx`

**Interfaces:**
- `ExerciseLibraryCardProps`: `{ exercise: Exercise; onEdit(exercise): void; onDelete(exercise): void }`.
- Chỉ render action quản lý khi `exercise.canManage` đúng như hiện tại.

- [ ] **Step 1: Viết test thất bại cho card, quyền và empty state**

  ```tsx
  expect(await screen.findByRole('article', { name: 'Squat' })).toBeVisible();
  expect(screen.getByRole('button', { name: 'Sửa Squat' })).toBeVisible();
  expect(screen.getByRole('button', { name: 'Xóa Squat' })).toBeVisible();
  expect(screen.queryByRole('button', { name: /Sửa Global row/ })).not.toBeInTheDocument();
  ```

- [ ] **Step 2: Chạy test để xác nhận thất bại**

  Run: `npm test -- frontend/tests/components/exercises/ExerciseLibrary.test.tsx`

  Expected: FAIL vì trang đang dùng DataList.

- [ ] **Step 3: Tạo `ExerciseLibraryCard` và thay grid**

  Card hiển thị tên, nhóm cơ, level, scope và số video; link video giữ `target="_blank" rel="noopener noreferrer"`. Dùng một card ngoài, metrics phân cách bằng border/divider, không bọc từng trường trong card con.

- [ ] **Step 4: Hoàn thiện states và filter**

  Giữ filter nhóm cơ/cấp độ và pagination hiện tại; thêm skeleton, empty state và reset filter. Giữ nguyên `ExerciseFormModal`, `ConfirmModal`, delete loading và logic target page sau khi xóa.

- [ ] **Step 5: Chạy test Task 2**

  Run: `npm test -- frontend/tests/components/exercises/ExerciseLibrary.test.tsx`

  Expected: PASS.

### Task 3: Làm mới Workout Studio và sửa selector lỗi

**Files:**
- Modify: `frontend/src/pages/pt/WorkoutStudioPage.tsx`
- Modify: `frontend/src/components/workout-studio/StudioHeader.tsx`
- Modify: `frontend/src/components/workout-studio/StudioDayNavigator.tsx`
- Modify: `frontend/src/components/workout-studio/ExercisePalette.tsx`
- Modify: `frontend/src/components/workout-studio/DayTimeline.tsx`
- Modify: `frontend/src/components/workout-studio/StudioSidebar.tsx`
- Modify: `frontend/src/index.css` only to remove/replace legacy Studio rules that conflict with Tailwind.
- Test: `frontend/tests/pages/WorkoutStudioPage.test.tsx`

**Interfaces:**
- Không đổi props public của năm component Studio trừ khi thêm prop responsive có default an toàn.
- Nút thêm bài có accessible name `Thêm bài ${exercise.name}`; test không được truy vấn cả row bằng chuỗi ghép tên/nhóm cơ.

- [ ] **Step 1: Sửa sáu selector cũ và bổ sung assertion hierarchy**

  Thay mọi truy vấn dạng:

  ```tsx
  screen.findByRole('button', { name: /SquatLEGS/ })
  ```

  bằng:

  ```tsx
  screen.findByRole('button', { name: 'Thêm bài Squat' })
  ```

  Đồng thời kiểm tra header surface, day nav và ba vùng có accessible labels.

- [ ] **Step 2: Chạy test để xác nhận trạng thái ban đầu**

  Run: `npm test -- frontend/tests/pages/WorkoutStudioPage.test.tsx`

  Expected: selector mới khớp UI hiện tại ở phần palette; các assertion layout mới FAIL trước triển khai.

- [ ] **Step 3: Làm mới header và day navigator**

  Header dùng một surface `rounded-2xl border border-slate-200 bg-white`, metadata grid responsive và status compact. Day navigator dùng scroll ngang có snap trên mobile, active day màu primary, focus-visible rõ; giữ nút trước/sau và tổng phút.

- [ ] **Step 4: Chuẩn hóa ba vùng Studio**

  `WorkoutStudioPage` dùng grid desktop `min-[1001px]:grid-cols-[17rem_minmax(0,1fr)_18rem]`; timeline là vùng chính. Palette và sidebar bỏ chiều cao viewport cứng gây cắt nội dung, dùng sticky/max-height chỉ ở desktop. Mobile xếp timeline trước bằng CSS order; palette/sidebar theo panel hiện có và nút đóng inspector giữ nguyên.

- [ ] **Step 5: Làm phẳng nội dung Palette và Sidebar**

  Giữ recommendation, filter, unscheduled tray và inspector fields; giảm pill/card lồng nhau bằng divider và row surfaces. Không đổi handlers kéo thả, `onPlace`, `onPlaceUnscheduled`, metadata hoặc exercise update.

- [ ] **Step 6: Chạy test Task 3**

  Run: `npm test -- frontend/tests/pages/WorkoutStudioPage.test.tsx`

  Expected: toàn bộ test PASS, gồm thêm bài, overlap, pointer move, keyboard move, save, read-only và confirmation guards.

### Task 4: Kiểm tra tích hợp và trình duyệt

**Files:**
- Modify tests only if verification reveals a real contract mismatch; do not weaken assertions.

- [ ] **Step 1: Chạy toàn bộ test liên quan**

  Run: `npm test -- frontend/tests/components/workouts frontend/tests/components/exercises/ExerciseLibrary.test.tsx frontend/tests/pages/WorkoutStudioPage.test.tsx frontend/tests/pages/pt/WorkoutPlansPage.test.tsx`

  Expected: PASS.

- [ ] **Step 2: Typecheck**

  Run: `npm run typecheck`

  Expected: exit code 0.

- [ ] **Step 3: Production build**

  Run: `npm run build`

  Expected: exit code 0; cảnh báo chunk size hiện hữu được ghi nhận nhưng không thuộc phạm vi sửa giao diện.

- [ ] **Step 4: Smoke test trình duyệt**

  Khởi động ứng dụng và đăng nhập PT demo. Kiểm tra `/pt/my-workout-plans`, `?tab=exercises`, `/pt/my-workout-plans/new` và một route edit có dữ liệu. Xác nhận tab/navigation, filter, mở modal, thêm bài, đổi ngày, mở inspector và responsive desktop/mobile; không lưu/xóa dữ liệu thật nếu chưa tạo bản ghi dùng một lần.

- [ ] **Step 5: Dọn tài nguyên kiểm thử và báo cáo**

  Dừng server/browser headless do phiên này tạo, xóa profile/script tạm đã xác minh nằm trong workspace, và báo cáo test pass/fail cùng giới hạn dữ liệu demo.
