# Workout Studio Header Labels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm nhãn cố định, responsive cho bốn trường thông tin trong header Studio giáo án.

**Architecture:** Chỉ thay đổi component trình bày `StudioHeader`; interface props và state ở page được giữ nguyên. Một component test riêng xác nhận semantic label/control trước khi triển khai giao diện.

**Tech Stack:** React, TypeScript, Tailwind CSS v4, Vitest, Testing Library.

## Global Constraints

- Dùng Tailwind CSS v4 cho phần UI được sửa.
- Không thay đổi API, model hoặc callback hiện tại.
- Không commit nếu chưa được người dùng cho phép.

---

### Task 1: Header field labels

**Files:**
- Create: `frontend/tests/components/workout-studio/StudioHeader.test.tsx`
- Modify: `frontend/src/components/workout-studio/StudioHeader.tsx`

**Interfaces:**
- Consumes: `StudioHeader` props hiện tại.
- Produces: bốn semantic labels liên kết với input/select qua nội dung `label` và `aria-label`.

- [x] **Step 1: Write the failing test**

Render `StudioHeader`, sau đó kiểm tra `Tên giáo án`, `Mục tiêu`, `Cấp độ`, `Số ngày` đều có control tương ứng và có nhãn hiển thị.

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run --config vitest.config.ts frontend/tests/components/workout-studio/StudioHeader.test.tsx`

Expected: FAIL vì ba control đầu chưa có nhãn cố định.

- [x] **Step 3: Write minimal implementation**

Bọc mỗi control trong một `label`, thêm `span` chứa nhãn và dùng grid responsive bằng Tailwind.

- [x] **Step 4: Run focused and regression verification**

Run component test, `WorkoutStudioPage.test.tsx`, oxlint và Vite build; tất cả phải thành công.
