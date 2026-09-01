# Thiết kế một SUPER_ADMIN và nhiều ADMIN

## Mục tiêu

Hệ thống có đúng một tài khoản `SUPER_ADMIN` dùng để quản lý vòng đời các tài khoản quản trị, đồng thời cho phép nhiều tài khoản `ADMIN` thường cùng vận hành hệ thống. Các ADMIN thường có quyền nghiệp vụ hiện tại nhưng không thể quản lý tài khoản quản trị khác.

## Mô hình vai trò

`UserRole` gồm bốn giá trị:

- `SUPER_ADMIN`: tài khoản quản trị cấp cao duy nhất.
- `ADMIN`: tài khoản quản trị nghiệp vụ; có thể có nhiều tài khoản.
- `PT`: huấn luyện viên.
- `CUSTOMER`: khách hàng.

`SUPER_ADMIN` kế thừa toàn bộ quyền mà các route và màn hình hiện dành cho `ADMIN`. Việc kế thừa được xử lý tập trung trong middleware phân quyền và guard frontend, không sửa rải rác mọi chức năng nghiệp vụ bằng các điều kiện trùng lặp.

## Quy tắc quản lý tài khoản

### SUPER_ADMIN

- Được tạo, xem, sửa, khóa và xóa tài khoản `ADMIN`, `PT`, `CUSTOMER`.
- Không được tạo tài khoản `SUPER_ADMIN` qua API hoặc giao diện.
- Không được tự khóa, tự xóa hoặc đổi vai trò của chính mình.
- Được cập nhật hồ sơ và mật khẩu của chính mình nhưng role luôn bất biến và trạng thái không thể chuyển sang `LOCKED`.

### ADMIN

- Có toàn bộ quyền nghiệp vụ vốn dành cho `ADMIN`.
- Được tạo, xem, sửa, khóa và xóa tài khoản `PT`, `CUSTOMER` theo các quy tắc dữ liệu hiện có.
- Không được tạo, sửa, khóa, xóa hoặc đổi vai trò của `ADMIN` hay `SUPER_ADMIN`.
- Không được gán role `ADMIN` hoặc `SUPER_ADMIN` trong payload.

### Bất biến hệ thống

- Database chỉ cho phép tối đa một document có role `SUPER_ADMIN` bằng unique partial index.
- Không có endpoint công khai nào tạo hoặc thăng cấp thêm `SUPER_ADMIN`.
- Tài khoản `SUPER_ADMIN` chỉ được thiết lập bởi luồng bootstrap.

## Bootstrap và biến môi trường

Thay hoàn toàn bộ biến cũ:

- `ADMIN_USERNAME` → `SUPER_ADMIN_USERNAME`
- `ADMIN_PASSWORD` → `SUPER_ADMIN_PASSWORD`
- `ADMIN_FULL_NAME` → `SUPER_ADMIN_FULL_NAME`

Không đọc và không fallback về `ADMIN_*`. `.env.example`, tài liệu cấu hình và mã khởi động chỉ dùng tên mới.

Ở môi trường khác `test`, `SUPER_ADMIN_USERNAME` và `SUPER_ADMIN_PASSWORD` là cấu hình bắt buộc; thiếu một trong hai phải làm khởi động thất bại với lỗi cấu hình rõ ràng. Môi trường test được phép bỏ qua bootstrap khi cả hai biến đều không có.

Khi khởi động:

1. Nếu đã có một `SUPER_ADMIN` với username đúng cấu hình, bảo đảm ví credit tồn tại rồi tiếp tục.
2. Nếu đã có `SUPER_ADMIN` nhưng username khác cấu hình, dừng khởi động với lỗi cấu hình rõ ràng thay vì âm thầm tạo hoặc đổi tài khoản.
3. Nếu chưa có `SUPER_ADMIN` và username cấu hình đang thuộc một `ADMIN`, nâng tài khoản đó thành `SUPER_ADMIN`.
4. Nếu username chưa tồn tại, tạo tài khoản `SUPER_ADMIN` mới.
5. Nếu username thuộc `PT` hoặc `CUSTOMER`, dừng với lỗi xung đột và không đổi vai trò tự động.

Mật khẩu bootstrap chỉ dùng khi tạo tài khoản mới. Việc khởi động lại không tự động ghi đè mật khẩu của SUPER_ADMIN hiện hữu.

## Migration dữ liệu

