# Popup CRUD toàn bộ Đợt 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mọi thao tác thêm/sửa của các danh sách Đợt 1 dùng popup, mọi thao tác xóa dùng popup xác nhận, đồng thời backend có đầy đủ update/delete với validation, phân quyền và xóa cứng theo quy tắc đã duyệt.

**Architecture:** Backend mở rộng các service/controller/route hiện có, dùng factory cho bốn resource nội dung và transaction cho cascade khách/xóa PT. Frontend bổ sung `FormModal` dùng chung và các modal nghiệp vụ nhỏ; `PortalPage` chỉ điều phối tab, danh sách và state popup.

**Tech Stack:** React 19, Vitest, React Testing Library, Express 5, Mongoose 9, MongoDB Memory Server, Supertest, CSS responsive hiện có.

## Global Constraints

- Không có form CRUD inline trong trang danh sách.
- Thêm/sửa dùng popup; xóa dùng `ConfirmModal`; thông báo dùng Toast tiếng Việt.
- Backend giữ Route → Controller → Service → Model; mọi route có validate; danh sách có phân trang/bộ lọc; response dùng mẫu chung.
- Xóa cứng khách cascade toàn bộ dữ liệu và tài khoản CUSTOMER trong transaction.
- Chặn xóa PT còn khách; khi đủ điều kiện, chuyển `ptId` nội dung sang PT hiện tại trước khi xóa.
- Nội dung đã công bố khi sửa trở lại DRAFT, `publishedAt=null`, `version + 1`.
- Chỉ sửa/xóa yêu cầu chuyển PT còn PENDING bởi PT gửi.
- Làm trực tiếp trong workspace; không worktree, subagent hoặc commit.

---

### Task 1: CRUD nội dung dùng chung

**Files:**
- Modify: `backend/routes/contentRouteFactory.js`
- Modify: `backend/controllers/publicationController.js`
- Modify: `backend/services/publicationService.js`
- Modify: `backend/routes/inbody.js`
- Modify: `backend/routes/goals.js`
- Modify: `backend/routes/workoutPlans.js`
- Modify: `backend/routes/nutritionPlans.js`
- Test: `backend/tests/publication.test.js`

**Interfaces:**
- Produces: `PATCH /api/{inbody|goals|workout-plans|nutrition-plans}/:id`.
- Produces: `DELETE /api/{resource}/:id`.
- Produces: `updateContent(resource,user,id,payload)` và `deleteContent(resource,user,id)`.

- [ ] Viết test RED cho sửa draft, sửa published về draft/tăng version, xóa, ownership và ID/body sai.
- [ ] Chạy `npm test -- backend/tests/publication.test.js`; expected FAIL vì chưa có PATCH/DELETE CRUD.
- [ ] Mở rộng factory nhận cùng `bodyValidator` cho POST và PATCH, gắn `idValidator + bodyValidator` cho PATCH, chỉ `idValidator` cho DELETE.
- [ ] Thêm controller `update` trả “Cập nhật … thành công.” và `remove` trả `data:null`, message “Xóa … thành công.”.
- [ ] Trong service, lấy item theo ID, gọi `assertCustomerAccess`, whitelist payload theo schema resource, không nhận `ptId/status/publishedAt/version`; cập nhật published thành draft và tăng version; `deleteOne()` sau kiểm tra quyền.
- [ ] Mở rộng validator từng resource cho toàn bộ field model và từ chối field hệ thống/unknown.
- [ ] Chạy lại test publication; expected PASS.

### Task 2: CRUD yêu cầu chuyển PT

**Files:**
- Modify: `backend/routes/transfers.js`
- Modify: `backend/controllers/transferController.js`
- Modify: `backend/services/transferService.js`
- Modify: `backend/models/TransferRequest.js`
- Test: `backend/tests/transfers.test.js`

