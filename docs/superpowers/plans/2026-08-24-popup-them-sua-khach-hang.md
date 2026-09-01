# Popup thêm và sửa khách hàng Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thay form khách hàng nội tuyến bằng popup tạo/sửa đầy đủ, tái sử dụng khung popup hồ sơ với PT và giữ cấp tài khoản khách thành luồng riêng.

**Architecture:** Tách lifecycle và layout của popup PT thành `ProfileFormModal`; `PtFormModal` và `CustomerFormModal` chỉ quản lý dữ liệu, trường và API theo từng nghiệp vụ. Backend bổ sung validator riêng cho create/update customer tại tầng route, còn service tiếp tục kiểm soát whitelist và phạm vi khách thuộc PT.

**Tech Stack:** React 19, React Testing Library, Vitest, Express 5, Mongoose, Supertest, MongoDB Memory Server, CSS responsive hiện có.

## Global Constraints

- Backend giữ cấu trúc Route → Controller → Service → Model.
- Mọi route thay đổi phải có validation; mọi message response và Toast dùng tiếng Việt.
- Response tiếp tục theo mẫu chung hiện có; không thay đổi contract phân trang hoặc bộ lọc danh sách.
- Frontend dùng màu hiện tại, giao diện tối giản, responsive cho điện thoại và tái sử dụng component.
- Xác nhận bỏ dữ liệu chưa lưu dùng `ConfirmModal`; thông báo thành công/thất bại dùng Toast.
- Cấp tài khoản khách là luồng riêng; popup hồ sơ không chứa username/password.
- Không cho sửa `assignedPtId` hoặc `userId`; chuyển PT phải qua quy trình xác nhận hiện có.
- Làm trực tiếp trong workspace hiện tại; không tạo worktree và không commit nếu người dùng chưa yêu cầu.

---

## File map

- Create `frontend/src/components/ProfileFormModal.jsx`: khung dialog hồ sơ dùng chung, xử lý layout, đóng, loading và xác nhận bỏ thay đổi.
- Create `frontend/src/components/ProfileFormModal.test.jsx`: kiểm thử contract của khung popup.
- Modify `frontend/src/components/PtFormModal.jsx`: dùng `ProfileFormModal`, giữ nguyên upload Cloudinary và nghiệp vụ PT.
- Create `frontend/src/components/CustomerFormModal.jsx`: form tạo/sửa hồ sơ khách và chuyển đổi payload.
- Create `frontend/src/components/CustomerFormModal.test.jsx`: kiểm thử trường, mode tạo/sửa, API, Toast và xác nhận đóng.
- Modify `frontend/src/pages/PortalPage.jsx`: bỏ `CustomerForm` nội tuyến, tích hợp popup và nút Sửa.
- Modify `frontend/src/pages/PortalPage.test.jsx`: kiểm thử tích hợp danh sách, tạo, sửa và cấp tài khoản riêng.
- Modify `frontend/src/index.css`: đổi selector PT-specific thành selector khung hồ sơ dùng chung và giữ responsive.
- Modify `backend/routes/customers.js`: bổ sung validator create/update đầy đủ và gắn validator body vào PATCH.
- Modify `backend/services/customerService.js`: dùng whitelist dùng chung, chuẩn hóa payload trước khi ghi.
- Modify `backend/tests/customers.test.js`: kiểm thử create/update hợp lệ, dữ liệu sai và trường bị bảo vệ.
- Modify `docs/01-dot-1-nen-tang-crm-noi-dung-khach.md`: ghi nhận popup tạo/sửa khách và luồng tài khoản riêng.

---

### Task 1: Hoàn thiện validation và bảo vệ cập nhật khách hàng

**Files:**
- Modify: `backend/routes/customers.js`
- Modify: `backend/services/customerService.js`
- Test: `backend/tests/customers.test.js`

**Interfaces:**
- Produces: `createCustomerValidator(req): ValidationError[]`, `updateCustomerValidator(req): ValidationError[]`.
- Produces: `CUSTOMER_MUTABLE_FIELDS`, danh sách duy nhất các trường hồ sơ được phép ghi.
- Preserves: `POST /api/customers` trả 201 và `PATCH /api/customers/:id` trả 200 theo response chuẩn.

