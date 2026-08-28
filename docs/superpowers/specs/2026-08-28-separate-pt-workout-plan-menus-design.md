# Thiết kế tách module giáo án của PT

## Mục tiêu

Tách trang **Giáo án** hiện đang chứa hai tab thành hai module độc lập trên menu PT. Việc tách giúp phân biệt rõ nghiệp vụ xây dựng thư viện giáo án riêng của PT với nghiệp vụ cá nhân hóa và công bố giáo án cho khách hàng.

Thiết kế này kế thừa nghiệp vụ và API đã được mô tả trong `2026-08-27-pt-workout-plan-module-design.md`; phạm vi thay đổi tập trung vào điều hướng, ranh giới component và luồng gán giáo án giữa hai module.

## Phạm vi

### Trong phạm vi

- Thay mục menu **Giáo án** bằng **Giáo án của tôi** và **Giáo án khách hàng**.
- Tách hai tab hiện tại thành hai route và hai entry component độc lập.
- Cho phép chuyển từ một giáo án mẫu sang form tạo giáo án khách hàng bằng `templateId` trên URL.
- Giữ tương thích cho các route giáo án cũ bằng chuyển hướng.
- Giữ nguyên phân quyền PT, feature flag `EXERCISE_LIBRARY`, API và model backend hiện có.
- Cập nhật các kiểm thử frontend đang bao phủ menu, route và workspace giáo án.

### Ngoài phạm vi

- Thay đổi schema hoặc API backend.
- Thay đổi vòng đời giáo án mẫu hoặc giáo án khách hàng.
- Thêm AI sinh giáo án.
- Thay đổi module Tiến độ, check-in hoặc cổng thông tin khách hàng.
- Thiết kế lại toàn bộ hệ thống giao diện ngoài những component liên quan trực tiếp.

## Điều hướng

Menu PT trong nhóm **Vận hành** có hai mục:

1. **Giáo án của tôi** tại `/pt/my-workout-plans`.
2. **Giáo án khách hàng** tại `/pt/customer-workout-plans`.

Cả hai route chỉ dành cho vai trò `PT` và được bảo vệ bởi feature `EXERCISE_LIBRARY`. Hai mục đều hỗ trợ nhận diện route con để trạng thái active trên sidebar nhất quán.

Các route cũ được giữ dưới dạng chuyển hướng:

- `/pt/workout-plans` và mọi route con tương ứng chuyển tới `/pt/my-workout-plans`.
- `/pt/workouts` chuyển tới `/pt/my-workout-plans`.

## Cấu trúc module

### Giáo án của tôi

Module này sở hữu toàn bộ giao diện xây dựng và quản lý giáo án mẫu của PT:

- Tiêu đề, mô tả nghiệp vụ riêng.
- Trình tạo hoặc chỉnh sửa giáo án mẫu.
- Danh sách giáo án mẫu và các bộ lọc hiện có.
- Các thao tác sửa, lưu trữ, xóa và **Gán cho khách hàng**.

Component entry mới điều phối `WorkoutBuilder` và `WorkoutTemplateList`. Nó giữ state chỉnh sửa và refresh danh sách như `WorkoutWorkspace` hiện tại, nhưng không chứa tab hoặc state của giáo án khách hàng.

### Giáo án khách hàng

Module này sở hữu toàn bộ giao diện quản lý giáo án đã hoặc sẽ được cá nhân hóa cho học viên:

- Tiêu đề, mô tả nghiệp vụ riêng.
- Bộ lọc theo khách hàng và trạng thái.
- Danh sách giáo án khách hàng.
- Tạo mới, sửa, công bố, thu hồi và xóa.
- Tiếp nhận giáo án mẫu từ module **Giáo án của tôi**.

Component entry mới điều phối `CustomerWorkoutPlanPanel` và việc đọc tham số `templateId`. Panel và modal hiện có tiếp tục được tái sử dụng.

## Luồng gán giáo án cho khách hàng

