# Single Port Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox syntax.

**Goal:** Chạy frontend và backend qua duy nhất một Express port trong development và production.

### Task 1: Frontend adapter
- [ ] Viết test fail cho adapter development/production.
- [ ] Tách `registerDevelopmentFrontend` và `registerProductionFrontend`; chạy test pass.

### Task 2: Async app bootstrap
- [ ] Viết test fail chứng minh frontend được await trước khi app sẵn sàng.
- [ ] Export `createApp`, cập nhật server và test helpers; chạy backend tests.

### Task 3: Cấu hình frontend và scripts
- [ ] Viết test config relative API.
- [ ] Bỏ Vite proxy, xóa `VITE_API_URL` local/example, chuẩn hóa scripts một process.
- [ ] Chạy test, lint, build và diff-check.
