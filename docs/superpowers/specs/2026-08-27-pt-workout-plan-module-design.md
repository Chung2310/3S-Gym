# Thiết kế module Giáo án dành cho PT

## Mục tiêu

Tách chức năng xây dựng và quản lý giáo án khỏi luồng check-in buổi tập. PT có một mục **Giáo án** riêng trong menu để tạo giáo án mẫu, tái sử dụng mẫu cho khách hàng, cá nhân hóa nội dung và kiểm soát việc công bố. Các thao tác ghi nhận buổi tập và xem lịch sử được đặt trong module **Tiến độ**.

## Phạm vi

### Trong phạm vi

- Thêm mục menu PT **Giáo án** tại `/portal/pt/workout-plans`.
- Quản lý giáo án mẫu thuộc riêng PT.
- Tạo giáo án khách hàng từ giáo án mẫu và chỉnh sửa trước khi lưu.
- Quản lý vòng đời giáo án khách hàng: nháp, công bố, thu hồi và xóa.
- Chuyển form check-in và lịch sử buổi tập sang trang **Tiến độ**.
- Sử dụng các API backend hiện có.

### Ngoài phạm vi

- Thay đổi schema hoặc API backend.
- AI tự động sinh giáo án.
- Tự động công bố giáo án khi tạo từ mẫu.
- Thay đổi nội dung giáo án đã lưu chỉ vì giáo án mẫu nguồn được cập nhật sau đó.

## Điều hướng và phân quyền

- Menu PT hiển thị mục **Giáo án**, dùng biểu tượng clipboard.
- Route chính: `/portal/pt/workout-plans`.
- Route được bảo vệ cho vai trò `PT` và feature `EXERCISE_LIBRARY`.
- Mục **Tiến độ** tiếp tục dùng feature `PROGRESS`.
- Route cũ `/portal/pt/workouts` chuyển hướng đến `/portal/pt/workout-plans` để tránh làm hỏng bookmark hoặc liên kết cũ.
- PT chỉ thấy giáo án mẫu do chính mình sở hữu và giáo án của khách đang thuộc quyền quản lý của mình; backend tiếp tục là lớp thực thi phân quyền cuối cùng.

## Cấu trúc giao diện

Trang **Giáo án** có hai tab.

### Tab Giáo án mẫu

- Hiển thị danh sách có phân trang và lọc theo trạng thái.
- Cho phép tạo mẫu gồm tên, mục tiêu, cấp độ, nhiều buổi và nhiều bài tập.
- Cho phép sửa mẫu; backend tăng version theo hành vi hiện có.
- Cho phép lưu trữ mẫu đang hoạt động.
- Chỉ cho phép xóa mẫu đã lưu trữ; lỗi do mẫu đã có lịch sử tập được hiển thị bằng toast.
- Mỗi mẫu có thao tác **Gán cho khách**.

### Tab Giáo án khách hàng

- Hiển thị danh sách giáo án theo khách và trạng thái `DRAFT`/`PUBLISHED`.
- Cho phép tạo trực tiếp hoặc khởi tạo từ một giáo án mẫu.
- Form gồm khách hàng, tiêu đề, ngày bắt đầu, ngày kết thúc, các buổi và bài tập.
- Khi khởi tạo từ mẫu, frontend sao chép dữ liệu buổi và bài tập vào form. Bản lưu là dữ liệu độc lập; cập nhật mẫu sau này không tự thay đổi giáo án khách hàng.
- Giáo án mới luôn được lưu ở trạng thái nháp.
- PT có thể sửa, công bố, thu hồi hoặc xóa theo API hiện có.
- Chỉ giáo án đã công bố xuất hiện trong cổng thông tin khách hàng.

## Module Tiến độ

- Loại bỏ `WorkoutCheckIn` và `WorkoutSessionHistory` khỏi trang Giáo án.
- Đưa form check-in và lịch sử buổi tập vào trang `/portal/pt/progress`.
- Check-in tiếp tục chọn giáo án mẫu, buổi tập và lưu snapshot theo hành vi backend hiện tại.
- Không thay đổi API check-in hoặc dữ liệu lịch sử.

