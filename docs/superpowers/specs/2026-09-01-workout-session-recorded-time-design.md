# Thiết kế ngày và giờ ghi nhận buổi tập

## Mục tiêu

Biểu mẫu **Ghi nhận buổi tập** phải hiển thị riêng ngày và giờ ghi nhận, tự điền theo thời điểm PT mở biểu mẫu và cho phép PT chỉnh sửa trước khi lưu.

## Phạm vi

- Đổi trường ngày hiện tại thành **Ngày ghi nhận**.
- Thêm trường **Giờ ghi nhận**.
- Khởi tạo cả hai trường theo ngày và giờ cục bộ của thiết bị khi biểu mẫu được tạo hoặc khi chuyển sang một khách hàng/giáo án khác.
- Giữ hai trường có thể chỉnh sửa và bắt buộc nhập.
- Hiển thị đầy đủ ngày và giờ trong phần chi tiết của mỗi buổi tập.
- Không thay đổi cấu trúc database hoặc API backend.

## Luồng dữ liệu

Frontend lưu ngày và giờ dưới dạng hai chuỗi phù hợp với `input[type=date]` và `input[type=time]`. Khi PT gửi biểu mẫu, frontend ghép hai giá trị thành một `Date` theo múi giờ cục bộ rồi chuyển thành chuỗi ISO trong trường `performedAt` hiện có.

Backend tiếp tục xác thực và lưu `performedAt` dưới dạng `Date`. Số đo cơ thể và ảnh tiến độ được tạo cùng buổi tập tiếp tục dùng chính thời điểm này, nên dữ liệu báo cáo theo ngày vẫn đồng bộ.

## Giao diện

Hàng thông tin đầu biểu mẫu gồm:

1. Buổi tập.
2. Ngày ghi nhận.
3. Giờ ghi nhận.
4. Điểm danh.

Các trường dùng Tailwind theo quy chuẩn hiện tại, có nhãn truy cập rõ ràng, placeholder và trạng thái focus. Bố cục tự xuống hàng trên màn hình nhỏ.

Chi tiết buổi tập hiển thị thời điểm theo định dạng Việt Nam `dd/mm/yyyy · HH:mm`.

## Xử lý lỗi

- Cả ngày và giờ đều là trường bắt buộc ở trình duyệt.
- Nếu không thể tạo thời điểm hợp lệ từ hai giá trị, biểu mẫu không gọi API và hiển thị thông báo lỗi.
- Giá trị gửi backend luôn là ISO để tránh cách hiểu ngày không nhất quán.

## Kiểm thử

- Khi render biểu mẫu tại một thời điểm cố định, ngày và giờ được điền sẵn đúng theo giờ cục bộ.
- PT có thể chỉnh ngày và giờ; payload gửi API chứa `performedAt` ISO tương ứng.
- Không gọi API nếu ngày hoặc giờ không hợp lệ.
- Chi tiết buổi tập hiển thị đồng thời ngày và giờ.

## Ngoài phạm vi

- Không thêm trường database mới.
- Không thay đổi lịch sử dữ liệu cũ.
- Không bổ sung màn hình sửa buổi tập đã lưu.
