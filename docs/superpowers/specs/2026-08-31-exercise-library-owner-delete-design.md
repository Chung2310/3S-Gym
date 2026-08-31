# Thiết kế quyền sở hữu và xóa bài tập trong thư viện

## Mục tiêu

Cho phép PT tạo bài tập `PRIVATE` hoặc `GLOBAL`, đồng thời bảo đảm PT tạo bài là người duy nhất ngoài Admin có quyền sửa và xóa bài đó. Giao diện thư viện phải cung cấp thao tác xóa có xác nhận, phản hồi rõ ràng và cập nhật danh sách chính xác.

## Phạm vi

- Thay đổi quyền tạo, sửa và xóa bài tập ở backend.
- Trả quyền quản lý của từng bài trong API danh sách/chi tiết.
- Cho phép chọn phạm vi khi PT tạo bài tập.
- Bổ sung thao tác xóa và modal xác nhận trong thư viện bài tập.
- Bổ sung kiểm thử backend và frontend liên quan.

Không thực hiện migration gán chủ sở hữu cho dữ liệu `GLOBAL` cũ và không thay đổi cách bài tập đã được nhúng vào giáo án/buổi tập.

## Quy tắc nghiệp vụ

1. Admin có thể tạo bài `GLOBAL` hoặc `PRIVATE` và quản lý mọi bài tập.
2. PT có thể tạo bài `PRIVATE` hoặc `GLOBAL`.
3. Mọi bài do PT tạo đều lưu `ownerPtId`, không phụ thuộc phạm vi.
4. Bài `PRIVATE` chỉ hiển thị với PT sở hữu và Admin.
5. Bài `GLOBAL` hiển thị với mọi PT và Admin.
6. PT chỉ được sửa hoặc xóa bài có `ownerPtId` trùng với tài khoản của mình.
7. PT khác chỉ được xem bài `GLOBAL`, không được sửa hoặc xóa.
8. Bài `GLOBAL` cũ không có `ownerPtId` chỉ Admin được sửa hoặc xóa.
9. Xóa bài khỏi thư viện không sửa các snapshot/tên bài đã lưu trong giáo án hoặc lịch sử tập.

## Backend

### Tạo bài

`exerciseService.create` giữ `scope` hợp lệ do PT gửi thay vì ép về `PRIVATE`. Khi người tạo là PT, service luôn gán `ownerPtId = user.id`. Admin tiếp tục có toàn quyền; bài do Admin tạo không bắt buộc có chủ sở hữu PT.

### Kiểm tra quyền

Tách điều kiện quản lý thành một quy tắc dùng chung:

- Admin: được quản lý.
- PT: được quản lý khi `String(exercise.ownerPtId) === user.id`.

Quy tắc này được dùng nhất quán cho cả cập nhật và xóa. Quyền xem vẫn dựa trên phạm vi: `GLOBAL` hoặc bài thuộc PT hiện tại.

### Dữ liệu trả về

Response bài tập có thêm `canManage: boolean`, được tính từ người dùng đang đăng nhập. Frontend sử dụng giá trị này để hiển thị thao tác; backend vẫn là nơi thực thi quyền cuối cùng.

### Tương thích dữ liệu cũ

Bài `GLOBAL` không có `ownerPtId` vẫn đọc được bởi mọi PT nhưng `canManage` là `false` với PT. Admin có `canManage = true`.

## Frontend

### Form bài tập

Form tạo cho phép chọn `PRIVATE` hoặc `GLOBAL` và gửi đúng `scope`. Khi sửa, phạm vi tiếp tục là trường được bảo vệ, không thay đổi trong bản cập nhật này.

### Danh sách và thao tác

Kiểu `Exercise` có thêm `canManage`. Mỗi hàng có `canManage === true` hiển thị hai thao tác `Sửa` và `Xóa`; các hàng khác không hiển thị hai thao tác này.

Nhấn `Xóa` mở `ConfirmModal` dùng chung, hiển thị tên bài tập và cảnh báo thao tác không thể hoàn tác. Modal có trạng thái đang xử lý để ngăn gửi lặp.

### Luồng xóa

1. Người dùng chọn `Xóa` trên một bài có quyền quản lý.
2. Trang lưu bài đang chờ xóa và mở modal xác nhận.
3. Xác nhận gọi `DELETE /api/exercises/:id`.
4. Thành công: đóng modal, hiển thị toast thành công và tải lại trang hiện tại.
5. Nếu xóa mục cuối cùng của một trang lớn hơn trang 1, tải trang liền trước.
6. Thất bại: giữ modal/danh sách ở trạng thái an toàn, kết thúc trạng thái đang xử lý và hiển thị lỗi từ API.

## Xử lý lỗi và bảo mật

- Backend trả `403` nếu PT sửa/xóa bài không thuộc sở hữu.
- Backend trả `404` nếu bài không tồn tại.
- Frontend không dựa vào việc ẩn nút để bảo vệ API.
- Mọi lần xóa thành công tiếp tục ghi audit `EXERCISE_DELETED`.
- Không xóa trước khỏi giao diện theo kiểu optimistic để tránh lệch trạng thái khi API thất bại.

## Kiểm thử

### Backend

- PT tạo được bài `GLOBAL` và response lưu đúng `ownerPtId`.
- PT tạo bài `PRIVATE` vẫn hoạt động.
- PT sở hữu sửa/xóa được bài `GLOBAL` của mình.
- PT khác xem được nhưng bị từ chối sửa/xóa bài `GLOBAL` đó.
- Admin sửa/xóa được mọi bài.
- Bài `GLOBAL` cũ không chủ sở hữu không thể bị PT sửa/xóa.
- `canManage` đúng theo từng vai trò và chủ sở hữu.

### Frontend

- Form tạo gửi đúng phạm vi được chọn.
- Hàng có `canManage` hiển thị `Sửa` và `Xóa`; hàng không có quyền không hiển thị.
- Nhấn xóa chỉ gọi API sau khi xác nhận.
- Hủy modal không gọi API.
- Xóa thành công hiển thị toast và tải lại đúng trang.
- Xóa mục cuối trang chuyển về trang trước.
- API thất bại hiển thị lỗi và không làm mất hàng trong danh sách.

## Tiêu chí hoàn thành

- Quyền sở hữu được thực thi ở backend và thể hiện đúng trên frontend.
- PT có thể tạo, sửa và xóa bài `GLOBAL` do mình tạo nhưng không quản lý bài của PT khác.
- Xóa luôn có xác nhận và phản hồi thành công/thất bại rõ ràng.
- Kiểm thử liên quan và typecheck đều đạt.