**Interfaces:**
- Produces: `PATCH /api/transfers/:id`, `DELETE /api/transfers/:id`.
- Produces: snapshot `fromPtName`, `toPtName`, `resolvedByName`.

- [ ] Viết test RED: người gửi sửa/xóa PENDING; người nhận/PT khác bị chặn; trạng thái đã xử lý bị chặn; snapshot được lưu.
- [ ] Chạy test transfers; expected FAIL do route chưa tồn tại.
- [ ] Thêm snapshot string vào model; populate từ User khi create/resolve/force.
- [ ] Thêm service `updateTransfer` và `deleteTransfer`, kiểm tra `fromPtId=user.id`, status PENDING, PT nhận active/khác người gửi.
- [ ] Thêm validator ID/body, controller và route PATCH/DELETE với response tiếng Việt.
- [ ] Chạy lại test transfers; expected PASS.

### Task 3: Xóa khách, CRUD gói PT và xóa PT

**Files:**
- Modify: `backend/routes/customers.js`
- Modify: `backend/controllers/customerController.js`
- Modify: `backend/services/customerService.js`
- Modify: `backend/routes/users.js`
- Modify: `backend/controllers/userController.js`
- Modify: `backend/services/userService.js`
- Test: `backend/tests/customers.test.js`
- Test: `backend/tests/auth.test.js`

**Interfaces:**
- Produces: `DELETE /api/customers/:id` cascade.
- Produces: `PATCH|DELETE /api/customers/:id/packages/:packageId`.
- Produces: `DELETE /api/users/:id` cho PT.

- [ ] Viết test RED cho cascade khách (5 collection nội dung/gói/chuyển + account), ownership và rollback; update/delete package; chặn xóa PT còn khách; xóa PT và chuyển quyền nội dung khi không còn khách.
- [ ] Chạy test customers/auth; expected FAIL vì endpoints chưa tồn tại.
- [ ] Thêm package ID/body validators; service update tính `remainingSessions=totalSessions-usedSessions`, delete theo customer scope; controller/route tiếng Việt.
- [ ] Thêm `deleteCustomer`: mở session transaction, kiểm tra scope, deleteMany các model liên quan, delete profile và user CUSTOMER liên kết; commit/abort/endSession đúng nhánh.
- [ ] Thêm `deletePt`: Admin-only, kiểm tra role PT và `CustomerProfile.exists({assignedPtId:id})`; tìm content `ptId=id`, resolve customer current PT, chặn orphan, bulkWrite đổi ptId, rồi xóa PT trong transaction.
- [ ] Thêm controllers/routes DELETE với validate ID và response `data:null`.
- [ ] Chuyển test Mongo sang `MongoMemoryReplSet` cho transaction.
- [ ] Chạy lại test mục tiêu; expected PASS.

### Task 4: Khung popup chung và modal tài khoản/chuyển PT

**Files:**
- Create: `frontend/src/components/FormModal.jsx`
- Create: `frontend/src/components/FormModal.test.jsx`
- Modify: `frontend/src/components/ProfileFormModal.jsx`
- Create: `frontend/src/components/CustomerAccountModal.jsx`
- Create: `frontend/src/components/TransferFormModal.jsx`
- Test: `frontend/src/components/CrudModals.test.jsx`
- Modify: `frontend/src/index.css`

**Interfaces:**
- Produces: `FormModal({open,title,description,dirty,loading,submitLabel,onClose,onSubmit,children,size})`.
- Produces: `CustomerAccountModal({open,customer,onClose,onSaved})`.
- Produces: `TransferFormModal({open,transfer,onClose,onSaved})`.

- [ ] Viết test RED cho FormModal lifecycle và hai modal nghiệp vụ POST/PATCH, hidden khi đóng, dirty confirmation.
- [ ] Chạy test component; expected FAIL vì module chưa có.
- [ ] Trích lifecycle hiện tại sang FormModal; ProfileFormModal compose FormModal mà không đổi contract PT/Customer.
- [ ] Cài CustomerAccountModal dùng POST account và TransferFormModal dùng POST/PATCH transfer; Toast và payload tiếng Việt.
- [ ] Bổ sung CSS size/default responsive một cột trên mobile.
- [ ] Chạy test component và popup PT/Customer; expected PASS.

