# Vietnamese Validation Errors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Backend trả mọi lỗi Joi bằng tiếng Việt và frontend hiển thị được lỗi chi tiết/toàn bộ lỗi theo field.

**Architecture:** Tách việc dịch `Joi.ValidationErrorItem` vào helper backend dùng chung, để middleware không phát tán message mặc định của Joi. Frontend chuẩn hóa `ApiError.errors` qua các helper thuần, dùng chung cho toast và inline field errors.

**Tech Stack:** TypeScript, Express, Joi, React, Vitest, Supertest.

## Global Constraints

- Giữ nguyên status code, error `code`, `requestId` và success payload hiện tại.
- Backend là nơi duy nhất dịch lỗi Joi; frontend không tự dịch loại lỗi Joi.
- Dotted field path phải giữ index mảng.
- Schema-specific message tiếng Việt phải được ưu tiên.
- Không thêm dependency.

---

### Task 1: Chuẩn hóa message Joi tiếng Việt

**Files:**
- Create: `backend/validators/validationMessages.ts`
- Modify: `backend/middlewares/validate.ts`
- Test: `backend/tests/validateMiddleware.test.ts`

**Interfaces:**
- Produces: `validationIssue(detail: Joi.ValidationErrorItem, fallbackField: string): ValidationIssue`.

- [ ] **Step 1: Viết test fail** cho required, email, enum, number/date, unknown field, dotted path, schema-specific message và fallback; assert mọi `errors[].message` là tiếng Việt.
- [ ] **Step 2: Chạy** `npm exec vitest run -- --config vitest.config.ts backend/tests/validateMiddleware.test.ts`; mong đợi fail vì Joi còn trả message tiếng Anh.
- [ ] **Step 3: Cài helper dịch tập trung** theo `detail.type` và context (`label`, `limit`, `valids`), nhận diện custom message bằng việc không còn marker/phrase mặc định của Joi, sau đó dùng helper trong middleware.
- [ ] **Step 4: Chạy lại test**; mong đợi toàn bộ test middleware pass.

### Task 2: Frontend hiểu field errors

**Files:**
- Modify: `frontend/src/types.ts`
- Modify: `frontend/src/services/api.ts`
- Test: `frontend/tests/services/api.test.ts`

**Interfaces:**
- Produces: `errorMessage(error: unknown): string` ưu tiên field messages.
- Produces: `fieldErrors(error: unknown): Record<string, string>` giữ dotted paths.

- [ ] **Step 1: Viết test fail** cho nhiều field message, loại message trùng, dotted path và fallback lỗi thường.
- [ ] **Step 2: Chạy** `npm exec vitest run -- --config vitest.config.ts frontend/tests/services/api.test.ts`; mong đợi fail vì `errorMessage` chỉ đọc top-level message và chưa có `fieldErrors`.
- [ ] **Step 3: Cài helper tối thiểu** bằng type guard cho object có `errors`, lấy message hợp lệ, deduplicate theo thứ tự và tạo field map lấy lỗi đầu tiên của mỗi field.
- [ ] **Step 4: Chạy lại test**; mong đợi toàn bộ test API client pass.

### Task 3: Xác minh toàn hệ thống và phát hành nhánh

**Files:**
- Verify only.

- [ ] **Step 1: Chạy** `npm run verify:backend`; mong đợi tests, typecheck, lint, build và smoke pass.
- [ ] **Step 2: Chạy** `npm exec vitest run -- --config vitest.config.ts frontend/tests`, `npm run typecheck` và `npm run lint`; mong đợi pass.
- [ ] **Step 3: Chạy** `git diff --check` và xác nhận `.runlogs` không được track.
- [ ] **Step 4: Commit code** với message `fix: localize and surface validation errors`.
- [ ] **Step 5: Push** nhánh `feat/joi-api-validation` lên `origin`.