- [ ] **Step 1: Viết test API thất bại cho validation tạo/sửa và trường bảo vệ**

Thêm các case vào `backend/tests/customers.test.js`:

```js
it('từ chối dữ liệu hồ sơ khách không hợp lệ bằng message tiếng Việt', async () => {
  const response = await request(app)
    .post('/api/customers')
    .set('Authorization', `Bearer ${ptAToken}`)
    .send({ fullName: 'A', phone: 'abc', email: 'sai-email', height: -1 });

  expect(response.status).toBe(400);
  expect(response.body).toMatchObject({
    success: false,
    message: 'Dữ liệu gửi lên không hợp lệ.',
  });
  expect(response.body.errors.map((error) => error.field)).toEqual(
    expect.arrayContaining(['fullName', 'phone', 'email', 'height']),
  );
});

it('PT sửa đầy đủ hồ sơ khách mình phụ trách', async () => {
  const customer = await CustomerProfile.findOne({ assignedPtId: ptA.id });
  const response = await request(app)
    .patch(`/api/customers/${customer.id}`)
    .set('Authorization', `Bearer ${ptAToken}`)
    .send({
      fullName: 'Nguyễn Thị Lan mới', phone: '0901000099', email: 'lan.moi@example.com',
      dateOfBirth: '1995-04-20', gender: 'FEMALE', height: 162,
      initialWeight: 58.5, medicalNotes: 'Đau đầu gối nhẹ',
      initialGoal: 'Giảm 4 kg', internalNotes: 'Theo dõi mỗi tuần', status: 'ACTIVE',
    });

  expect(response.status).toBe(200);
  expect(response.body.data).toMatchObject({
    fullName: 'Nguyễn Thị Lan mới', height: 162, initialWeight: 58.5,
    initialGoal: 'Giảm 4 kg', status: 'ACTIVE',
  });
});

it('không cho sửa PT phụ trách hoặc user liên kết qua API hồ sơ', async () => {
  const customer = await CustomerProfile.findOne({ assignedPtId: ptA.id });
  const response = await request(app)
    .patch(`/api/customers/${customer.id}`)
    .set('Authorization', `Bearer ${ptAToken}`)
    .send({ assignedPtId: ptB.id, userId: ptB.id });

  expect(response.status).toBe(400);
  expect(response.body.message).toBe('Dữ liệu gửi lên không hợp lệ.');
  expect(response.body.errors.map((error) => error.field)).toEqual(
    expect.arrayContaining(['assignedPtId', 'userId']),
  );
});
```

- [ ] **Step 2: Chạy test và xác nhận test mới thất bại**

Run: `npm test -- backend/tests/customers.test.js`

Expected: FAIL vì PATCH chưa validate body và create validator chưa kiểm tra đủ email/height.

- [ ] **Step 3: Cài đặt validator create/update tại route**

Trong `backend/routes/customers.js`, định nghĩa whitelist và helper kiểm tra từng trường:

