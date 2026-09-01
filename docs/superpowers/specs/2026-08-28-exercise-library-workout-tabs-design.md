# Thư viện bài tập trong Giáo án của tôi

## Mục tiêu

Gộp “Thư viện bài tập” vào module “Giáo án của tôi” dưới dạng tab, giúp PT quản lý giáo án và nguồn bài tập tại một nơi. Các chức năng tạo, sửa, lọc và phân trang hiện có được giữ nguyên.

## Phạm vi

- Trang `/pt/my-workout-plans` có hai tab: “Giáo án của tôi” và “Thư viện bài tập”.
- Tab đang chọn được lưu trong query parameter `tab`.
- Sidebar bỏ mục “Thư viện bài tập” riêng và giữ mục “Giáo án của tôi”.
- Route cũ `/pt/exercises` chuyển hướng sang `/pt/my-workout-plans?tab=exercises`.
- Không thay đổi API, quyền truy cập, dữ liệu giáo án hoặc dữ liệu bài tập.

## Điều hướng và URL

- `/pt/my-workout-plans` và `/pt/my-workout-plans?tab=plans` hiển thị tab “Giáo án của tôi”.
- `/pt/my-workout-plans?tab=exercises` hiển thị tab “Thư viện bài tập”.
- Giá trị `tab` không hợp lệ được chuẩn hóa về tab “Giáo án của tôi”.
- Việc chọn tab cập nhật URL, vì vậy tải lại trang, Back và Forward giữ đúng ngữ cảnh.
- Các route tạo/sửa giáo án hiện tại như `/pt/my-workout-plans/new` và `/pt/my-workout-plans/:templateId/edit` không thay đổi.

## Kiến trúc giao diện

Trang “Giáo án của tôi” chịu trách nhiệm đọc query parameter và lắp ráp thanh tab với nội dung tương ứng. Nội dung danh sách giáo án và thư viện bài tập được tái sử dụng từ các component hiện có; state tải dữ liệu, modal CRUD, bộ lọc và phân trang vẫn nằm trong đơn vị phụ trách hiện tại.

Thanh tab dùng semantic `role="tablist"`, mỗi nút dùng `role="tab"`, `aria-selected` và trạng thái focus rõ ràng. Styling mới dùng Tailwind và các token hiện có của dự án.

## Luồng dữ liệu

1. Router mở trang `/pt/my-workout-plans`.
2. Trang đọc `tab` từ `useSearchParams`.
3. Trang render danh sách giáo án khi tab là `plans` hoặc bị thiếu; render thư viện khi tab là `exercises`.
4. Khi người dùng chọn tab, trang cập nhật query parameter mà không thay đổi API của nội dung con.
5. Route `/pt/exercises` dùng `Navigate` với `replace` đến tab thư viện mới.

## Khả năng tương thích và lỗi

- Bookmark cũ tiếp tục hoạt động thông qua redirect.
- Feature flag `EXERCISE_LIBRARY` và quyền PT hiện tại tiếp tục bảo vệ toàn bộ module.
- Lỗi tải giáo án hoặc bài tập tiếp tục hiển thị theo cơ chế Toast hiện có của từng nội dung.
- Không render đồng thời cả hai nội dung, tránh gọi API không cần thiết cho tab chưa mở.

## Kiểm thử

- Navigation config chỉ còn mục “Giáo án của tôi”, không còn mục thư viện riêng.
- Trang mặc định hiển thị tab và nội dung “Giáo án của tôi”.
- Chọn “Thư viện bài tập” cập nhật URL và hiển thị nội dung thư viện.
- Mở trực tiếp `?tab=exercises` hiển thị đúng tab.
- Route `/pt/exercises` redirect đến URL mới.
- Route tạo và sửa giáo án tiếp tục hoạt động như trước.

## Ngoài phạm vi

- Gộp “Giáo án khách hàng” vào cùng trang.
- Thay đổi giao diện hoặc nghiệp vụ CRUD của thư viện bài tập.
- Thay đổi backend hoặc schema dữ liệu.