Migration thêm unique partial index cho `users.role = SUPER_ADMIN`. Vì dữ liệu hiện tại chưa có role này nên migration không tự chọn hoặc tự nâng một ADMIN bất kỳ. Luồng bootstrap dùng username cấu hình để thực hiện việc nâng cấp có chủ đích sau migration.

Migration down gỡ partial index nhưng không tự hạ role của SUPER_ADMIN, tránh biến đổi tài khoản âm thầm. Nếu rollback ứng dụng cần thực hiện, người vận hành phải đổi role tài khoản theo quy trình vận hành đã xác nhận trước.

## Backend và API

- Middleware `authorize('ADMIN')` coi `SUPER_ADMIN` là vai trò thỏa quyền ADMIN.
- API user nhận `req.user` và kiểm tra actor/target trong service trước khi thay đổi dữ liệu.
- Service cập nhật/xóa người dùng được tổng quát hóa, nhưng vẫn giữ các bảo vệ dữ liệu chuyên biệt khi xóa PT hoặc CUSTOMER.
- Payload tạo/cập nhật từ ADMIN bị từ chối nếu nhắm tới role quản trị.
- Payload role `SUPER_ADMIN` luôn bị từ chối ở API user thông thường.
- Thao tác trái quyền trả về `403`; tự khóa/tự xóa SUPER_ADMIN hoặc vi phạm bất biến trả về `409` với thông báo tiếng Việt rõ ràng.
- Tạo, sửa, khóa và xóa ADMIN được ghi audit gồm actor, target, hành động và thời điểm.

## Frontend

- Session và route guard nhận biết `SUPER_ADMIN` và đưa tài khoản này vào workspace `/admin`.
- Các màn hình nghiệp vụ đang dành cho ADMIN cũng hiển thị cho SUPER_ADMIN.
- `UserManagementView` nhận vai trò và id của người đang đăng nhập để điều khiển lựa chọn role và thao tác hiển thị.
- SUPER_ADMIN thấy lựa chọn tạo `ADMIN`, `PT`, `CUSTOMER`.
- ADMIN chỉ thấy lựa chọn tạo `PT`, `CUSTOMER`.
- ADMIN không thấy nút sửa/xóa trên dòng ADMIN hoặc SUPER_ADMIN.
- Dòng SUPER_ADMIN có badge riêng; không hiển thị nút xóa và không cho chọn trạng thái `LOCKED` hay đổi role.
- Frontend chỉ cải thiện trải nghiệm; backend vẫn là nguồn thực thi quyền bắt buộc.

## Kiểm thử

### Backend

- Bootstrap tạo SUPER_ADMIN mới, nâng ADMIN trùng username và từ chối username thuộc PT/CUSTOMER.
- Bootstrap từ chối cấu hình username khác khi SUPER_ADMIN đã tồn tại.
- Unique partial index từ chối SUPER_ADMIN thứ hai.
- SUPER_ADMIN đi qua route yêu cầu ADMIN.
- ADMIN tạo/quản lý PT và CUSTOMER thành công.
- ADMIN không thể tạo hoặc tác động ADMIN/SUPER_ADMIN.
- SUPER_ADMIN quản lý ADMIN thành công nhưng không thể tạo SUPER_ADMIN, tự khóa, tự xóa hoặc đổi role của mình.
- Audit được ghi cho thay đổi vòng đời ADMIN.

### Frontend

- SUPER_ADMIN được điều hướng vào `/admin` và qua guard ADMIN.
- Danh sách role và nút thao tác khác nhau đúng theo actor ADMIN/SUPER_ADMIN.
- Badge SUPER_ADMIN hiển thị đúng.
- Các thao tác bị cấm không gọi API.

### Cấu hình

- Mã nguồn và tài liệu không còn tham chiếu hoạt động đến `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_FULL_NAME`.
- Chỉ `SUPER_ADMIN_*` được đọc khi bootstrap.

## Tiêu chí hoàn thành

Sau khi khởi động ở môi trường khác `test`, hệ thống có đúng một SUPER_ADMIN bootstrap, hỗ trợ nhiều ADMIN thường, thực thi phân quyền ở backend, phản ánh đúng quyền trên frontend và không còn sử dụng biến môi trường `ADMIN_*`. Mọi thay đổi trong phạm vi có test RED/GREEN, lint và typecheck tương ứng.