```js
const CUSTOMER_MUTABLE_FIELDS = [
  'fullName', 'phone', 'email', 'dateOfBirth', 'gender', 'height',
  'initialWeight', 'medicalNotes', 'initialGoal', 'internalNotes', 'status',
];

function validateCustomerFields(body, { partial = false } = {}) {
  const errors = [];
  const has = (field) => Object.prototype.hasOwnProperty.call(body, field);
  const required = (field) => !partial || has(field);

  if (required('fullName') && (typeof body.fullName !== 'string' || body.fullName.trim().length < 2))
    errors.push({ field: 'fullName', message: 'Họ tên phải có ít nhất 2 ký tự.' });
  if (required('phone') && (typeof body.phone !== 'string' || !/^[0-9+]{9,15}$/.test(body.phone.trim())))
    errors.push({ field: 'phone', message: 'Số điện thoại không hợp lệ.' });
  if (has('email') && body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email))
    errors.push({ field: 'email', message: 'Email không đúng định dạng.' });
  if (has('dateOfBirth') && body.dateOfBirth && (Number.isNaN(Date.parse(body.dateOfBirth)) || new Date(body.dateOfBirth) > new Date()))
    errors.push({ field: 'dateOfBirth', message: 'Ngày sinh không hợp lệ hoặc ở tương lai.' });
  if (has('gender') && !['MALE', 'FEMALE', 'OTHER'].includes(body.gender))
    errors.push({ field: 'gender', message: 'Giới tính không hợp lệ.' });
  for (const field of ['height', 'initialWeight']) {
    if (has(field) && body[field] !== null && (!Number.isFinite(Number(body[field])) || Number(body[field]) < 0))
      errors.push({ field, message: field === 'height' ? 'Chiều cao phải là số không âm.' : 'Cân nặng ban đầu phải là số không âm.' });
  }
  if (has('status') && !['ACTIVE', 'INACTIVE', 'LEAD'].includes(body.status))
    errors.push({ field: 'status', message: 'Trạng thái khách hàng không hợp lệ.' });
  for (const [field, max] of [['medicalNotes', 2000], ['initialGoal', 1000], ['internalNotes', 2000]]) {
    if (has(field) && (typeof body[field] !== 'string' || body[field].length > max))
      errors.push({ field, message: `Nội dung ${field} không hợp lệ hoặc vượt quá ${max} ký tự.` });
  }
  for (const field of Object.keys(body)) {
    if (!CUSTOMER_MUTABLE_FIELDS.includes(field))
      errors.push({ field, message: `Trường ${field} không được phép cập nhật.` });
  }
  if (partial && Object.keys(body).length === 0)
    errors.push({ field: 'body', message: 'Vui lòng cung cấp thông tin cần cập nhật.' });
  return errors;
}

const createCustomerValidator = (req) => validateCustomerFields(req.body);
const updateCustomerValidator = (req) => [...idValidator(req), ...validateCustomerFields(req.body, { partial: true })];
```

Gắn route:

```js
router.post('/', ...allowStaff, validate(createCustomerValidator), controller.create);
router.patch('/:id', ...allowStaff, validate(updateCustomerValidator), controller.update);
```

- [ ] **Step 4: Đồng bộ whitelist và chuẩn hóa payload trong service**

Trong `backend/services/customerService.js`, dùng cùng danh sách trường cho create/update; trim chuỗi và chuyển chuỗi rỗng của email/ngày/số tùy chọn thành `null`. Tuyệt đối không đưa `assignedPtId` hoặc `userId` vào whitelist:

```js
const CUSTOMER_MUTABLE_FIELDS = [
  'fullName', 'phone', 'email', 'dateOfBirth', 'gender', 'height',
  'initialWeight', 'medicalNotes', 'initialGoal', 'internalNotes', 'status',
];

function customerChanges(payload) {
  return Object.fromEntries(CUSTOMER_MUTABLE_FIELDS
    .filter((key) => Object.prototype.hasOwnProperty.call(payload, key))
    .map((key) => {
      const value = payload[key];
      if (['email', 'dateOfBirth', 'height', 'initialWeight'].includes(key) && value === '') return [key, null];
      return [key, typeof value === 'string' ? value.trim() : value];
    }));
}
```

`createCustomer` ghi `customerChanges(payload)` rồi gán PT theo user đăng nhập; `updateCustomer` chỉ ghi kết quả helper này.

- [ ] **Step 5: Chạy test backend mục tiêu**

Run: `npm test -- backend/tests/customers.test.js`

Expected: toàn bộ test trong `customers.test.js` PASS, bao gồm response lỗi tiếng Việt và bảo vệ hai trường liên kết.

---

### Task 2: Trích xuất khung popup hồ sơ dùng chung

**Files:**
- Create: `frontend/src/components/ProfileFormModal.jsx`
- Create: `frontend/src/components/ProfileFormModal.test.jsx`
- Modify: `frontend/src/components/PtFormModal.jsx`
- Modify: `frontend/src/index.css`

