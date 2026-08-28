# Compact Workout Studio Scheduling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thu gọn Workout Studio thành màn hình chỉ dùng để ghép và xếp lịch bài tập, còn thuộc tính chuyên môn được quản lý tại Thư viện bài tập.

**Architecture:** Giữ nguyên mô hình timeline, kéo thả và dữ liệu tương thích cũ. Inspector chỉ chỉnh ngày, giờ bắt đầu và thời lượng; các thuộc tính chuyên môn trở thành trường tùy chọn trong kiểu dữ liệu để payload mới không tự tạo giá trị giả nhưng dữ liệu cũ vẫn được truyền nguyên vẹn khi tải và lưu lại.

**Tech Stack:** React, TypeScript, Tailwind CSS v4, Vitest, Testing Library.

## Global Constraints

- Không xóa dữ liệu chi tiết cũ khỏi backend hoặc payload đã tải.
- Không thêm dependency, route, API hay CSS global mới.
- UI mới hoặc sửa đổi dùng Tailwind CSS v4.
- Không commit hoặc push nếu chưa có yêu cầu trực tiếp từ người dùng.

---

### Task 1: Khóa hành vi Studio tối giản bằng test

**Files:**
- Modify: `frontend/tests/pages/WorkoutStudioPage.test.tsx`

**Interfaces:**
- Consumes: Trang Studio hiện tại và API mock trong test.
- Produces: Hợp đồng UI chỉ có `Ngày của bài tập`, `Giờ bắt đầu`, `Thời lượng bài tập`; payload mới không có thuộc tính chuyên môn tự sinh.

- [ ] **Step 1: Viết test thất bại cho inspector tối giản**

Sau khi chọn một bài tập, kiểm tra ba điều khiển lịch tồn tại và các nhãn `Số hiệp`, `Số lần`, `Mức tạ`, `Tempo`, `Thời gian nghỉ`, `RPE`, `RIR`, `Ghi chú bài tập` không tồn tại.

- [ ] **Step 2: Viết assertion payload mới không tự sinh chi tiết**

Sau khi thêm và lưu bài tập, lấy phần tử đầu tiên trong `scheduledExercises` rồi dùng `not.toHaveProperty(...)` cho các trường chi tiết chuyên môn.

- [ ] **Step 3: Chạy test để xác nhận RED**

Run: `npx vitest run --config vitest.config.ts frontend/tests/pages/WorkoutStudioPage.test.tsx`

Expected: FAIL vì inspector cũ vẫn hiển thị các trường chuyên môn hoặc payload còn tạo mặc định.

---

### Task 2: Tối giản dữ liệu mới và inspector

**Files:**
- Modify: `frontend/src/types/workoutStudio.ts`
- Modify: `frontend/src/hooks/useWorkoutStudio.ts`
- Modify: `frontend/src/components/workout-studio/ExerciseInspector.tsx`

**Interfaces:**
- Consumes: `ScheduledExercise`, `onUpdate(Partial<ScheduledExercise>)`, `onUnscheduled()`.
- Produces: Bài tập mới chỉ có dữ liệu nhận diện và lịch; bài tập cũ vẫn có thể mang các trường chuyên môn tùy chọn.

- [ ] **Step 1: Chuyển các trường chuyên môn thành tùy chọn**

Giữ bắt buộc `id`, `dayNumber`, `startMinute`, `durationMinutes`, `name`; chuyển `sets`, `reps`, `weight`, `rpe`, `rir`, `tempo`, `restSeconds`, `notes` thành optional.

- [ ] **Step 2: Bỏ giá trị chuyên môn mặc định khi tạo lịch mới**

Hàm tạo `ScheduledExercise` chỉ trả về nhận diện bài tập, ngày, giờ bắt đầu và thời lượng.

- [ ] **Step 3: Viết lại inspector bằng Tailwind**

Render tên bài tập, select ngày, input giờ, điều khiển thời lượng ±15 phút và nút đưa về chưa xếp lịch. Không render hay cập nhật thuộc tính chuyên môn.

- [ ] **Step 4: Chạy test để xác nhận GREEN**

Run: `npx vitest run --config vitest.config.ts frontend/tests/pages/WorkoutStudioPage.test.tsx`

Expected: PASS.

---

### Task 3: Thu gọn bố cục Studio

**Files:**
- Modify: `frontend/src/pages/pt/WorkoutStudioPage.tsx`
- Modify: `frontend/src/components/workout-studio/ExercisePalette.tsx`
- Modify: `frontend/src/components/workout-studio/DayTimeline.tsx`

**Interfaces:**
- Consumes: Các component Studio hiện tại.
- Produces: Lưới desktop ưu tiên chiều rộng timeline, sidebar hẹp hơn, khoảng cách nhỏ hơn và drawer mobile thấp hơn.

- [ ] **Step 1: Áp dụng lưới và khoảng cách Tailwind tại page**

Dùng grid desktop ba cột khoảng `210px minmax(0,1fr) 190px`, gap nhỏ; mobile một cột. Giữ class legacy cần thiết cho hành vi timeline và drawer hiện có.

- [ ] **Step 2: Giảm padding và nội dung thừa ở palette/timeline**

Dùng utility Tailwind để giảm padding, gap và cỡ phần mô tả, bảo toàn kéo thả và timeline 24 giờ.

- [ ] **Step 3: Chạy test trang Studio**

Run: `npx vitest run --config vitest.config.ts frontend/tests/pages/WorkoutStudioPage.test.tsx`

Expected: PASS.

---

### Task 4: Kiểm tra hồi quy

**Files:**
- Verify only: frontend and backend files affected by Workout Studio.

**Interfaces:**
- Consumes: Toàn bộ thay đổi Tasks 1–3.
- Produces: Bằng chứng test, lint, build và typecheck.

- [ ] **Step 1: Chạy nhóm test hồi quy Workout Studio**

Run: `npx vitest run --config vitest.config.ts frontend/tests/pages/WorkoutStudioPage.test.tsx frontend/tests/services/workoutStudioModel.test.ts backend/tests/workoutTemplates.test.ts`

Expected: tất cả test PASS.

- [ ] **Step 2: Chạy lint và build frontend**

Run: `npm run lint --workspace frontend`

Run: `npm run build --workspace frontend`

Expected: cả hai thành công; build có thể giữ cảnh báo kích thước chunk hiện hữu.

- [ ] **Step 3: Chạy typecheck toàn repo**

Run: `npx tsc --noEmit`

Expected: không phát sinh lỗi mới; nếu còn lỗi `backend/tests/auditMatrix.test.ts` thì ghi nhận là lỗi có sẵn ngoài phạm vi.
