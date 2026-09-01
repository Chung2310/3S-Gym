# Workout Exercise Recommendations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tự động hiển thị tối đa năm bài tập phù hợp trong Studio từ dữ liệu Thư viện bài tập.

**Architecture:** Hàm xếp hạng thuần nằm trong service frontend và nhận bài tập cùng ngữ cảnh giáo án. Page tính danh sách bằng `useMemo`, còn `ExercisePalette` chỉ render và phát callback thêm bài.

**Tech Stack:** React, TypeScript, Tailwind CSS v4, Vitest, Testing Library.

## Global Constraints

- Không thêm API hoặc thay đổi backend.
- Kết quả cập nhật tự động và tối đa năm bài.
- Không commit nếu chưa được người dùng cho phép.

---

### Task 1: Recommendation ranking

**Files:**
- Create: `frontend/src/services/workoutExerciseRecommendations.ts`
- Create: `frontend/tests/services/workoutExerciseRecommendations.test.ts`

- [x] Viết test thất bại cho bỏ dấu, điểm mục tiêu, nhóm cơ, cấp độ, giới hạn và thứ tự.
- [x] Chạy test để xác nhận RED.
- [x] Viết hàm `recommendExercises` tối thiểu.
- [x] Chạy test để xác nhận GREEN.

### Task 2: Studio recommendation section

**Files:**
- Modify: `frontend/src/pages/pt/WorkoutStudioPage.tsx`
- Modify: `frontend/src/components/workout-studio/ExercisePalette.tsx`
- Modify: `frontend/tests/pages/WorkoutStudioPage.test.tsx`

- [x] Viết test thất bại cho nhóm đề xuất và thao tác thêm bài.
- [x] Truyền danh sách đề xuất từ page vào palette.
- [x] Render nhóm đề xuất bằng Tailwind, hỗ trợ click và drag.
- [x] Chạy test, lint và build frontend.