**Interfaces:**
- Produces: `ProfileFormModal({ open, title, description, dirty, loading, submitLabel, onClose, onSubmit, children })`.
- Consumes: `ConfirmModal` và class CSS `profile-modal-*`.
- Preserves: public props hiện tại của `PtFormModal({ open, pt, onClose, onSaved })` và hành vi upload Cloudinary.

- [ ] **Step 1: Viết test thất bại cho khung popup**

Tạo `frontend/src/components/ProfileFormModal.test.jsx` với các case: không render khi `open=false`; render dialog có accessible name; submit gọi `onSubmit`; form sạch đóng ngay; form bẩn mở xác nhận và chỉ đóng sau khi xác nhận; loading vô hiệu hóa nút.

```jsx
render(<ProfileFormModal open title="Thêm hồ sơ" dirty onClose={onClose} onSubmit={onSubmit}><input aria-label="Họ tên" /></ProfileFormModal>);
await user.click(screen.getByRole('button', { name: 'Hủy' }));
expect(screen.getByRole('dialog', { name: 'Bỏ thay đổi?' })).toBeInTheDocument();
expect(onClose).not.toHaveBeenCalled();
await user.click(screen.getByRole('button', { name: 'Bỏ thay đổi' }));
expect(onClose).toHaveBeenCalledOnce();
```

- [ ] **Step 2: Chạy test và xác nhận thất bại vì component chưa tồn tại**

Run: `npm test -- frontend/src/components/ProfileFormModal.test.jsx`

Expected: FAIL với lỗi không tìm thấy module `ProfileFormModal.jsx`.

- [ ] **Step 3: Cài đặt `ProfileFormModal` tối thiểu**

Component phải dùng ID ổn định cho `aria-labelledby`, gọi `onSubmit` qua `<form>`, chặn đóng trực tiếp khi `dirty`, và dùng `ConfirmModal` với nội dung tiếng Việt:

```jsx
export default function ProfileFormModal({
  open, title, description, dirty = false, loading = false,
  submitLabel = 'Lưu', onClose, onSubmit, children,
}) {
  const [confirmClose, setConfirmClose] = useState(false);
  const requestClose = () => dirty ? setConfirmClose(true) : onClose();
  if (!open) return null;
  return <>
    <div className="modal-backdrop profile-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && requestClose()}>
      <section className="profile-form-modal" role="dialog" aria-modal="true" aria-labelledby="profile-form-title">
        <header className="profile-form-header">
          <div><h2 id="profile-form-title">{title}</h2>{description && <p>{description}</p>}</div>
          <button type="button" className="icon-button" aria-label="Đóng" onClick={requestClose}><X size={20} /></button>
        </header>
        <form onSubmit={onSubmit}>
          <div className="profile-form-body">{children}</div>
          <footer className="profile-form-footer">
            <button type="button" className="button button-secondary" onClick={requestClose} disabled={loading}>Hủy</button>
            <button className="button button-primary" disabled={loading}>{loading ? 'Đang lưu...' : submitLabel}</button>
          </footer>
        </form>
      </section>
    </div>
    <ConfirmModal open={confirmClose} title="Bỏ thay đổi?" description="Các thông tin chưa lưu sẽ bị mất." confirmLabel="Bỏ thay đổi" danger onClose={() => setConfirmClose(false)} onConfirm={onClose} />
  </>;
}
```

Thêm `useState`, `X` và `ConfirmModal` imports đầy đủ.

- [ ] **Step 4: Refactor `PtFormModal` dùng khung mới**

Giữ nguyên state, upload avatar, `formFromPt`, payload và API. Thay markup backdrop/header/form/footer bằng:

```jsx
<ProfileFormModal
  open={open}
  title={editing ? 'Sửa PT' : 'Thêm PT'}
  description="Nhập thông tin hồ sơ và tài khoản huấn luyện viên."
  dirty={dirty}
  loading={loading}
  submitLabel={editing ? 'Lưu thay đổi' : 'Tạo PT'}
  onClose={onClose}
  onSubmit={submit}
>
  {/* giữ nguyên bốn section và upload Cloudinary hiện tại */}
</ProfileFormModal>
```

