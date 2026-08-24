# Đợt 1 — Nền tảng, CRM và nội dung khách Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cung cấp tài khoản Admin/PT/Khách, CRM có chuyển PT hai bên xác nhận, và nội dung InBody/mục tiêu/giáo án/dinh dưỡng ở trạng thái nháp–công bố để khách xem.

**Architecture:** Express dùng bốn tầng Route → Controller → Service → Model; tất cả endpoint đi qua xác thực, phân quyền và validate. React chia layout theo role, tái sử dụng API client, bảng danh sách có filter/pagination, modal xác nhận và Toast toàn cục.

**Tech Stack:** React 19, React Router 7, Vite 8, Express 5, Mongoose 9, JWT, bcryptjs, MongoDB, Vitest, Supertest.

## Global Constraints

- Backend luôn dùng Route → Controller → Service → Model.
- Mọi route validate params, query, body và upload; message tiếng Việt.
- Endpoint danh sách nhận `page`, `limit`, `sort`, `order` và filter nghiệp vụ; trả `meta.page`, `meta.limit`, `meta.total`, `meta.totalPages`.
- Response thành công: `{ success: true, message, data, meta? }`; lỗi: `{ success: false, message, errors? }`.
- PT chỉ quản lý khách hiện tại; khách chỉ xem nội dung đã công bố của chính mình; Admin toàn quyền.
- UI giữ màu hiện tại, tối giản, responsive điện thoại, dùng component tái sử dụng; xác nhận dùng modal, trạng thái dùng Toast.

---

## Cấu trúc file mục tiêu

- `backend/models/`: User, CustomerProfile, PtPackage, TransferRequest, InBodyRecord, Goal, WorkoutPlan, NutritionPlan, Publication.
- `backend/services/`: nghiệp vụ phân quyền, CRUD, công bố và chuyển khách.
- `backend/controllers/`: HTTP adapter mỏng, chỉ gọi service.
- `backend/routes/`: endpoint + validate + auth middleware.
- `backend/middlewares/`: authenticate, authorize, validate, errorHandler, response helpers.
- `backend/tests/`: test API bằng Supertest và MongoDB Memory Server.
- `frontend/src/components/`: AppShell, DataList, Pagination, FilterBar, ConfirmModal, ToastProvider, StatusBadge, FormField.
- `frontend/src/pages/`: Admin, PT, Customer portal; các trang danh sách/chỉnh sửa theo module.
- `frontend/src/services/api.js`: API client duy nhất, giải mã response chuẩn và lỗi tiếng Việt.

## Task 1: Thiết lập test và chuẩn response backend

**Files:**
- Modify: `package.json`, `backend/server.js`
- Create: `backend/app.js`, `backend/middlewares/response.js`, `backend/middlewares/errorHandler.js`, `backend/tests/response.test.js`

**Interfaces:**
- Produces: `success(res, { message, data, meta, status })`; `fail(res, { message, errors, status })`; Express app export để Supertest sử dụng.

- [ ] **Step 1: Viết test fail cho response chuẩn**

