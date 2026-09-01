# Progress Detail Tabs Design

## Mục tiêu

Làm rõ cấu trúc modal “Xem tiến độ” của một khách hàng. Thay vì render toàn bộ hành trình thành các khối nội dung nối tiếp, modal sẽ có thanh tab rõ ràng và chỉ hiển thị panel của tab đang chọn.

## Nguyên nhân hiện tại

`ProgressDetailModal` đang render `CustomerJourney`. Component này không quản lý tab mà lần lượt render tổng quan, lịch, buổi tập, biểu đồ, thành tích, ảnh, giáo án và báo cáo trong cùng một trang cuộn. Vì vậy người dùng thấy các tiêu đề và nội dung nằm sát nhau, không có trạng thái chọn hoặc ranh giới panel rõ ràng.

## Thiết kế đã chọn

`CustomerJourney` trở thành workspace chi tiết chỉ đọc với bảy tab:

1. Tổng quan.
2. Lịch & buổi tập.
3. Chỉ số cơ thể.
4. Thành tích.
5. Ảnh tiến độ.
6. Giáo án.
7. Báo cáo.

Tab mặc định là “Tổng quan”. Thanh tab dùng cùng ngôn ngữ giao diện với module Tiến độ hiện có: nền slate nhạt, tab đang chọn là thẻ trắng có shadow nhẹ, tab không chọn có hover và focus-visible rõ ràng. Trên màn hình hẹp, thanh tab cuộn ngang và không làm tràn modal.

## Cấu trúc panel

- Mỗi thời điểm chỉ render nội dung của một tab.
- Vùng nội dung tab dùng bề mặt card rõ ràng thông qua `ProgressSection` hoặc component con đã có bề mặt tương đương.
- “Tổng quan” hiển thị snapshot analytics và chất lượng dữ liệu.
- “Lịch & buổi tập” chứa hai section riêng: lịch tập và các buổi đã ghi nhận.
- “Chỉ số cơ thể” hiển thị biểu đồ tiến độ hiện có.
- “Thành tích” dùng `AchievementList`.
- “Ảnh tiến độ” dùng gallery card; khi trống phải có empty state.
- “Giáo án” tách giáo án hiện tại và lịch sử thành các card; khi trống phải có empty state.
- “Báo cáo” dùng danh sách báo cáo chỉ đọc hiện có.

Modal “Ghi nhận buổi tập” vẫn là luồng riêng. Modal “Xem tiến độ” không thêm form, API mutation hoặc quyền chỉnh sửa.

## Accessibility và responsive

- Thanh điều hướng có `role="tablist"` và accessible name.
- Mỗi nút có `role="tab"`, `aria-selected` và liên kết tới panel bằng `aria-controls`.
- Panel có `role="tabpanel"`, `aria-labelledby` và chỉ một panel xuất hiện tại một thời điểm.
- Tab hỗ trợ focus-visible, vùng bấm tối thiểu 44px và `motion-reduce`.
- Thanh tab cuộn ngang trên mobile; panel giữ khoảng cách và padding phù hợp trong modal.

## Data flow và error handling

Không thay đổi data flow. `ProgressPage` vẫn tải `CustomerJourneyDto`, `ProgressDetailModal` vẫn xử lý loading/error, và `CustomerJourney` chỉ quản lý `activeTab` ở mức UI cục bộ. Đóng rồi mở lại modal sẽ mount lại journey và trở về tab “Tổng quan”.

## Kiểm thử

Theo TDD, cập nhật test component trước để chứng minh hành vi mong muốn:

- Có đủ bảy tab với semantic role chính xác.
- Mặc định chỉ panel “Tổng quan” hiển thị.
- Chọn từng tab sẽ ẩn panel trước và hiển thị đúng nội dung tương ứng.
- Ảnh, giáo án và báo cáo vẫn render đúng trong tab của chúng.
- Empty state xuất hiện khi collection tương ứng không có dữ liệu.
- Focused component test, test Progress liên quan, typecheck và build phải pass.

## Ngoài phạm vi

- Không thay đổi endpoint, DTO hoặc phép tính analytics.
- Không đưa form ghi buổi tập, nhập số đo hoặc tạo báo cáo vào modal xem chi tiết.
- Không sửa tab `/me/progress` của hội viên.
- Không thêm global CSS, CSS module hoặc inline style; toàn bộ thay đổi dùng Tailwind và token hiện có trong `index.css`.
