# Header Notification Dropdown Design

## Mục tiêu

Chuyển điểm truy cập thông báo từ sidebar sang icon chuông trên header. Người dùng xem nhanh các thông báo gần nhất trong dropdown mà không phải rời trang hiện tại, đồng thời vẫn có thể mở trung tâm thông báo đầy đủ.

## Phạm vi

- Bỏ mục `Thông báo` khỏi sidebar cho mọi vai trò.
- Giữ route `/portal/notifications` và `NotificationCenter` hiện tại.
- Thêm component độc lập `NotificationBell` vào header, ngay trước thông tin người dùng.
- Không bổ sung realtime/WebSocket trong thay đổi này.

## Kiến trúc component

`NotificationBell` chịu trách nhiệm riêng cho:

- Tải tối đa 10 thông báo mới nhất từ API hiện có.
- Tính và hiển thị số thông báo chưa đọc.
- Quản lý trạng thái mở/đóng dropdown.
- Đánh dấu đã đọc và điều hướng tới tài nguyên liên quan.
- Hiển thị các trạng thái loading, rỗng và lỗi.

`AppShell` chỉ render component và không chứa logic API thông báo. Mapping từ `resourceType` sang route cần được dùng chung giữa dropdown và `NotificationCenter`, tránh hai nơi định nghĩa lệch nhau.

## Giao diện và tương tác

- Icon chuông nằm trước khối tên/vai trò người dùng trên header.
- Badge đỏ hiển thị số chưa đọc; giá trị từ 100 trở lên hiển thị `99+`.
- Nút chuông có nhãn truy cập mô tả số chưa đọc.
- Bấm chuông mở hoặc đóng dropdown.
- Bấm ra ngoài hoặc nhấn `Escape` đóng dropdown.
- Dropdown hiển thị tối đa 10 thông báo theo thứ tự API trả về.
- Thông báo chưa đọc có chấm trạng thái và nền nhấn mạnh; thông báo đã đọc hiển thị trung tính.
- Bấm một thông báo chưa đọc gọi API đánh dấu đã đọc, cập nhật ngay danh sách và badge, đóng dropdown, rồi điều hướng nếu loại tài nguyên có route tương ứng.
- Bấm thông báo đã đọc không gọi lại API đánh dấu đã đọc.
- Nút `Xem tất cả thông báo` ở cuối dropdown dẫn tới `/portal/notifications`.
- Trên mobile, dropdown nằm gọn trong viewport và không che nút menu ngoài mức cần thiết.

## Dữ liệu và xử lý lỗi

- Dùng `api` client hiện có với `GET /api/notifications?page=1&limit=10`.
- Dùng `PATCH /api/notifications/:id/read` để đánh dấu đã đọc.
- Lỗi tải danh sách được hiển thị trong dropdown với nội dung thân thiện và tùy chọn thử lại; không phát toast lặp lại mỗi lần mở.
- Lỗi đánh dấu đã đọc dùng `useToast()` và `errorMessage(error)`. Khi lỗi, giữ dropdown mở và không điều hướng để người dùng biết thao tác chưa hoàn tất.
- Dropdown tải dữ liệu khi component mount để badge xuất hiện mà không cần người dùng mở menu. Không polling trong phạm vi này.

## Accessibility

- Nút chuông dùng `aria-haspopup`, `aria-expanded` và nhãn động theo số chưa đọc.
- Dropdown có tên truy cập rõ ràng.
- Có thể thao tác bằng bàn phím; focus-visible theo design token hiện có.
- `Escape` đóng dropdown và trả focus về nút chuông.
- Icon trang trí được ẩn khỏi accessibility tree.

## Styling

- Toàn bộ UI mới dùng Tailwind CSS v4 với class tĩnh, tái sử dụng token trong `frontend/src/index.css`.
- Không thêm inline style, CSS module hoặc framework CSS mới.
- Có trạng thái hover, active, focus-visible và `motion-reduce` cho phần tử tương tác.

## Kiểm chứng

- Không thêm file test mới vì người dùng chưa yêu cầu kiểm thử mới.
- Chạy typecheck/build và bộ test hiện có liên quan tới `AppShell` và `NotificationCenter`.
- Kiểm tra thủ công các trạng thái: có/chưa có thông báo, badge `99+`, đóng bằng click ngoài và `Escape`, đánh dấu đã đọc, điều hướng, mobile viewport và lỗi API.

## Ngoài phạm vi

- Thông báo realtime, polling định kỳ hoặc push notification.
- Đánh dấu tất cả đã đọc.
- Xóa thông báo.
- Thay đổi backend hoặc schema thông báo.