```js
it('trả response danh sách theo mẫu thống nhất', async () => {
  const response = await request(app).get('/api/health');
  expect(response.status).toBe(200);
  expect(response.body).toEqual({ success: true, message: 'Hệ thống hoạt động bình thường.', data: { status: 'ok' } });
});
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `npm test -- backend/tests/response.test.js`

Expected: FAIL vì chưa có script test hoặc chưa export Express app.

- [ ] **Step 3: Cài test runner và viết `app.js`/response helpers tối thiểu**

```js
function success(res, { message, data = null, meta, status = 200 }) {
  return res.status(status).json({ success: true, message, data, ...(meta ? { meta } : {}) });
}
```

- [ ] **Step 4: Chạy lại test**

Run: `npm test -- backend/tests/response.test.js`

Expected: PASS.

## Task 2: User, xác thực và phân quyền ba vai trò

**Files:**
- Modify: `backend/models/User.js`, `backend/routes/auth.js`, `backend/server.js`
- Create: `backend/services/authService.js`, `backend/controllers/authController.js`, `backend/middlewares/auth.js`, `backend/routes/users.js`, `backend/controllers/userController.js`, `backend/services/userService.js`, `backend/tests/auth.test.js`

**Interfaces:**
- Consumes: `authenticate`, `authorize(...roles)`.
- Produces: `POST /api/auth/login`, `POST /api/auth/activate`, `GET /api/users`, `POST /api/users`.

- [ ] **Step 1: Viết các test fail**

```js
it('chỉ Admin tạo được tài khoản PT', async () => {
  const response = await request(app).post('/api/users').set('Authorization', ptToken)
    .send({ fullName: 'PT Mới', email: 'pt.moi@3s.vn', role: 'pt' });
  expect(response.status).toBe(403);
  expect(response.body.message).toBe('Bạn không có quyền thực hiện thao tác này.');
});
```

- [ ] **Step 2: Chạy test fail**

Run: `npm test -- backend/tests/auth.test.js`

Expected: FAIL vì route/middleware chưa tồn tại.

- [ ] **Step 3: Cài bcrypt, JWT, User schema role/status/password hash và middleware phân quyền**

```js
const authorize = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : fail(res, { status: 403, message: 'Bạn không có quyền thực hiện thao tác này.' });
```

- [ ] **Step 4: Chạy test pass và toàn bộ test backend**

Run: `npm test -- backend/tests/auth.test.js`

Expected: PASS.

## Task 3: CRM khách hàng, gói PT và pagination/filter

**Files:**
- Create: `backend/models/CustomerProfile.js`, `backend/models/PtPackage.js`, `backend/services/customerService.js`, `backend/controllers/customerController.js`, `backend/routes/customers.js`, `backend/tests/customers.test.js`

**Interfaces:**
- Produces: `GET/POST /api/customers`, `GET/PATCH /api/customers/:id`, `GET/POST /api/customers/:id/packages`.

- [ ] **Step 1: Viết test fail cho quyền PT và pagination**

```js
it('PT chỉ nhận khách của mình cùng meta phân trang', async () => {
  const response = await request(app).get('/api/customers?page=1&limit=20&keyword=Lan').set('Authorization', ptToken);
  expect(response.body.meta).toMatchObject({ page: 1, limit: 20 });
  expect(response.body.data.every((customer) => customer.assignedPtId === ptId)).toBe(true);
});
```

- [ ] **Step 2: Chạy test fail, rồi implement Model/Service/Controller/Route**

Run: `npm test -- backend/tests/customers.test.js`

Expected trước code: FAIL vì endpoint chưa tồn tại; sau code: PASS.

- [ ] **Step 3: Xác minh filter và validation**

Run: `npm test -- backend/tests/customers.test.js`

Expected: keyword/status/ptId (Admin) hợp lệ; `page=0` trả 400 tiếng Việt.

## Task 4: Chuyển khách giữa PT

**Files:**
- Create: `backend/models/TransferRequest.js`, `backend/services/transferService.js`, `backend/controllers/transferController.js`, `backend/routes/transfers.js`, `backend/tests/transfers.test.js`

**Interfaces:**
- Produces: `POST /api/transfers`, `PATCH /api/transfers/:id/accept`, `PATCH /api/transfers/:id/reject`, `PATCH /api/transfers/:id/admin-force`.

- [ ] **Step 1: Viết test fail cho yêu cầu hai PT xác nhận**

```js
it('chỉ đổi PT phụ trách sau khi PT đích xác nhận', async () => {
  const requestItem = await createTransfer(ptAToken, customerId, ptBId);
  expect(await assignedPt(customerId)).toBe(ptAId);
  await acceptTransfer(ptBToken, requestItem.id);
  expect(await assignedPt(customerId)).toBe(ptBId);
});
```

- [ ] **Step 2: Chạy test fail, implement bốn tầng, rồi chạy pass**

Run: `npm test -- backend/tests/transfers.test.js`

Expected: FAIL trước code; PASS sau code, bao gồm Admin ép chuyển có `reason` bắt buộc.

## Task 5: InBody, mục tiêu, giáo án và dinh dưỡng có nháp/công bố

**Files:**
- Create: `backend/models/InBodyRecord.js`, `backend/models/Goal.js`, `backend/models/WorkoutPlan.js`, `backend/models/NutritionPlan.js`, `backend/services/publicationService.js`, controllers/routes tương ứng, `backend/tests/publication.test.js`

**Interfaces:**
- Produces: CRUD có filter/pagination; `PATCH /api/:resource/:id/publish`, `PATCH /api/:resource/:id/unpublish`; `GET /api/me/content` cho khách.

- [ ] **Step 1: Viết test fail cho khách chỉ xem bản đã công bố**

```js
it('khách không xem được InBody nháp và xem được bản PT công bố', async () => {
  await createInBody(ptToken, customerId, { status: 'draft' });
  expect((await request(app).get('/api/me/content').set('Authorization', customerToken)).body.data.inbody).toHaveLength(0);
  await publishInBody(ptToken, inbodyId);
  expect((await request(app).get('/api/me/content').set('Authorization', customerToken)).body.data.inbody).toHaveLength(1);
});
```

- [ ] **Step 2: Chạy red, implement, chạy green**

Run: `npm test -- backend/tests/publication.test.js`

Expected: FAIL trước code; PASS sau code.

## Task 6: Hệ thống component và UI Đợt 1

**Files:**
- Create: `frontend/src/components/{AppShell,DataList,Pagination,FilterBar,ConfirmModal,ToastProvider,StatusBadge,FormField}.jsx`, `frontend/src/services/api.js`, các page Admin/PT/Customer.
- Modify: `frontend/src/App.jsx`, `frontend/src/index.css`, `frontend/src/App.css`.
- Test: `frontend/src/**/*.test.jsx`.

- [ ] **Step 1: Viết test fail cho popup xác nhận và Toast**

```jsx
it('chỉ gọi onConfirm sau khi người dùng xác nhận trong popup', async () => {
  const onConfirm = vi.fn();
  render(<ConfirmModal open onConfirm={onConfirm} />);
  await userEvent.click(screen.getByRole('button', { name: 'Xác nhận' }));
  expect(onConfirm).toHaveBeenCalledOnce();
});
```

- [ ] **Step 2: Chạy test fail, tạo component tối thiểu, chạy pass**

Run: `npm test -- frontend/src/components/ConfirmModal.test.jsx`

Expected: FAIL trước code; PASS sau code.

- [ ] **Step 3: Xây trang theo thứ tự**

1. Đăng nhập và shell theo role.
2. Admin quản lý PT.
3. PT danh sách/tạo/sửa khách, gói và chuyển giao.
4. PT InBody/mục tiêu/giáo án/dinh dưỡng và công bố.
5. Portal khách xem nội dung đã công bố.

- [ ] **Step 4: Kiểm thử responsive**

Run: `npm run build`

Expected: build thành công; UI ở 320px không cuộn ngang và bảng danh sách chuyển sang thẻ.

## Task 7: Kiểm thử tích hợp và hoàn tất Đợt 1

**Files:**
- Create: `backend/tests/dot1.e2e.test.js`, `docs/01-dot-1-nen-tang-crm-noi-dung-khach.md` (cập nhật trạng thái nếu cần).

- [ ] **Step 1: Viết test e2e fail cho luồng đầy đủ**

```js
it('Admin tạo PT, PT tạo khách, công bố InBody và khách xem được', async () => {
  // Tạo dữ liệu qua API, đăng nhập từng role, assert response chuẩn và quyền truy cập.
});
```

- [ ] **Step 2: Chạy toàn bộ kiểm thử**

Run: `npm test && npm run build && npm run lint`

Expected: tất cả test pass, build và lint thành công.

- [ ] **Step 3: Xác minh thủ công**

Đăng nhập Admin/PT/Khách; kiểm tra các danh sách có filter/pagination, toàn bộ confirmation dùng modal, Toast hiển thị tiếng Việt, và chuyển khách giữ lại lịch sử.
