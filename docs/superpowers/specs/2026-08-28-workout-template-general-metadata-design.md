# Workout Template General Metadata Design

## Mục tiêu

Bổ sung metadata chung cho giáo án trong Studio mà không trộn với thuộc tính riêng của từng bài tập và không làm header chật hơn.

## Trường dữ liệu

Các trường đều không bắt buộc:

- `muscleGroups: string[]`: nhiều nhóm cơ.
- `level`: tái sử dụng cấp độ giáo án hiện có (`BEGINNER`, `INTERMEDIATE`, `ADVANCED`).
- `defaultSets?: number`: số hiệp mô tả chung.
- `defaultReps?: string`: số lần lặp mô tả chung, ví dụ `8-12`.
- `defaultWeight?: string`: mức tạ mô tả chung, ví dụ `20kg` hoặc `60-70% 1RM`.
- `defaultTempo?: string`: tempo mô tả chung, ví dụ `3-1-1-0`.
- `technicalNotes?: string`: ghi chú kỹ thuật chung.

Không thêm Rest chung. Khoảng nghỉ thực tế được thể hiện bằng vị trí các thẻ bài tập trên timeline. `restSeconds` của từng bài tập được giữ để tương thích dữ liệu hiện tại.

Các trường `default*` chỉ là metadata mô tả giáo án; không tự điền hoặc ghi đè thuộc tính của bài tập khi kéo vào Studio.

## Bố cục Studio

Cột phải được tăng từ khoảng 190px lên 260px và có hai tab:

1. **Giáo án**: hiển thị form metadata chung.
2. **Bài tập**: hiển thị inspector bài tập hiện có.

Khi PT chọn một thẻ trên timeline, Studio tự chuyển sang tab Bài tập. Khi đóng/bỏ chọn inspector, Studio quay về tab Giáo án. Ở chế độ chỉ xem, mọi input bị disabled.

Cột trái tiếp tục chỉ chứa thư viện bài tập và bộ lọc.

## Backend và snapshot khách hàng

- `WorkoutTemplate` lưu các trường metadata mới.
- Validator create/update chấp nhận trường tùy chọn, giới hạn độ dài hợp lý và kiểm tra `defaultSets` là số nguyên dương.
- `WorkoutPlan` lưu cùng các trường.
- Khi gán template cho khách, service sao chép đầy đủ metadata sang snapshot.
- Khi chỉnh giáo án riêng của khách, metadata được phép cập nhật mà không sửa template nguồn.
- Giáo án cũ không có metadata vẫn đọc và sửa bình thường nhờ giá trị mặc định rỗng.

## Kiểm thử

- Backend: tạo/cập nhật template với metadata; gán cho khách và xác nhận snapshot sao chép đủ; sửa snapshot không ảnh hưởng template.
- Frontend: tải metadata vào Studio, chỉnh ở tab Giáo án, payload lưu chứa đúng dữ liệu; chọn bài tập tự chuyển tab.
- Chạy regression test workout, lint, typecheck và production build; báo riêng lỗi tồn tại sẵn ngoài phạm vi.