## Luồng dữ liệu

### Tạo giáo án mẫu

1. PT mở tab Giáo án mẫu và nhập nội dung.
2. Frontend gửi `POST /api/workout-templates`.
3. Sau khi thành công, danh sách được tải lại và hiển thị toast.

### Gán mẫu cho khách

1. PT chọn **Gán cho khách** trên một mẫu.
2. Frontend mở form giáo án khách hàng với các buổi và bài tập đã được sao chép.
3. PT chọn khách, nhập thời gian áp dụng và cá nhân hóa nội dung.
4. Frontend gửi `POST /api/workout-plans`.
5. Giáo án được lưu ở trạng thái nháp và không tự động hiển thị cho khách.

### Công bố

1. PT chọn công bố một giáo án khách hàng đang ở trạng thái nháp.
2. Frontend yêu cầu xác nhận.
3. Frontend gửi `PATCH /api/workout-plans/:id/publish`.
4. Danh sách được tải lại và khách có thể xem phiên bản đã công bố.

## Thành phần frontend

- `WorkoutPlanWorkspace`: bố cục trang và điều phối hai tab.
- `WorkoutTemplatePanel`: bao gồm builder và danh sách giáo án mẫu.
- `CustomerWorkoutPlanPanel`: danh sách, bộ lọc và các thao tác vòng đời giáo án khách hàng.
- `CustomerWorkoutPlanModal`: form tạo/sửa trực tiếp hoặc từ template.
- Các component check-in/lịch sử hiện có được tái sử dụng trong trang Tiến độ thay vì viết lại.

Các component mới chỉ phụ thuộc vào lớp `api`, toast và kiểu dữ liệu dùng chung. Việc sao chép template sang form được đặt trong một hàm ánh xạ thuần để có thể kiểm thử độc lập.

## Xử lý lỗi

- Lỗi tải danh sách hiển thị toast và giữ trang ở trạng thái có thể thử lại.
- Lỗi validation từ backend được hiển thị bằng cơ chế `errorMessage` hiện có.
- Nút gửi bị vô hiệu hóa trong khi request đang chạy để tránh ghi trùng.
- Modal chỉ đóng sau khi lưu thành công; khi lỗi, dữ liệu người dùng đã nhập được giữ nguyên.
- Thao tác xóa, công bố và thu hồi phải có bước xác nhận.

## Kiểm thử và tiêu chí hoàn thành

- Navigation test xác nhận PT thấy mục **Giáo án** khi `EXERCISE_LIBRARY` bật.
- Routing test xác nhận route mới render module và route cũ chuyển hướng đúng.
- Component test xác nhận trang Giáo án không còn form check-in hoặc lịch sử.
- Test builder xác nhận tạo và sửa giáo án mẫu gọi đúng endpoint.
- Test ánh xạ xác nhận tạo từ mẫu sao chép đầy đủ các buổi và bài tập nhưng không chia sẻ tham chiếu mutable.
- Test giáo án khách hàng xác nhận lưu nháp, sửa, công bố, thu hồi và xóa gọi đúng endpoint, làm mới danh sách và hiển thị phản hồi.
- Test trang Tiến độ xác nhận form check-in và lịch sử buổi tập được render tại đó.
- Chạy toàn bộ test frontend, typecheck/build và các kiểm tra liên quan trước khi hoàn thành.

## Quyết định thiết kế

- Tách **Giáo án** và **Tiến độ** theo trách nhiệm nghiệp vụ, không chỉ đổi nhãn menu.
- Giữ cả giáo án mẫu và giáo án theo khách vì hai model/API đã tồn tại và phục vụ hai nhu cầu khác nhau.
- Sao chép dữ liệu mẫu tại thời điểm gán để việc chỉnh sửa mẫu về sau không làm thay đổi giáo án đã cá nhân hóa.
- Không bổ sung backend trong phạm vi này; nếu kiểm thử tích hợp phát hiện API hiện có không bảo đảm quyền PT với giáo án khách hàng, vấn đề đó sẽ được báo cáo và tách thành thay đổi backend có chủ đích.
