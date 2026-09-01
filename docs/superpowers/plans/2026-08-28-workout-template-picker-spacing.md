# Workout Template Picker Spacing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Làm popup Chọn giáo án mẫu rộng, thoáng và ít bo tròn hơn mà không thay đổi hành vi gán giáo án.

**Architecture:** Chỉ thay đổi Tailwind utilities trong component popup hiện có. Một component test sẽ khóa các class chính của khung dialog và thẻ lựa chọn.

**Tech Stack:** React, TypeScript, Tailwind CSS v4, Vitest, Testing Library.

## Global Constraints

- Không thay đổi API hoặc nghiệp vụ gán giáo án.
- Không thêm CSS global mới; dùng Tailwind utilities tĩnh.
- Popup phải responsive và chừa lề an toàn trên mobile.
- Không commit vì người dùng chưa yêu cầu thao tác Git.

---

### Task 1: Điều chỉnh hình học popup chọn giáo án

**Files:**
- Modify: `frontend/src/components/customers/WorkoutTemplatePickerModal.tsx`
- Test: `frontend/tests/components/customers/CustomerWorkoutPlanTab.test.tsx`

**Interfaces:**
- Consumes: `WorkoutTemplatePickerModal` với props hiện có.
- Produces: dialog có khung `max-w-[560px] rounded-xl p-4 sm:p-6`; thẻ giáo án có `rounded-lg p-4`.

- [ ] **Step 1: Viết kiểm thử thất bại**

Sau khi mở popup, lấy dialog và xác nhận phần tử con trực tiếp có class `max-w-[560px]`, `rounded-xl`, `p-4`, `sm:p-6`; nút giáo án có `rounded-lg` và `p-4`.

- [ ] **Step 2: Chạy test để xác nhận đỏ**

Run: `npx vitest run --config vitest.config.ts frontend/tests/components/customers/CustomerWorkoutPlanTab.test.tsx`

Expected: FAIL vì component hiện dùng `max-w-xl rounded-2xl p-5` và thẻ dùng `rounded-xl p-3`.

- [ ] **Step 3: Áp dụng Tailwind tối thiểu**

Đổi khung popup sang `w-full max-w-[560px] rounded-xl bg-white p-4 shadow-2xl sm:p-6`; đổi thẻ sang `rounded-lg border p-4` và giữ nguyên các class trạng thái/interaction khác.

- [ ] **Step 4: Chạy xác minh**

Run test component, oxlint các file thay đổi và Vite build. Kết quả mong đợi: test/lint/build đều exit 0.
