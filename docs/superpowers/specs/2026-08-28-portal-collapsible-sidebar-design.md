# Portal Collapsible Sidebar Design

## Mục tiêu

Bổ sung khả năng thu gọn thanh điều hướng bên trái của portal trên desktop để tăng diện tích hiển thị nội dung mà vẫn giữ các mục điều hướng luôn sẵn dùng.

## Phạm vi

- Áp dụng cho `AppShell` của portal trên màn hình rộng hơn 800px.
- Sidebar mở rộng giữ chiều rộng hiện tại là 240px.
- Sidebar thu gọn còn khoảng 72px và hiển thị các icon điều hướng.
- Drawer và nút Menu trên mobile giữ nguyên hành vi hiện tại.

## Hành vi giao diện

- Một nút mũi tên nằm sát cạnh phải, ở vùng phía trên của sidebar.
- Khi sidebar đang mở rộng, nút hướng sang trái và có nhãn truy cập “Thu gọn menu”.
- Khi sidebar đang thu gọn, nút hướng sang phải và có nhãn truy cập “Mở rộng menu”.
- Khi thu gọn, giao diện ẩn tên thương hiệu, phụ đề thương hiệu, tiêu đề nhóm, nhãn mục điều hướng, tên người dùng, vai trò và chữ “Đăng xuất”.
- Logo, icon điều hướng và icon đăng xuất vẫn hiển thị, được căn giữa và vẫn thao tác được.
- Mỗi mục chỉ còn icon phải có tên truy cập và tooltip trình duyệt để người dùng nhận biết chức năng.
- Mục điều hướng đang hoạt động vẫn có trạng thái nổi bật rõ ràng.
- Sidebar và vùng nội dung thay đổi chiều rộng bằng chuyển động ngắn. Thiết lập `prefers-reduced-motion` hiện có tiếp tục vô hiệu hóa chuyển động khi người dùng yêu cầu.

## Trạng thái và lưu trữ

- `AppShell` quản lý trạng thái thu gọn độc lập với trạng thái mở drawer trên mobile.
- Trạng thái được lưu trong `localStorage` bằng một khóa dành riêng cho portal.
- Lần đầu truy cập mặc định sidebar mở rộng.
- Nếu dữ liệu lưu trữ không tồn tại hoặc không hợp lệ, giao diện dùng trạng thái mặc định và không làm gián đoạn render.

## Khả năng truy cập

- Nút thu gọn là phần tử `button` có `type="button"`.
- Nút cập nhật `aria-label`, `title` và `aria-expanded` theo trạng thái.
- Sidebar thu gọn không loại bỏ tên truy cập của các liên kết và nút hành động.
- Điều hướng bằng bàn phím và focus ring hiện tại được giữ nguyên.

## Cấu trúc thay đổi

- `frontend/src/components/AppShell.tsx`: thêm trạng thái thu gọn, đồng bộ `localStorage`, nút điều khiển và thuộc tính truy cập.
- `frontend/src/index.css`: thêm biến thể layout/sidebar thu gọn, căn chỉnh icon, ẩn nhãn và chuyển động responsive.
- Không thay đổi API, cấu hình điều hướng hoặc chức năng đăng xuất.

## Xử lý lỗi

- Đọc hoặc ghi `localStorage` được bảo vệ để sidebar vẫn hoạt động nếu trình duyệt chặn lưu trữ.
- Không sử dụng dữ liệu lưu trữ để điều khiển drawer mobile.

## Xác minh

- Chạy typecheck/build hiện có của frontend hoặc toàn dự án.
- Kiểm tra thủ công hai trạng thái trên desktop, tải lại trang để xác nhận ghi nhớ, điều hướng và đăng xuất khi thu gọn.
- Kiểm tra breakpoint mobile để xác nhận drawer, overlay và nút đóng không bị ảnh hưởng.
- Không thêm file test tự động vì quy chuẩn frontend của dự án chỉ yêu cầu viết test khi người dùng yêu cầu cụ thể.