Xóa state/xử lý `confirmClose`, `requestClose`, icon đóng và `ConfirmModal` khỏi `PtFormModal`; không thay đổi field hoặc request PT.

- [ ] **Step 5: Đổi CSS sang tên dùng chung và giữ responsive**

Trong `frontend/src/index.css`, đổi `.pt-modal-backdrop`, `.pt-form-modal`, `.pt-form-header`, `.pt-form-body`, `.pt-form-section`, `.pt-form-grid`, `.pt-form-footer` thành `.profile-modal-*`/`.profile-form-*`. Giữ nguyên giá trị desktop và media query điện thoại; cập nhật selector form theo `.profile-form-modal form`.

- [ ] **Step 6: Chạy test khung và hồi quy popup PT**

Run: `npm test -- frontend/src/components/ProfileFormModal.test.jsx frontend/src/pages/PortalPage.test.jsx`

Expected: PASS; test “Admin thêm PT bằng popup” và “Admin sửa PT” vẫn giữ nguyên hành vi.

---

### Task 3: Xây dựng popup tạo/sửa khách hàng

**Files:**
- Create: `frontend/src/components/CustomerFormModal.jsx`
- Create: `frontend/src/components/CustomerFormModal.test.jsx`

**Interfaces:**
- Produces: `CustomerFormModal({ open, customer, onClose, onSaved })`.
- Consumes: `ProfileFormModal`, `FormField`, `useToast`, `api.post`, `api.patch`.
- Emits: `onSaved(result.data)` sau khi lưu thành công.

- [ ] **Step 1: Viết test thất bại cho hai mode và danh sách trường**

Test phải xác nhận mode tạo có dialog “Thêm khách hàng”, mode sửa có dialog “Sửa khách hàng” và dữ liệu điền sẵn. Kiểm tra đủ label: Họ tên, Ngày sinh, Giới tính, Số điện thoại, Email, Chiều cao, Cân nặng ban đầu, Lưu ý sức khỏe, Mục tiêu ban đầu, Ghi chú nội bộ, Trạng thái. Đồng thời xác nhận không có Chuyên môn, Chứng chỉ, Tên đăng nhập, Mật khẩu hoặc Ảnh đại diện.

```jsx
expect(screen.getByRole('dialog', { name: 'Thêm khách hàng' })).toBeInTheDocument();
expect(screen.getByLabelText('Họ tên')).toBeRequired();
expect(screen.getByLabelText('Số điện thoại')).toBeRequired();
expect(screen.queryByLabelText('Chuyên môn')).not.toBeInTheDocument();
expect(screen.queryByLabelText('Tên đăng nhập')).not.toBeInTheDocument();
```

Thêm test submit tạo gọi `api.post('/api/customers', expectedPayload)`, submit sửa gọi `api.patch('/api/customers/customer-1', expectedPayload)`, Toast dùng message response và `onSaved` nhận data.

- [ ] **Step 2: Chạy test và xác nhận thất bại vì component chưa tồn tại**

Run: `npm test -- frontend/src/components/CustomerFormModal.test.jsx`

Expected: FAIL với lỗi không tìm thấy module.

- [ ] **Step 3: Cài đặt state và chuẩn hóa payload**

Dùng form mặc định:

```js
const emptyCustomerForm = {
  fullName: '', dateOfBirth: '', gender: 'OTHER', phone: '', email: '',
  height: '', initialWeight: '', medicalNotes: '', initialGoal: '',
  internalNotes: '', status: 'ACTIVE',
};
```

Khi mở, map `customer` vào form và chuyển ngày sang `YYYY-MM-DD`. Khi submit, trim chuỗi; `height`/`initialWeight` là `null` nếu rỗng, ngược lại chuyển `Number`; `dateOfBirth` và `email` rỗng gửi `null`. Tính `dirty` bằng snapshot `initial` giống popup PT.

- [ ] **Step 4: Render các section khách hàng bằng `ProfileFormModal`**

Dùng bốn section với class dùng chung:

