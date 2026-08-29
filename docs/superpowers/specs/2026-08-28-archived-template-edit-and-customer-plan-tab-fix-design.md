# Thiết kế sửa giáo án lưu trữ và tab giáo án khách hàng

## Mục tiêu

Cho phép PT sửa giáo án mẫu ở mọi trạng thái và loại bỏ hoàn toàn giao diện quản lý giáo án khách hàng cũ khỏi trang Khách hàng. Việc gán giáo án chỉ diễn ra trong tab `Giáo án` thuộc chi tiết một khách hàng cụ thể.

## Giáo án mẫu lưu trữ

- Giáo án `ACTIVE` và `ARCHIVED` đều hiển thị thao tác `Sửa`.
- Cả hai trạng thái đều mở cùng Workout Studio và dùng cùng API cập nhật.
- Backend cho phép PATCH giáo án thuộc quyền sở hữu của PT mà không lọc trạng thái.
- Sau khi sửa, trạng thái hiện tại được giữ nguyên. Giáo án `ARCHIVED` không tự chuyển thành `ACTIVE`.
- Việc sửa tiếp tục tăng `version` và bảo toàn lịch kéo-thả, bài chưa xếp lịch và thuộc tính legacy.
- Quy tắc xóa không đổi: chỉ giáo án đã lưu trữ mới được xóa nếu không vướng dữ liệu sử dụng.

## Tab giáo án khách hàng

- Xóa tab cấp cao `Giáo án` khỏi `PtView`/`PortalViews`; tab này đang dùng giao diện CRUD nội dung cũ.
- Danh sách khách hàng vẫn là điểm vào duy nhất.
- Sau khi mở chi tiết khách hàng, tab `Giáo án` mới hiển thị `CustomerWorkoutPlanTab`.
- Empty state có nút `Gán giáo án`, mở `WorkoutTemplatePickerModal`.
- Popup gọi danh sách giáo án mẫu thật, mặc định lấy mẫu `ACTIVE`; không dùng form tạo giáo án khách hàng cũ.
- Khi xác nhận, backend sao chép đầy đủ `title`, `goal`, `level`, `durationDays`, `scheduledExercises`, `unscheduledExercises` và `sessions` vào snapshot khách hàng.
- Sau khi gán thành công, tab cập nhật thẻ giáo án active ngay và có nút `Mở Studio`.
- Sửa snapshot khách hàng không sửa mẫu nguồn.

## Dọn luồng cũ

- Không render resource `workout-plans` trong danh sách tab cấp cao của PT.
- `ContentFormModal` cũ vẫn có thể tồn tại cho dữ liệu legacy khác nhưng không còn là điểm vào gán giáo án khách hàng.
- Route `/pt/customer-workout-plans` tiếp tục chuyển hướng về `/pt/customers`.

## Kiểm thử

- Danh sách mẫu hiển thị `Sửa` cho giáo án `ARCHIVED`.
- PATCH giáo án archived thành công và giữ nguyên `status: ARCHIVED`.
- Trang Khách hàng không còn tab cấp cao `Giáo án`.
- Modal chi tiết khách có tab `Giáo án` mới.
- Popup tải mẫu thật, gán template ID và hiển thị snapshot được trả về.
- Snapshot chứa đầy đủ lịch đã xếp, bài chưa xếp và sessions của mẫu tại thời điểm gán.
- Hồi quy route cũ, Customer Studio và phân quyền vẫn qua.
