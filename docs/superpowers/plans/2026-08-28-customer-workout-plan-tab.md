# Customer Workout Plan Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gán một snapshot giáo án mẫu cho từng khách trong tab Giáo án của CustomerDetailModal và chỉnh snapshot đó bằng Studio mà không sửa mẫu nguồn.

**Architecture:** Mở rộng `WorkoutPlan` thành snapshot có vòng đời `ACTIVE/ARCHIVED`, bổ sung service và nested customer routes để gán, đọc và sửa có kiểm tra quyền PT. Frontend tách tab Giáo án thành component riêng, dùng popup chọn mẫu và tái sử dụng Workout Studio qua route theo khách hàng; module gán cũ được loại khỏi điều hướng.

**Tech Stack:** Express, Mongoose, Joi, React, TypeScript, React Router, Tailwind CSS v4, Vitest, Testing Library.

## Global Constraints

- Mỗi khách có tối đa một giáo án `ACTIVE`.
- Gán và gán lại luôn tạo snapshot; không cập nhật giáo án mẫu.
- Giáo án cũ chuyển `ARCHIVED` và không được PATCH.
- UI mới dùng Tailwind CSS v4, không thêm CSS global.
- Giữ dữ liệu lịch kéo-thả và thuộc tính legacy.
- Không commit hoặc push khi chưa được yêu cầu.

---

### Task 1: Backend snapshot lifecycle

**Files:**
- Modify: `backend/models/WorkoutPlan.ts`
- Create: `backend/services/customerWorkoutPlanService.ts`
- Create: `backend/controllers/customerWorkoutPlanController.ts`
- Create: `backend/validators/customerWorkoutPlanValidator.ts`
- Modify: `backend/routes/customers.ts`
- Test: `backend/tests/customerWorkoutPlans.test.ts`

**Interfaces:**
- `listCustomerWorkoutPlans(user, customerId)` returns `{ active, history }`.
- `assignCustomerWorkoutPlan(user, customerId, templateId)` archives the current snapshot and creates a new active snapshot.
- `getCustomerWorkoutPlan(user, customerId, planId)` returns one authorized snapshot.
- `updateCustomerWorkoutPlan(user, customerId, planId, payload)` updates only an active snapshot.

- [ ] Write failing service tests proving snapshot isolation, one active plan, archive history, authorization, and archived update rejection.
- [ ] Run `npx vitest run --config vitest.config.ts backend/tests/customerWorkoutPlans.test.ts` and verify RED.
- [ ] Extend the model with template schedule fields, source reference and lifecycle fields plus a partial unique index.
- [ ] Implement authorization, assignment transaction, list/get/update service operations and controllers.
- [ ] Add Joi schemas for object IDs and Studio schedule payload, then mount nested customer routes before `/:id`.
- [ ] Run the backend test and verify GREEN.

---

### Task 2: Customer detail workout-plan tab

**Files:**
- Modify: `frontend/src/types/workout.ts`
- Create: `frontend/src/components/customers/CustomerWorkoutPlanTab.tsx`
- Create: `frontend/src/components/customers/WorkoutTemplatePickerModal.tsx`
- Modify: `frontend/src/components/ui/CustomerDetailModal.tsx`
- Test: `frontend/tests/components/customers/CustomerWorkoutPlanTab.test.tsx`

**Interfaces:**
- `CustomerWorkoutPlanTab({ customerId, customerName })` loads `/api/customers/:id/workout-plans`.
- Picker loads `/api/workout-templates?page=1&limit=100` and emits a selected template ID.
- Assignment posts `{ templateId }` and refreshes active/history state.

- [ ] Write failing component tests for empty state, picker assignment, active card, history, and Studio navigation.
- [ ] Run the targeted component test and verify RED.
- [ ] Add snapshot response types and implement the picker and tab with loading/error/disabled states.
- [ ] Add `plans` to `DetailTab`, render the new tab beside workout history, and pass the selected customer context.
- [ ] Run the targeted component test and verify GREEN.

---

### Task 3: Customer-specific Workout Studio

**Files:**
- Modify: `frontend/src/pages/pt/WorkoutStudioPage.tsx`
- Modify: `frontend/src/components/workout-studio/StudioHeader.tsx`
- Modify: `frontend/src/routes/PortalRoutes.tsx`
- Test: `frontend/tests/pages/WorkoutStudioPage.test.tsx`

**Interfaces:**
- Route: `/pt/customers/:customerId/workout-plans/:planId/edit`.
- Customer Studio GET/PATCH uses `/api/customers/:customerId/workout-plans/:planId`.
- Template Studio routes and API remain unchanged.

- [ ] Write failing page test proving customer route loads and saves nested API without PATCHing `/api/workout-templates`.
- [ ] Run the page test and verify RED.
- [ ] Detect customer route params, load/save the nested resource, show customer context, and return to `/pt/customers`.
- [ ] Register the protected route and verify the page test GREEN.

---

### Task 4: Remove old assignment module entry points

**Files:**
- Modify: `frontend/src/config/portalNavigation.ts`
- Modify: `frontend/src/components/workouts/MyWorkoutPlans.tsx`
- Modify: `frontend/src/routes/PortalRoutes.tsx`
- Test: `frontend/tests/config/portalNavigation.test.ts`
- Test: `frontend/tests/components/workouts/MyWorkoutPlans.test.tsx`
- Test: `frontend/tests/pages/PortalPage.test.tsx`

**Interfaces:**
- `/pt/customer-workout-plans` redirects to `/pt/customers`.
- Template list exposes create/edit but no assignment action.

- [ ] Update tests first to require no customer-plan navigation item, no assign action, and safe redirect; run and verify RED.
- [ ] Remove the navigation item and assignment handler, replace the old route element with `Navigate`.
- [ ] Run the navigation, list, and route tests and verify GREEN.

---

### Task 5: Regression verification

**Files:**
- Verify all files above.

**Interfaces:**
- Produces verification evidence only.

- [ ] Run all new and modified backend/frontend tests.
- [ ] Run `npm run lint` and confirm no new errors.
- [ ] Run `npx vite build` in `frontend` and confirm bundle success.
- [ ] Run `npx tsc --noEmit`; report the known `backend/tests/auditMatrix.test.ts` error separately if unchanged.
- [ ] Run `git diff --check` and inspect scoped status without modifying unrelated worktree changes.