```jsx
<ProfileFormModal
  open={open}
  title={editing ? 'Sửa khách hàng' : 'Thêm khách hàng'}
  description="Nhập thông tin hồ sơ và mục tiêu tập luyện của khách hàng."
  dirty={dirty}
  loading={loading}
  submitLabel={editing ? 'Lưu thay đổi' : 'Tạo khách hàng'}
  onClose={onClose}
  onSubmit={submit}
>
  <section className="profile-form-section">
    <h3>Thông tin cá nhân</h3>
    <div className="profile-form-grid">
      <FormField label="Họ tên" name="customerFullName" value={form.fullName} onChange={change('fullName')} required />
      <FormField label="Ngày sinh" name="customerDateOfBirth" type="date" max={today} value={form.dateOfBirth} onChange={change('dateOfBirth')} />
      <FormField label="Giới tính" name="customerGender" as="select" value={form.gender} onChange={change('gender')}>...</FormField>
    </div>
  </section>
  {/* Liên hệ; Chỉ số và sức khỏe; Quản lý với toàn bộ trường đã chốt */}
</ProfileFormModal>
```

Textarea dùng `FormField as="textarea"`; `medicalNotes` và `internalNotes` có `maxLength={2000}`, `initialGoal` có `maxLength={1000}`. Các input số có `min="0"`, `step="0.1"`.

- [ ] **Step 5: Cài đặt request, Toast và khóa submit**

```js
const result = editing
  ? await api.patch(`/api/customers/${customer._id}`, payload)
  : await api.post('/api/customers', payload);
toast.success(result.message);
onSaved(result.data);
```

Trong `catch`, gọi `toast.error(error.message)` và giữ popup mở; trong `finally`, trả `loading=false`.

- [ ] **Step 6: Chạy test component khách hàng**

Run: `npm test -- frontend/src/components/CustomerFormModal.test.jsx`

Expected: toàn bộ test PASS, bao gồm trường ẩn, POST/PATCH, dirty confirmation và Toast.

---

### Task 4: Tích hợp popup khách vào danh sách PT

**Files:**
- Modify: `frontend/src/pages/PortalPage.jsx`
- Modify: `frontend/src/pages/PortalPage.test.jsx`

**Interfaces:**
- Consumes: `CustomerFormModal({ open, customer, onClose, onSaved })`.
- Preserves: `CustomerAccountForm` và các tab transfers/content.

- [ ] **Step 1: Viết test tích hợp thất bại**

Thêm test tại `PortalPage.test.jsx`:

```jsx
it('PT tạo khách bằng popup thay vì form nội tuyến', async () => {
  const user = userEvent.setup();
  renderPtPortal();
  await user.click(screen.getByRole('button', { name: 'Tạo mới' }));
  expect(screen.getByRole('dialog', { name: 'Thêm khách hàng' })).toBeInTheDocument();
});

it('PT sửa khách bằng popup và vẫn cấp tài khoản bằng thao tác riêng', async () => {
  api.get.mockResolvedValueOnce({
    data: [{ _id: 'customer-1', fullName: 'Khách A', phone: '0901234567', status: 'ACTIVE' }],
    meta: { page: 1, totalPages: 1 },
  });
  const user = userEvent.setup();
  renderPtPortal();
  await user.click(await screen.findByRole('button', { name: 'Sửa' }));
  expect(screen.getByRole('dialog', { name: 'Sửa khách hàng' })).toBeInTheDocument();
  expect(screen.getByLabelText('Họ tên')).toHaveValue('Khách A');
});
```

Tách helper `renderPtPortal()` trong file test để tránh lặp wrapper.

- [ ] **Step 2: Chạy test tích hợp và xác nhận thất bại**

Run: `npm test -- frontend/src/pages/PortalPage.test.jsx`

Expected: FAIL vì khách hiện dùng `CustomerForm` nội tuyến và chưa có nút Sửa.

- [ ] **Step 3: Thay form nội tuyến bằng state popup**

Import `CustomerFormModal`, xóa function `CustomerForm`. Trong `PtView`, thêm:

```js
const [customerForm, setCustomerForm] = useState({ open: false, customer: null });
```

