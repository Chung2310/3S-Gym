# Workout Studio Professional Confirmations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thay ba `window.confirm` nội bộ của Workout Studio bằng `ConfirmModal` chuẩn.

**Architecture:** `WorkoutStudioPage` giữ discriminated union cho hành động đang chờ. Event handlers chỉ mở modal; một callback xác nhận trung tâm thực thi navigation hoặc cập nhật duration sau khi người dùng đồng ý.

**Tech Stack:** React, React Router, TypeScript, Tailwind hiện có, Vitest, Testing Library.

## Global Constraints

- Giữ `beforeunload` native.
- Không thay đổi dữ liệu trước khi xác nhận.
- Không commit vì người dùng chưa yêu cầu Git.

---

### Task 1: Thay xác nhận điều hướng

**Files:**
- Modify: `frontend/tests/pages/WorkoutStudioPage.test.tsx`
- Modify: `frontend/src/pages/pt/WorkoutStudioPage.tsx`

- [ ] **Step 1:** Sửa test link dirty để đợi dialog `Rời Studio?`, kiểm tra Hủy giữ route và xác nhận mới điều hướng.
- [ ] **Step 2:** Thêm test nút Danh sách mở dialog `Bỏ thay đổi chưa lưu?`.
- [ ] **Step 3:** Chạy test và xác nhận thất bại vì code còn dùng `window.confirm`.
- [ ] **Step 4:** Thêm pending confirmation state và render `ConfirmModal`; thay handler back/link.

### Task 2: Thay xác nhận giảm số ngày

**Files:**
- Modify: `frontend/tests/pages/WorkoutStudioPage.test.tsx`
- Modify: `frontend/src/pages/pt/WorkoutStudioPage.tsx`

- [ ] **Step 1:** Thêm test bài nằm ngoài khoảng ngày mới mở dialog có số lượng bài bị ảnh hưởng.
- [ ] **Step 2:** Xác nhận Hủy không đổi duration; Tiếp tục mới chuyển bài và đổi duration.
- [ ] **Step 3:** Tách hàm áp dụng duration và gọi qua pending confirmation.

### Task 3: Xác minh

**Files:**
- Verify only

- [ ] **Step 1:** Chạy toàn bộ test Studio và regression customer plan.
- [ ] **Step 2:** Chạy lint file thay đổi, typecheck và Vite build.
