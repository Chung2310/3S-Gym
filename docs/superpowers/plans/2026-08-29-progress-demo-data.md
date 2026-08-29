# Progress Demo Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Seed một bộ dữ liệu tiến độ local 12 tuần, có thể chạy lại an toàn.

**Architecture:** Hàm service tạo/upsert danh tính demo và thay thế dữ liệu hành trình chỉ trong phạm vi customer demo. Script CLI kết nối Mongo local, gọi service, in tài khoản và thống kê.

**Tech Stack:** TypeScript, Mongoose, bcryptjs, tsx, Vitest, mongodb-memory-server.

## Global Constraints

- Không xóa hoặc sửa dữ liệu ngoài hồ sơ có số điện thoại `0900000991`.
- Seeder phải idempotent.
- Không commit hoặc push.

---

### Task 1: Demo progress seeder

**Files:**
- Create: `backend/services/progressDemoSeedService.ts`
- Create: `backend/scripts/seedProgressDemo.ts`
- Create: `backend/tests/progressDemoSeed.test.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `seedProgressDemo(): Promise<{ ptUsername: string; customerUsername: string; password: string; customerId: string; counts: Record<string, number> }>`.

- [ ] Viết integration test gọi seeder hai lần và kiểm tra số lượng không tăng.
- [ ] Chạy test, xác nhận thất bại do service chưa tồn tại.
- [ ] Tạo service với tài khoản, giáo án, 36 session, 13 số đo, lịch, ảnh và báo cáo.
- [ ] Tạo CLI và script npm `db:seed:progress-demo`.
- [ ] Chạy test, typecheck và xác nhận đạt.
- [ ] Chạy seeder trên MongoDB local và kiểm tra thống kê bản ghi.
