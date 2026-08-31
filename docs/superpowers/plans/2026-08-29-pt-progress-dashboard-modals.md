# PT Progress Dashboard And Modals Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cung cấp dashboard tiến độ mọi khách của PT và hai modal xem/ghi nhận riêng.

**Architecture:** Backend gom sessions và measurements theo tập customer được phân quyền rồi tái sử dụng analytics hiện có. Frontend page giữ state/fetching; các component dashboard và modal chỉ render/callback.

**Tech Stack:** Express, Mongoose, React 19, TypeScript, Tailwind CSS v4, Vitest, Testing Library.

## Global Constraints

- PT chỉ thấy khách có `assignedPtId` bằng user hiện tại; ADMIN có thể thấy toàn bộ.
- UI mới dùng Tailwind v4, không thêm inline style hoặc global CSS.
- Hai modal độc lập, không nhúng form ghi nhận vào trang chính.
- Không commit hoặc push nếu chưa được yêu cầu riêng.

---

### Task 1: Progress overview API

**Files:** `backend/services/customerJourneyService.ts`, `backend/controllers/customerJourneyController.ts`, `backend/routes/customerJourney.ts`, `backend/tests/customerProgressOverview.test.ts`

- [ ] Viết test phân quyền và analytics danh sách, chạy để xác nhận đỏ.
- [ ] Thêm `getProgressOverview(user)` và endpoint `GET /api/customers/progress-overview`.
- [ ] Chạy test backend để xác nhận xanh.

### Task 2: Dashboard and modal components

**Files:** `frontend/src/types/progress.ts`, `frontend/src/components/progress/ProgressDashboard.tsx`, `frontend/src/components/progress/ProgressModal.tsx`, `frontend/src/components/progress/ProgressDetailModal.tsx`, `frontend/src/components/progress/WorkoutSessionModal.tsx`, `frontend/tests/components/progress/ProgressDashboard.test.tsx`

- [ ] Viết test dashboard, tìm kiếm và hai nút modal, chạy để xác nhận đỏ.
- [ ] Tạo component Tailwind, accessible dialog và type overview.
- [ ] Chạy test component để xác nhận xanh.

### Task 3: Page orchestration

**Files:** `frontend/src/pages/pt/ProgressPage.tsx`, `frontend/tests/pages/pt/ProgressPage.test.tsx`

- [ ] Viết test page gọi overview, mở đúng modal và refresh sau lưu; chạy đỏ.
- [ ] Thay luồng chọn một khách bằng dashboard và state hai modal.
- [ ] Chạy test liên quan, typecheck, lint và build.
