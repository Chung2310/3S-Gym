# PT Progress Dashboard And Modals Design

## Goal

Biến trang Tiến độ thành dashboard của toàn bộ khách được gán cho PT đang đăng nhập. Mọi thao tác xem chi tiết và ghi nhận buổi tập diễn ra trong hai popup riêng.

## Dashboard

API `GET /api/customers/progress-overview` trả về đúng các khách PT được phép quản lý cùng số buổi, tỷ lệ tham gia, volume, RPE, thay đổi cân nặng/body fat và thành tích gần nhất. Trang có tìm kiếm theo tên/SĐT, thẻ KPI tổng và danh sách khách. Mỗi khách có hai hành động: `Xem tiến độ` và `Ghi nhận buổi tập`.

## Modals

- Modal chi tiết tải `GET /api/customers/:id/journey` khi mở và hiển thị workspace tiến độ hiện có, không chứa form ghi nhận.
- Modal ghi nhận tải cùng journey để lấy giáo án đang áp dụng, sau đó hiển thị `WorkoutSessionLogger`. Lưu thành công đóng modal và tải lại dashboard.
- Escape, nút đóng và click backdrop đóng modal; modal có role dialog, khóa cuộn nền và trả focus về nút mở.

## Empty And Error States

Không có khách thì hiển thị hướng dẫn gán khách cho PT. Khách chưa có giáo án vẫn mở modal ghi nhận nhưng hiển thị thông báo cần gán giáo án. Lỗi API dùng toast và không làm mất dashboard hiện tại.

## Testing

Backend kiểm tra phân quyền và số liệu overview. Frontend kiểm tra dashboard render nhiều khách, tìm kiếm và hai popup độc lập.
