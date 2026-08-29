# Workout Template General Metadata Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm metadata chung cho giáo án và chỉnh sửa chúng trong tab Giáo án ở cột phải Studio.

**Architecture:** Metadata được lưu trực tiếp trên `WorkoutTemplate` và được sao chép sang `WorkoutPlan`. Studio quản lý metadata ở page state; một component sidebar chuyên biệt điều phối tab Giáo án/Bài tập mà không thay đổi logic timeline.

**Tech Stack:** Express, Mongoose, Joi, React, TypeScript, Tailwind CSS v4, Vitest, Testing Library.

## Global Constraints

- Mọi trường metadata mới đều không bắt buộc.
- Không thêm Rest chung.
- Metadata không tự điền hoặc ghi đè thuộc tính bài tập.
- Snapshot khách hàng độc lập với template nguồn.
- Không thêm CSS global mới cho UI mới.
- Không commit vì người dùng chưa yêu cầu Git.

---

### Task 1: Lưu và validate metadata trên template

**Files:**
- Modify: `backend/models/WorkoutTemplate.ts`
- Modify: `backend/validators/workoutValidator.ts`
- Modify: `backend/routes/workoutTemplates.ts`
- Modify: `backend/services/workoutProgressService.ts`
- Test: `backend/tests/workoutProgress.test.ts`

**Interfaces:**
- Produces fields: `muscleGroups: string[]`, `defaultSets?: number`, `defaultReps?: string`, `defaultWeight?: string`, `defaultTempo?: string`, `technicalNotes?: string`.

- [ ] **Step 1:** Thêm test POST/PATCH template với đầy đủ metadata và xác nhận response giữ nguyên dữ liệu.
- [ ] **Step 2:** Chạy test và xác nhận validator/model hiện tại làm mất hoặc từ chối field mới.
- [ ] **Step 3:** Mở rộng interface/schema Mongoose, Joi `templateFields`, danh sách field update của cả hai đường service/route.
- [ ] **Step 4:** Chạy lại `workoutProgress.test.ts` và xác nhận đạt.

### Task 2: Sao chép và sửa metadata trong snapshot khách hàng

**Files:**
- Modify: `backend/models/WorkoutPlan.ts`
- Modify: `backend/services/customerWorkoutPlanService.ts`
- Modify: `backend/validators/customerWorkoutPlanValidator.ts`
- Test: `backend/tests/customerWorkoutPlans.test.ts`
- Test: `backend/tests/customerWorkoutPlansStandalone.test.ts`

**Interfaces:**
- Consumes metadata từ template Task 1.
- Produces snapshot có cùng metadata, mutable độc lập với template.

- [ ] **Step 1:** Mở rộng fixture/test gán để xác nhận metadata được sao chép và PATCH snapshot không sửa template.
- [ ] **Step 2:** Chạy test và xác nhận thất bại do snapshot chưa có fields.
- [ ] **Step 3:** Thêm schema fields vào `WorkoutPlan`, sao chép trong `snapshotFields`, cho phép update và validate.
- [ ] **Step 4:** Chạy test trên replica set và standalone; xác nhận lịch sử và metadata đều đúng.

### Task 3: Xây sidebar hai tab trong Studio

**Files:**
- Create: `frontend/src/components/workout-studio/StudioSidebar.tsx`
- Create: `frontend/src/components/workout-studio/TemplateMetadataForm.tsx`
- Modify: `frontend/src/components/workout-studio/ExerciseInspector.tsx`
- Modify: `frontend/src/types/workoutStudio.ts`
- Test: `frontend/tests/pages/WorkoutStudioPage.test.tsx`

**Interfaces:**
- `TemplateMetadata` chứa sáu field mới.
- `TemplateMetadataForm` nhận `value`, `muscleGroupOptions`, `readOnly`, `onChange`.
- `StudioSidebar` nhận tab active, metadata props và props inspector hiện có.

- [ ] **Step 1:** Thêm test tải Studio, thấy hai tab Giáo án/Bài tập, metadata được hydrate và input disabled khi readonly.
- [ ] **Step 2:** Chạy test để xác nhận component/tab chưa tồn tại.
- [ ] **Step 3:** Tạo form Tailwind với multi-select nhóm cơ, input Sets/Reps/Weight/Tempo và textarea ghi chú; tạo sidebar điều phối hai tab.
- [ ] **Step 4:** Chạy test component/page và xác nhận đạt.

### Task 4: Tích hợp state, payload và hành vi chuyển tab

**Files:**
- Modify: `frontend/src/pages/pt/WorkoutStudioPage.tsx`
- Modify: `frontend/src/components/workout-studio/StudioSidebar.tsx`
- Modify: `frontend/src/types/workoutStudio.ts`
- Test: `frontend/tests/pages/WorkoutStudioPage.test.tsx`

**Interfaces:**
- GET hydrate metadata vào state.
- POST/PATCH gửi metadata cùng payload hiện có.
- Chọn exercise đặt sidebar tab thành `exercise`; đóng inspector đặt tab thành `template`.

- [ ] **Step 1:** Thêm test chỉnh metadata rồi lưu và kiểm tra payload; thêm test chọn bài tập tự mở tab Bài tập.
- [ ] **Step 2:** Chạy test và xác nhận thất bại vì payload/chuyển tab chưa có.
- [ ] **Step 3:** Tích hợp metadata state, dirty state, hydrate/save và đổi grid desktop thành cột phải `260px`.
- [ ] **Step 4:** Chạy toàn bộ test Studio và xác nhận đạt.

### Task 5: Xác minh hồi quy

**Files:**
- Verify only

- [ ] **Step 1:** Chạy các test workout backend, customer snapshot và Studio frontend.
- [ ] **Step 2:** Chạy oxlint trên các file thay đổi.
- [ ] **Step 3:** Chạy typecheck và Vite production build; ghi nhận riêng lỗi tồn tại sẵn nếu có.
