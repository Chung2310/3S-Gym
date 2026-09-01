# Workout Template Picker Spacing Design

## Mục tiêu

Làm popup **Chọn giáo án mẫu** thoáng hơn và giảm cảm giác khung bo sát nội dung, không thay đổi luồng tải, chọn hoặc gán giáo án.

## Thiết kế được duyệt

- Giữ popup căn giữa và responsive trên màn hình nhỏ.
- Chiều rộng desktop tối đa khoảng 560px; chừa lề an toàn trên mobile.
- Tăng padding khung nội dung từ 20px lên 24px trên desktop, dùng padding nhỏ hơn trên mobile.
- Giảm bo góc popup từ 16px xuống 12px.
- Giảm bo góc từng thẻ giáo án từ 12px xuống 8px.
- Tăng khoảng đệm trong thẻ và khoảng cách giữa tiêu đề, danh sách, footer.
- Giữ kiểu nút Hủy và Xác nhận gán theo design system hiện tại.

## Phạm vi

Chỉ sửa `WorkoutTemplatePickerModal`. Không thay đổi API, trạng thái lựa chọn, nghiệp vụ gán giáo án hoặc modal dùng chung.

## Kiểm thử

- Bổ sung kiểm thử class/layout chính của dialog để ngăn việc quay lại mức bo góc quá lớn.
- Chạy lại test tab giáo án khách hàng, lint file thay đổi và build frontend.