### Task 5: Modal nội dung và gói PT

**Files:**
- Create: `frontend/src/components/ContentFormModal.jsx`
- Create: `frontend/src/components/PtPackageFormModal.jsx`
- Create: `frontend/src/components/ContentFormModal.test.jsx`
- Create: `frontend/src/components/PtPackageFormModal.test.jsx`

**Interfaces:**
- Produces: `ContentFormModal({open,resource,item,onClose,onSaved})` gọi POST/PATCH resource.
- Produces: `PtPackageFormModal({open,customerId,packageItem,onClose,onSaved})`.

- [ ] Viết test RED cho đủ field InBody/goal/workout/nutrition, prefill edit, POST/PATCH, nested macros, thêm/xóa session/exercise và package create/update.
- [ ] Chạy test; expected FAIL vì components chưa có.
- [ ] Cài modal nội dung với state riêng theo resource; chuẩn hóa số/ngày/nested payload; workout hỗ trợ thêm/xóa buổi và bài tập bằng nút type button.
- [ ] Cài modal package, validate ngày và số buổi phía HTML, gọi endpoint theo mode.
- [ ] Chạy test modal; expected PASS.

### Task 6: Tích hợp toàn bộ popup vào Portal

**Files:**
- Modify: `frontend/src/pages/PortalPage.jsx`
- Modify: `frontend/src/pages/PortalPage.test.jsx`

**Interfaces:**
- Consumes: các modal Task 4–5 và `api.delete(path)`.

- [ ] Viết test RED: không có `.portal-content > form`; cấp tài khoản/chuyển/content đều mở dialog; mỗi dòng có Sửa/Xóa đúng điều kiện; xóa mở confirm và gọi DELETE; Admin xóa PT dùng confirm.
- [ ] Chạy Portal test; expected FAIL do các form inline còn tồn tại.
- [ ] Xóa `ContentForm`, `CustomerAccountForm`, `TransferForm` khỏi PortalPage; thay bằng state `{resource,item}` và các modal component.
- [ ] Chuẩn hóa action theo tab: customer edit/delete/account/package; transfer edit/delete PENDING + accept/reject; content edit/delete/publish; Admin PT edit/delete.
- [ ] Thêm state confirmDelete/loading, nội dung cảnh báo theo resource; gọi `api.delete`, Toast, đóng và reload đúng page.
- [ ] Thêm view gói PT theo customer đang chọn với phân trang/filter và PtPackageFormModal.
- [ ] Chạy Portal và component tests; expected PASS.

### Task 7: API client, tài liệu và xác minh

**Files:**
- Modify: `frontend/src/services/api.js`
- Modify: `docs/01-dot-1-nen-tang-crm-noi-dung-khach.md`
- Modify: `docs/00-tong-quan-ke-hoach-3s-wellness.md`

**Interfaces:**
- Produces: `api.delete(path)` dùng response chuẩn.

- [ ] Viết/điều chỉnh test API client nếu file test hiện có; xác nhận RED khi chưa có delete.
- [ ] Thêm method DELETE dùng cùng request wrapper và xử lý lỗi chung.
- [ ] Cập nhật tài liệu chung: mọi CRUD dùng popup, xóa cứng cascade khách, điều kiện xóa PT, endpoint update/delete.
- [ ] Chạy `npm test`; expected 0 failures.
- [ ] Chạy `npm run lint`; expected exit 0, không có lỗi mới.
- [ ] Chạy `npm run build`; expected exit 0.
- [ ] Kiểm tra thủ công desktop và viewport 375px: không form CRUD inline, dialog cuộn đúng, không tràn ngang, Toast/confirm hoạt động.
