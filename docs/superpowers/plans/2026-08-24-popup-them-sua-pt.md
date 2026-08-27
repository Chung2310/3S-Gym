# Popup thêm và sửa PT Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cho phép Admin thêm và sửa đầy đủ hồ sơ PT bằng một popup responsive dùng chung.

**Architecture:** Mở rộng `User` và API users theo bốn tầng Route → Controller → Service → Model. Frontend tách `PtFormModal` khỏi trang Portal, dùng API client, ConfirmModal và Toast hiện có.

**Tech Stack:** Express 5, Mongoose 9, React 19, Vitest, Supertest, Testing Library.

## Global Constraints

- Backend giữ cấu trúc Route → Controller → Service → Model.
- Mọi route mới hoặc thay đổi phải validate; response và message theo mẫu tiếng Việt hiện có.
- Popup thêm/sửa dùng chung, responsive một cột trên điện thoại và hai cột trên desktop.
- Mật khẩu không xuất hiện trong response; username và role không được đổi khi sửa.
- Triển khai theo Red → Green → Refactor; không tạo commit nếu người dùng chưa yêu cầu.

---

### Task 1: Mở rộng hồ sơ PT và API cập nhật

**Files:**
- Modify: `backend/models/User.js`
- Modify: `backend/routes/users.js`
- Modify: `backend/controllers/userController.js`
- Modify: `backend/services/userService.js`
- Test: `backend/tests/auth.test.js`

**Interfaces:**
- Consumes: `authenticate`, `authorize('ADMIN')`, `validate()` và response helpers hiện có.
- Produces: `updatePt(id, payload)` và `PATCH /api/users/:id`.

- [ ] Viết test fail: Admin tạo PT với toàn bộ trường hồ sơ và response không có password.
- [ ] Chạy `npm test -- --run backend/tests/auth.test.js`, xác nhận fail vì trường chưa được lưu.
- [ ] Mở rộng schema và hàm tạo với `avatarUrl`, `dateOfBirth`, `gender`, `phone`, `address`, `specialization`, `yearsOfExperience`, `certificates`, `bio`, `status`.
- [ ] Chạy lại test và xác nhận pass.
- [ ] Viết test fail cho `PATCH /api/users/:id`: cập nhật hồ sơ PT, không đổi username/role và mật khẩu là tùy chọn.
- [ ] Chạy test, xác nhận 404 vì route chưa tồn tại.
- [ ] Thêm validator ObjectId/body, controller `update`, service `updatePt`; chỉ Admin được gọi và chỉ sửa tài khoản PT.
- [ ] Chạy test auth và toàn bộ backend, xác nhận pass.

### Task 2: Popup dùng chung thêm/sửa PT

**Files:**
- Create: `frontend/src/components/PtFormModal.jsx`
- Create: `frontend/src/components/PtFormModal.test.jsx`
- Modify: `frontend/src/pages/PortalPage.jsx`
- Modify: `frontend/src/pages/PortalPage.test.jsx`

**Interfaces:**
- Consumes: `FormField`, `ConfirmModal`, `api.post`, `api.patch`, `useToast`.
- Produces: `<PtFormModal open pt onClose onSaved />`; `pt=null` là chế độ thêm.

- [ ] Viết test fail: nhấn “Thêm PT” mở dialog có đủ nhóm trường và mật khẩu bắt buộc.
- [ ] Chạy test Portal, xác nhận fail vì form đang hiển thị nội tuyến.
- [ ] Tạo `PtFormModal` tối thiểu và thay form nội tuyến trong `AdminView`.
- [ ] Chạy test, xác nhận pass.
- [ ] Viết test fail: nút “Sửa” mở popup điền sẵn dữ liệu, username readonly, mật khẩu mới không bắt buộc.
- [ ] Chạy test, xác nhận fail vì chưa có thao tác sửa.
- [ ] Nối nút sửa, chuẩn hóa payload chứng chỉ và gọi `POST /api/users` hoặc `PATCH /api/users/:id` theo chế độ.
- [ ] Viết và chạy test xác nhận popup bỏ thay đổi khi form dirty; Toast hiển thị theo response API.

### Task 3: Responsive và xác minh hồi quy

**Files:**
- Modify: `frontend/src/index.css`
- Test: toàn bộ test suite.

**Interfaces:**
- Produces: `.pt-form-modal`, `.pt-form-section`, `.pt-form-grid` responsive.

- [ ] Bổ sung CSS modal có chiều cao giới hạn, cuộn phần nội dung, hai cột desktop và một cột ở breakpoint điện thoại.
- [ ] Chạy `npm test`, kỳ vọng toàn bộ test pass.
- [ ] Chạy `npm run lint`, kỳ vọng exit code 0 và không có cảnh báo mới từ phần thay đổi.
- [ ] Chạy `npm run build`, kỳ vọng Vite production build thành công.
