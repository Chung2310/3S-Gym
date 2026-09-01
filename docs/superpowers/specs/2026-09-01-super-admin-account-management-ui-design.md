# Thiết kế giao diện quản lý tài khoản Admin cho SUPER_ADMIN

## Mục tiêu

Bổ sung một trang quản lý riêng để `SUPER_ADMIN` quản lý vòng đời các tài khoản `ADMIN` thường. Trang không hiển thị PT, khách hàng hoặc tài khoản `SUPER_ADMIN`, và không xuất hiện với `ADMIN` thường.

## Phạm vi

- Thêm mục sidebar “Tài khoản Admin” chỉ dành cho `SUPER_ADMIN`.
- Thêm route `/admin/admin-accounts` yêu cầu chính xác role `SUPER_ADMIN`.
- Hiển thị, tìm kiếm và phân trang danh sách tài khoản role `ADMIN`.
- Cho phép tạo, sửa, đổi mật khẩu, khóa/mở khóa và xóa `ADMIN`.
- Tái sử dụng API `/api/users` và cơ chế phân quyền backend hiện có.
- Không hiển thị hoặc chỉnh sửa tài khoản `SUPER_ADMIN` trên trang này.
- Không bổ sung dashboard audit hoặc thay đổi mô hình phân quyền backend.

## Kiến trúc frontend

### Route và điều hướng

- `PortalRoutes.tsx` ánh xạ `/admin/admin-accounts` tới `AdminAccountsPage`.
- Route được bọc bởi `FeatureRoute` với `roles={['SUPER_ADMIN']}`. Cơ chế kế thừa quyền chỉ cho `SUPER_ADMIN` thỏa quyền `ADMIN`, không cho chiều ngược lại, nên `ADMIN` thường không vượt qua guard này.
- `portalNavigation.ts` thêm mục “Tài khoản Admin” với `roles: ['SUPER_ADMIN']` và `matchChildren: true`.
- Người dùng `ADMIN` truy cập URL trực tiếp sẽ được chuyển về `/portal`, sau đó trở lại workspace phù hợp `/admin`.

### Page và component

- `AdminAccountsPage` là page mỏng, nhận người dùng hiện tại và lắp ráp `AdminAccountManagementView`.
- `AdminAccountManagementView` chịu trách nhiệm state, gọi API và phối hợp các component giao diện.
- `AdminAccountFormModal` là modal chuyên biệt cho tài khoản `ADMIN`; role được cố định trong payload và không có trường chọn role.
- Tái sử dụng các primitive hiện có như `ProfileFormModal`, `FormField`, `StatusBadge`, `ConfirmModal`, `Pagination` và `ToastProvider`.
- UI mới dùng Tailwind CSS và token hiện có; không thêm inline style, CSS module hoặc framework CSS mới.

## Giao diện

Trang gồm:

1. Header với tiêu đề “Quản lý tài khoản Admin”, mô tả ngắn và nút “Thêm Admin”.
2. Thanh tìm kiếm theo tên đăng nhập, họ tên hoặc email; bộ lọc trạng thái `ACTIVE`/`LOCKED`; nút đặt lại và tải lại.
3. Bảng responsive gồm người dùng, liên hệ, trạng thái, ngày tạo và thao tác.
4. Trạng thái tải, danh sách rỗng và lỗi có thông điệp tiếng Việt rõ ràng.

Mỗi dòng `ADMIN` có:

- Sửa hồ sơ và mật khẩu.
- Khóa hoặc mở khóa qua form cập nhật trạng thái.
- Xóa qua hộp thoại xác nhận nguy hiểm.

## Form tạo và sửa

### Tạo ADMIN

- Payload luôn có `role: 'ADMIN'`.
- Bắt buộc tên đăng nhập và mật khẩu đúng 6 chữ số.
- Cho phép nhập họ tên, email, số điện thoại và trạng thái ban đầu.
- Không có lựa chọn `SUPER_ADMIN`, `PT` hoặc `CUSTOMER`.

### Sửa ADMIN

- Không gửi `username` hoặc `role` trong payload cập nhật.
- Cho phép đổi họ tên, email, số điện thoại và trạng thái.
- Mật khẩu mới có thể để trống; nếu nhập phải đúng 6 chữ số.
- Thành công sẽ đóng modal, hiển thị toast và tải lại trang danh sách hiện tại.

## Luồng dữ liệu

1. Khi trang mở hoặc bộ lọc thay đổi, component gọi `GET /api/users` với `role=ADMIN`, `page`, `limit`, `keyword` và `status` phù hợp.
2. Tham số `role=ADMIN` được gắn cố định trong hàm tải dữ liệu, không lấy từ input giao diện.
3. Tạo tài khoản gọi `POST /api/users` với role cố định `ADMIN`.
4. Sửa/khóa gọi `PATCH /api/users/:id`.
5. Xóa gọi `DELETE /api/users/:id` sau xác nhận.
6. Backend tiếp tục là lớp bắt buộc thực thi quyền; việc ẩn menu và nút chỉ cải thiện trải nghiệm.

## Xử lý lỗi và an toàn

- Lỗi API được chuẩn hóa qua `errorMessage` và hiển thị bằng toast.
- Không đóng modal khi request thất bại; dữ liệu người dùng đã nhập được giữ lại.
- Nút submit và thao tác nguy hiểm bị vô hiệu hóa trong lúc request đang chạy để tránh gửi lặp.
- Xóa yêu cầu xác nhận với tên tài khoản đích.
- Nếu phiên đăng nhập không còn quyền, backend trả `403`; giao diện hiển thị lỗi và không thay đổi state danh sách.
- Mọi request danh sách phải giữ `role=ADMIN`, kể cả sau tìm kiếm, đặt lại bộ lọc, tải lại hoặc chuyển trang.

## Kiểm thử

### Unit/service

- `SUPER_ADMIN` nhìn thấy mục điều hướng `/admin/admin-accounts`.
- `ADMIN` thường không nhìn thấy mục này.
- Guard cho phép `SUPER_ADMIN` và từ chối `ADMIN` với route yêu cầu `SUPER_ADMIN`.

### Component

- Trang tải danh sách với query cố định `role=ADMIN`.
- Tìm kiếm, lọc trạng thái và phân trang không làm mất query role.
- Form tạo chỉ gửi role `ADMIN` và không hiển thị lựa chọn role khác.
- Form sửa không gửi `username` hoặc `role`.
- Mật khẩu không đúng 6 chữ số không gọi API.
- Tạo, sửa, khóa và xóa thành công tải lại danh sách.
- Hủy xác nhận xóa không gọi API.

## Tiêu chí hoàn thành

- Chỉ `SUPER_ADMIN` thấy menu và truy cập được `/admin/admin-accounts`.
- Trang chỉ hiển thị tài khoản `ADMIN` thường.
- `SUPER_ADMIN` tạo, sửa, khóa/mở khóa và xóa được `ADMIN` qua giao diện.
- Không có đường giao diện nào trên trang tạo hoặc chỉnh role `SUPER_ADMIN`.
- Mật khẩu tạo mới hoặc thay đổi được kiểm tra đúng 6 chữ số.
- Test mục tiêu, lint file thay đổi và typecheck liên quan đạt; các lỗi toàn repository không thuộc phạm vi được báo riêng.
