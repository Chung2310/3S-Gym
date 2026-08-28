# Workout Builder Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chuyển form tạo/sửa giáo án của PT từ nội dung inline sang popup dùng chung.

**Architecture:** `MyWorkoutPlans` quản lý trạng thái popup và template đang sửa. `WorkoutBuilder` dùng `FormModal` làm vỏ, tiếp tục sở hữu state và API hiện tại, đồng thời báo đóng sau khi lưu.

**Tech Stack:** React 19, React Router, Vitest, Testing Library.

## Global Constraints

- Không thay đổi API workout templates.
- Tạo và sửa dùng cùng một popup kích thước lớn.
- Cảnh báo khi đóng popup có thay đổi chưa lưu.
- Không commit hoặc push khi chưa được yêu cầu.

---

### Task 1: Popup tạo/sửa giáo án

**Files:**
- Modify: `frontend/tests/components/workouts/MyWorkoutPlans.test.tsx`
- Modify: `frontend/src/components/workouts/MyWorkoutPlans.tsx`
- Modify: `frontend/src/components/workouts/WorkoutBuilder.tsx`

- [ ] Viết test RED cho trạng thái đóng, mở tạo, mở sửa và đóng sau lưu.
- [ ] Chạy test và xác nhận lỗi do form còn inline.
- [ ] Thêm nút tạo; chuyển builder sang `FormModal` với props `open`, `template`, `onClose`, `onSaved`.
- [ ] Reset state đúng khi mở tạo/sửa; giữ API POST/PATCH hiện tại.
- [ ] Chạy test GREEN, typecheck và build frontend.