1. PT bấm **Gán cho khách hàng** trên một giáo án tại module **Giáo án của tôi**.
2. Frontend điều hướng tới `/pt/customer-workout-plans?templateId=<id>`.
3. Module đích gọi `GET /api/workout-templates/:id` để tải dữ liệu mới nhất và để backend tiếp tục xác thực quyền sở hữu.
4. Dữ liệu được chuyển thành `CustomerWorkoutPlanDraft` bằng hàm ánh xạ thuần hiện có.
5. Module mở form tạo giáo án khách hàng với các buổi và bài tập đã được sao chép; PT chọn khách hàng, thời gian áp dụng và tùy chỉnh nội dung.
6. Ngay sau khi template được tiếp nhận thành công, frontend thay URL bằng `/pt/customer-workout-plans` để refresh hoặc đóng rồi mở lại không tự động khởi tạo form lần nữa.
7. Khi PT lưu, luồng `POST /api/workout-plans` hiện tại được sử dụng và danh sách được tải lại.

Nếu PT tự mở module **Giáo án khách hàng** mà không có `templateId`, trang hoạt động như hiện tại và không tự mở form.

## Trạng thái và xử lý lỗi

- Trong lúc tải template, thao tác khởi tạo không được thực hiện lặp lại.
- Nếu template không tồn tại, đã bị xóa, hoặc không thuộc PT hiện tại, frontend hiển thị thông báo qua `useToast()` và `errorMessage(error)`; module giáo án khách hàng vẫn sử dụng được.
- Sau lỗi tải template, tham số `templateId` cũng được loại bỏ khỏi URL để tránh lặp request khi refresh.
- Form chỉ lưu giáo án khách hàng khi người dùng chủ động xác nhận; việc chuyển module không tự tạo dữ liệu.
- Dữ liệu template được sao chép sang draft độc lập. Chỉnh sửa template về sau không làm thay đổi giáo án khách hàng đã lưu.
- Feature flag tắt hoặc người dùng không phải PT tiếp tục được xử lý bởi `FeatureRoute`.

## Quy chuẩn giao diện

- UI mới hoặc được sửa sử dụng Tailwind CSS v4 và token trong `frontend/src/index.css`.
- Component dùng chung tiếp tục nằm trong `frontend/src/components/ui/`.
- Mọi `input` và `textarea` liên quan được sửa trong phạm vi này phải có placeholder hướng dẫn rõ ràng.
- Các trạng thái hover, focus-visible, disabled, responsive và motion-reduce được khai báo bằng utility Tailwind khi có tương tác tương ứng.
- API sử dụng client `api`; phản hồi thành công và lỗi sử dụng hệ thống toast hiện có.

## Kiểm thử và tiêu chí hoàn thành

- Navigation test xác nhận PT thấy đúng hai mục menu mới khi `EXERCISE_LIBRARY` bật và không còn mục **Giáo án** cũ.
- Routing test xác nhận hai route mới render đúng module và các route cũ chuyển hướng tới **Giáo án của tôi**.
- Test module **Giáo án của tôi** xác nhận builder và danh sách template được hiển thị, không hiển thị quản lý giáo án khách hàng.
- Test thao tác **Gán cho khách hàng** xác nhận điều hướng với đúng `templateId`.
- Test module **Giáo án khách hàng** xác nhận `templateId` hợp lệ được tải, ánh xạ thành draft, mở form và được loại khỏi URL sau khi tiếp nhận.
- Test lỗi tải template xác nhận toast được hiển thị, URL được làm sạch và trang vẫn hoạt động.
- Các test CRUD/công bố hiện có của `CustomerWorkoutPlanPanel` tiếp tục chạy thành công sau khi tách module.
- Chạy typecheck/build và bộ test frontend liên quan trước khi xác nhận hoàn thành.

## Quyết định thiết kế

- Dùng hai route cấp cao độc lập thay vì giữ tab hoặc route con để phản ánh đúng hai module nghiệp vụ trên menu.
- Dùng `templateId` trong query string thay vì router state để luồng gán vẫn hoạt động khi tải lại trang hoặc mở liên kết trong tab mới.
- Module đích tải lại template theo ID thay vì truyền toàn bộ dữ liệu qua URL, bảo đảm dữ liệu mới nhất và tái sử dụng kiểm tra quyền của backend.
- Giữ API backend hiện tại vì các endpoint cần thiết đã tồn tại.
- Giữ route cũ bằng redirect để không làm hỏng bookmark và liên kết đã lưu.
