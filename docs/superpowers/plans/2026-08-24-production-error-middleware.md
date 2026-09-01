# Production Error Middleware Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tập trung toàn bộ lỗi backend vào một pipeline production có error code, request ID, structured logging, Sentry tùy chọn và graceful shutdown.

**Architecture:** Route/controller chuyển lỗi bằng `next` qua `asyncHandler`; service ném `AppError`; normalizer ánh xạ lỗi thư viện; handler duy nhất log và trả contract tiếng Việt. Request context tạo request ID và Pino child logger cho từng request.

**Tech Stack:** Express 5, Mongoose 9, JWT, Pino, pino-http, Sentry Node, Vitest, Supertest.

## Global Constraints

- Không thay đổi business rule hoặc response thành công.
- Response lỗi luôn có `success`, `message`, `code`, `requestId`; production không lộ lỗi kỹ thuật.
- Log phải redact authorization, cookie, password, token, secret và dữ liệu file/base64.
- Thực hiện theo TDD; không commit nếu người dùng chưa yêu cầu.

### Task 1: Error primitives và contract

**Files:** Create `backend/errors/AppError.js`, `backend/errors/errorCodes.js`, `backend/middlewares/asyncHandler.js`, `backend/errors/normalizeError.js`; modify `backend/middlewares/errorHandler.js`; test `backend/tests/errorInfrastructure.test.js`.

- [ ] Viết test fail cho AppError, asyncHandler, Mongo duplicate, Mongoose/JWT/JSON/payload và lỗi 500.
- [ ] Chạy test, xác nhận fail vì module chưa tồn tại.
- [ ] Implement primitives/normalizer/handler tối thiểu; chạy test pass.

### Task 2: Request ID, Pino và Sentry adapter

**Files:** Create `backend/config/logger.js`, `backend/middlewares/requestContext.js`, `backend/services/telemetryService.js`; modify `backend/app.js`, `.env.example`, `package.json`; test `backend/tests/requestContext.test.js`, `backend/tests/telemetry.test.js`.

- [ ] Viết test fail cho request ID/header/redaction và Sentry no-op.
- [ ] Cài `pino`, `pino-http`, `@sentry/node`; implement middleware/adapters; chạy test pass.

### Task 3: Auth, validation và API 404

**Files:** Modify `backend/middlewares/auth.js`, `backend/middlewares/validate.js`, `backend/app.js`; test `backend/tests/errorContract.test.js`.

- [ ] Viết contract test fail cho validation/auth/404/invalid JSON có code và requestId.
- [ ] Chuyển middleware sang `next(AppError)` và thêm `notFoundHandler`; chạy test pass.

### Task 4: Migration controller/service

**Files:** Modify toàn bộ `backend/controllers/*.js`, `backend/services/{auth,user,customer,transfer,publication}Service.js`, các route tương ứng; test suite backend hiện có.

- [ ] Viết test fail chứng minh rejected promise từ service đi qua handler chung.
- [ ] Bỏ catch/fail trong controller, dùng asyncHandler tại route; đổi lỗi nghiệp vụ sang AppError.
- [ ] Chạy từng test module sau mỗi nhóm và sửa contract cũ sang contract mới.

### Task 5: Upload, legacy nutrition và external errors

**Files:** Modify `backend/routes/upload.js`, `backend/services/cloudinaryService.js`, `backend/routes/nutrition.js`; test `backend/tests/externalError.test.js`.

- [ ] Viết test fail cho upload thiếu/quá lớn và external service error an toàn.
- [ ] Chuyển lỗi route/service ngoài sang AppError/next; giữ message tiếng Việt; chạy test pass.

### Task 6: Health và lifecycle

**Files:** Create `backend/services/lifecycleService.js`; modify `backend/app.js`, `backend/server.js`, `backend/services/databaseService.js`; test `backend/tests/health.test.js`, `backend/tests/lifecycle.test.js`.

- [ ] Viết test fail cho live/ready và shutdown idempotent.
- [ ] Implement readiness theo Mongoose state và lifecycle có dependency injection; chạy test pass.

### Task 7: Xác minh toàn hệ thống

- [ ] Chạy `npm test`, xác nhận toàn bộ test pass.
- [ ] Chạy `npm run lint`, xác nhận exit 0 và không có warning mới.
- [ ] Chạy `npm run build`, xác nhận production build thành công.
- [ ] Chạy `git diff --check`, xác nhận không có lỗi whitespace.
