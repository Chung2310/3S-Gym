# DataList Action Column Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Căn cột Thao tác và nhóm nút giáo án trên cùng một trục, không xuống dòng ở bảng desktop.

**Architecture:** Chuẩn hóa header/cell thao tác trong primitive `DataList`; bổ sung class không wrap tại nhóm nút chuyên biệt của giáo án. Không thay đổi API hoặc callback hành động.

**Tech Stack:** React, TypeScript, Tailwind CSS v4, Vitest, Testing Library.

## Global Constraints

- Không thêm CSS global mới.
- Không thay đổi card mobile hoặc nghiệp vụ nút.
- Không commit vì người dùng chưa yêu cầu Git.

---

### Task 1: Chuẩn hóa cột thao tác

**Files:**
- Modify: `frontend/src/components/ui/DataList.tsx`
- Modify: `frontend/src/components/workouts/WorkoutTemplateList.tsx`
- Test: `frontend/tests/components/workouts/MyWorkoutPlans.test.tsx`

**Interfaces:**
- Consumes: `renderActions?: (item: T) => ReactNode` hiện có.
- Produces: action `th`/`td` dùng `w-px whitespace-nowrap text-right`; nhóm nút giáo án dùng `flex-nowrap whitespace-nowrap`.

- [ ] **Step 1:** Thêm test kiểm tra class căn phải/không wrap và chạy để xác nhận thất bại.
- [ ] **Step 2:** Thêm Tailwind utilities tĩnh vào `DataList` và `WorkoutTemplateList`.
- [ ] **Step 3:** Chạy lại test component, lint các file thay đổi và Vite build; tất cả phải exit 0.
