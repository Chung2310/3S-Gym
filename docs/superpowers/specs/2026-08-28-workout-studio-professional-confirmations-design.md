# Workout Studio Professional Confirmations Design

## Mục tiêu

Thay các `window.confirm` trong luồng thao tác nội bộ của Workout Studio bằng popup xác nhận chuyên nghiệp dùng `ConfirmModal` chuẩn của hệ thống.

## Phạm vi

Ba trường hợp được thay thế:

1. **Bỏ thay đổi chưa lưu?** khi PT bấm nút Danh sách trong lúc Studio đang dirty.
2. **Rời Studio?** khi PT bấm một liên kết nội bộ khác trong lúc Studio đang dirty.
3. **Giảm số ngày giáo án?** khi giảm duration làm một số bài tập nằm ngoài khoảng ngày mới và phải chuyển về Chưa xếp lịch.

Sự kiện đóng tab, refresh hoặc đóng trình duyệt vẫn sử dụng `beforeunload` native vì trình duyệt không hỗ trợ modal React trong tình huống này.

## Thiết kế tương tác

- Studio giữ một state `pendingConfirmation` mô tả loại hành động và dữ liệu cần tiếp tục.
- Mỗi lần chỉ tồn tại một hành động chờ xác nhận.
- Hủy popup chỉ xóa state, không điều hướng và không thay đổi dữ liệu.
- Xác nhận sẽ xóa state trước, sau đó thực thi đúng hành động đã lưu.
- Với liên kết nội bộ, lưu pathname/search/hash đích và điều hướng bằng React Router sau khi xác nhận.
- Với giảm số ngày, chỉ sau xác nhận mới chuyển các bài bị cắt về Chưa xếp lịch.

## Nội dung popup

- Quay lại: tiêu đề `Bỏ thay đổi chưa lưu?`, mô tả dữ liệu chỉnh sửa chưa lưu sẽ bị mất, nút xác nhận `Bỏ thay đổi`.
- Link nội bộ: tiêu đề `Rời Studio?`, mô tả dữ liệu chỉnh sửa chưa lưu sẽ bị mất, nút xác nhận `Rời Studio`.
- Giảm ngày: tiêu đề `Giảm số ngày giáo án?`, mô tả động số bài sẽ chuyển về Chưa xếp lịch, nút xác nhận `Tiếp tục`.

## Kiểm thử

- Xác nhận popup xuất hiện thay vì gọi `window.confirm`.
- Hủy giữ nguyên route/duration và dữ liệu.
- Xác nhận thực hiện đúng điều hướng hoặc giảm ngày.
- Chạy toàn bộ test Studio, lint, typecheck và production build.
