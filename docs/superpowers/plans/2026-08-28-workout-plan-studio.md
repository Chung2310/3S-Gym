# Workout Plan Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng Studio giáo án theo ngày với timeline 24 giờ, bước 15 phút, thẻ tỷ lệ thời lượng và chống trùng lịch.

**Architecture:** Domain helper thuần dùng chung quy tắc snap/overlap/payload; backend lưu `durationDays` và `scheduledExercises` đồng thời dựng `sessions` tương thích; frontend dùng route new/edit và các component Studio tập trung theo ngày.

**Tech Stack:** TypeScript, React 19, React Router, Express, Mongoose, Joi, Vitest.

## Global Constraints

- 1–365 ngày; 00:00–24:00; bước 15 phút.
- Không cho bài tập trùng thời gian trong cùng ngày.
- Giữ `sessions` tương thích.
- Không commit/push khi chưa được yêu cầu.

---

### Task 1: Domain và backend

- [ ] Viết test RED cho overlap, bước 15 phút, giới hạn ngày và API payload.
- [ ] Bổ sung model, Joi custom validation và service dựng sessions.
- [ ] Chạy backend test GREEN.

### Task 2: Domain frontend và route

- [ ] Viết unit test RED cho snap, hình học thẻ, overlap và legacy tray.
- [ ] Tạo `workoutStudioModel.ts`, types và route new/edit.
- [ ] Chuyển nút tạo/sửa sang route Studio.
- [ ] Chạy route/model test GREEN.

### Task 3: Giao diện Studio

- [ ] Viết component test RED cho chọn ngày, thêm bài, đổi giờ/thời lượng và chặn overlap.
- [ ] Tạo header, day navigator, palette, timeline, card, inspector và tray.
- [ ] Tích hợp tải/lưu POST/PATCH và cảnh báo dirty.
- [ ] Chạy test liên quan, typecheck và production build.
