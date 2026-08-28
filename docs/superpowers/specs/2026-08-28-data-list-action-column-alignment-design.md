# DataList Action Column Alignment Design

## Mục tiêu

Căn đúng tiêu đề và các nút trong cột **Thao tác** của bảng Giáo án của tôi, đồng thời chuẩn hóa hành vi này cho mọi bảng dùng `DataList`.

## Thiết kế được duyệt

- Tiêu đề cột Thao tác và ô dữ liệu thao tác cùng căn phải.
- Cột thao tác có chiều rộng theo nội dung thay vì kéo giãn theo phần trống của bảng.
- Nhóm nút thao tác không xuống dòng trên giao diện bảng desktop.
- Giao diện card mobile giữ nguyên khả năng hiển thị phù hợp với chiều rộng màn hình.
- Dùng Tailwind CSS v4 trực tiếp trong `DataList`; không thêm CSS global mới.

## Phạm vi file

- Sửa `frontend/src/components/ui/DataList.tsx` để gắn class riêng cho `th` và `td` thao tác.
- Sửa `frontend/src/components/workouts/WorkoutTemplateList.tsx` để nhóm nút của giáo án dùng `flex-nowrap` ở bảng; không thay đổi hành động Sửa, Lưu trữ hoặc Xóa.
- Bổ sung kiểm thử component xác nhận cột và nhóm nút có class căn chỉnh cần thiết.

## Kiểm thử

- Test `MyWorkoutPlans` xác nhận tiêu đề/ô Thao tác căn phải và nhóm nút không wrap.
- Chạy lint các file thay đổi và Vite production build.