Khi tab là `customers`, nút “Tạo mới” gọi:

```js
setCustomerForm({ open: true, customer: null });
```

Render popup ở cuối view:

```jsx
<CustomerFormModal
  open={customerForm.open}
  customer={customerForm.customer}
  onClose={() => setCustomerForm({ open: false, customer: null })}
  onSaved={() => {
    setCustomerForm({ open: false, customer: null });
    load(meta.page || 1);
  }}
/>
```

Không dùng `showForm` để hiển thị customer inline; tiếp tục dùng state hiện tại cho form transfers/content.

- [ ] **Step 4: Bổ sung hai thao tác độc lập trên dòng khách**

Thay `renderActions` của tab khách bằng:

```jsx
<div className="inline-actions">
  <button className="text-button" onClick={() => setCustomerForm({ open: true, customer: item })}>
    <Pencil size={16} /> Sửa
  </button>
  {!item.userId && (
    <button className="text-button" onClick={() => setAccountCustomer(item)}>Cấp tài khoản</button>
  )}
</div>
```

Đổi tab hoặc đóng popup phải reset customer được chọn, nhưng không thay đổi `CustomerAccountForm`.

- [ ] **Step 5: Chạy test tích hợp và toàn bộ frontend mục tiêu**

Run: `npm test -- frontend/src/pages/PortalPage.test.jsx frontend/src/components/ProfileFormModal.test.jsx frontend/src/components/CustomerFormModal.test.jsx`

Expected: PASS; popup PT, popup khách và cấp tài khoản riêng đều hoạt động.

---

### Task 5: Cập nhật tài liệu chung và xác minh toàn dự án

**Files:**
- Modify: `docs/01-dot-1-nen-tang-crm-noi-dung-khach.md`

**Interfaces:**
- Documents: UI khách hàng, trường dữ liệu, validation và ranh giới với tài khoản/chuyển PT.

- [ ] **Step 1: Cập nhật tài liệu Đợt 1**

Thêm mục “Popup hồ sơ khách hàng” nêu rõ:

```markdown
### Popup hồ sơ khách hàng

- PT tạo và sửa hồ sơ khách bằng popup responsive dùng chung nền tảng giao diện với popup PT.
- Hồ sơ gồm thông tin cá nhân, liên hệ, chiều cao/cân nặng ban đầu, lưu ý sức khỏe, mục tiêu, ghi chú nội bộ và trạng thái.
- Cấp tài khoản đăng nhập là popup riêng và chỉ khả dụng khi khách chưa có tài khoản.
- Không đổi PT phụ trách trong popup; chuyển PT tiếp tục yêu cầu hai PT xác nhận trong ứng dụng.
- Khi đóng form đã thay đổi, hệ thống yêu cầu xác nhận; kết quả lưu được thông báo bằng Toast tiếng Việt.
```

- [ ] **Step 2: Chạy toàn bộ test**

Run: `npm test`

Expected: exit code 0, toàn bộ test backend và frontend PASS.

- [ ] **Step 3: Chạy lint**

Run: `npm run lint`

Expected: exit code 0; không có lỗi lint mới. Cảnh báo tồn tại từ trước được ghi lại riêng nếu có.

- [ ] **Step 4: Chạy production build**

Run: `npm run build`

Expected: exit code 0 và Vite tạo bundle production thành công.

- [ ] **Step 5: Kiểm tra thủ công responsive và luồng nghiệp vụ**

Run: `npm run dev`

Expected:

- Desktop: popup hai cột, nội dung cuộn trong popup, footer luôn dễ tiếp cận.
- Điện thoại khoảng 375 px: popup gần toàn màn hình, một cột, không tràn ngang.
- Tạo và sửa khách hiện Toast, đóng popup và tải lại đúng trang danh sách.
- Đóng form bẩn hiện popup xác nhận; form sạch đóng ngay.
- Nút Sửa không làm mất nút Cấp tài khoản; popup hồ sơ không chứa username/password.
- Chuyển PT không xuất hiện trong popup hồ sơ và luồng xác nhận chuyển PT hiện tại không bị ảnh hưởng.
