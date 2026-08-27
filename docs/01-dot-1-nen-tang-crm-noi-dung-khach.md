# Đợt 1 — Nền tảng, CRM và nội dung cho khách

## Trạng thái triển khai CRUD popup

- Admin tạo/sửa PT bằng popup đầy đủ; xóa PT bằng popup xác nhận và chỉ được thực hiện khi PT không còn khách phụ trách.
- PT tạo/sửa khách, cấp tài khoản khách, tạo/sửa nội dung InBody, mục tiêu, giáo án, dinh dưỡng và yêu cầu chuyển PT bằng popup; không còn form CRUD nội tuyến trên trang danh sách.
- Popup giáo án cho thêm/xóa trực tiếp từng buổi và bài tập; popup dinh dưỡng cho thêm/xóa từng bữa ăn, không yêu cầu người dùng nhập JSON thô.
- Mỗi khách có popup quản lý gói PT riêng, hỗ trợ danh sách phân trang, tạo, sửa và xóa có xác nhận.
- Xóa khách là xóa cứng trong transaction, gồm hồ sơ, tài khoản khách và toàn bộ dữ liệu liên quan. Xóa PT chuyển quyền sở hữu nội dung lịch sử sang PT hiện tại của khách.
- Mọi thao tác xóa, công bố/thu hồi và nhận/từ chối chuyển khách đều dùng popup xác nhận; kết quả dùng Toast tiếng Việt.
- Các API danh sách có phân trang/bộ lọc; route có validate; response dùng mẫu chung và lỗi đi qua middleware production tập trung.

## 1. Mục tiêu và ranh giới

Đợt 1 đưa ứng dụng vào sử dụng nội bộ: Admin quản trị người dùng, PT quản lý khách và công bố dữ liệu cơ bản; khách đăng nhập để xem dữ liệu của mình.

Không thuộc Đợt 1: khách tự check-in, nhật ký ăn uống, check-in buổi tập, dashboard xếp hạng, cảnh báo tự động và chat AI.

## 2. Module A — Tài khoản, đăng nhập và phân quyền

### Chức năng

- Admin tạo tài khoản PT; PT có thể đổi mật khẩu.
- PT tạo hồ sơ khách và cấp tài khoản khách bằng email hoặc số điện thoại đăng nhập; khách đặt mật khẩu ở lần đầu truy cập.
- Đăng nhập, đăng xuất, quên/đặt lại mật khẩu và khoá/mở khoá tài khoản.
- Điều hướng và trang chủ theo từng vai trò.

### Dữ liệu tối thiểu

`User`: id, tên hiển thị, email/số điện thoại, mật khẩu đã băm, role (`admin|pt|customer`), trạng thái, PT liên kết với khách, lần đăng nhập gần nhất, timestamps.

### Màn hình

- Đăng nhập; quên mật khẩu; thiết lập mật khẩu lần đầu.
- Admin: danh sách PT, tạo/sửa/khoá PT.
- PT: tạo tài khoản khách từ hồ sơ khách.
- Khách: trang “Thông tin của tôi”.

### Tiêu chí nghiệm thu

- PT không thể gọi API của khách do PT khác quản lý.
- Khách A không thể mở dữ liệu của khách B bằng cách đổi URL hoặc request.
- Tài khoản bị khoá không thể đăng nhập.

## 3. Module B — CRM khách hàng và gói PT

### Chức năng PT

- Danh sách khách: tìm theo tên/số điện thoại, lọc trạng thái và PT phụ trách.
- Tạo/sửa hồ sơ: họ tên, ngày sinh, giới tính, liên hệ, chiều cao, cân nặng ban đầu, bệnh lý/lưu ý, mục tiêu ban đầu, ghi chú.
- Lưu lịch sử tư vấn, lịch sử chăm sóc và ghi chú nội bộ theo thời gian.
- Quản lý gói PT: tên gói, ngày bắt đầu/kết thúc, tổng buổi, đã dùng, còn lại, trạng thái.
- Ảnh Before/After: tải lên, chú thích, ngày chụp, quyền hiển thị cho khách.

### Chức năng khách

- Xem hồ sơ cơ bản, PT phụ trách, mục tiêu đã công bố, ảnh được PT cho phép hiển thị và thông tin gói ở mức PT quyết định công bố.
- Không chỉnh sửa bất cứ trường nào trong Đợt 1.

### Dữ liệu

`CustomerProfile`, `PtPackage`, `ConsultationNote`, `CareNote`, `ProgressPhoto`, `CustomerAssignmentHistory`.

### Quy tắc

- Không xóa cứng hồ sơ có lịch sử; dùng trạng thái hoạt động/ngừng hoạt động.
- Lượt dùng gói không được âm hoặc vượt tổng buổi nếu không có quyền Admin và lý do.
- Ghi chú nội bộ mặc định không hiển thị cho khách.

### Popup hồ sơ khách hàng

- PT tạo và sửa hồ sơ khách bằng popup responsive dùng chung nền tảng giao diện với popup PT.
- Hồ sơ gồm thông tin cá nhân, liên hệ, chiều cao/cân nặng ban đầu, lưu ý sức khỏe, mục tiêu, ghi chú nội bộ và trạng thái.
- Cấp tài khoản đăng nhập là popup riêng và chỉ khả dụng khi khách chưa có tài khoản.
- Không đổi PT phụ trách trong popup; chuyển PT tiếp tục yêu cầu hai PT xác nhận trong ứng dụng.
- Khi đóng form đã thay đổi, hệ thống yêu cầu xác nhận; kết quả lưu được thông báo bằng Toast tiếng Việt.

## 4. Module C — Chuyển giao khách

### Luồng

1. PT A mở hồ sơ khách và chọn “Chuyển khách”.
2. Chọn PT B, nhập lý do; hệ thống tạo yêu cầu `pending`.
3. PT B nhận thông báo, xem thông tin cần thiết và xác nhận/từ chối.
4. Nếu xác nhận, cập nhật PT phụ trách và ghi lịch sử chuyển giao.
5. Admin xem toàn bộ yêu cầu, được hủy hoặc chuyển bắt buộc với lý do.

### Màn hình

- PT A: tạo và theo dõi yêu cầu gửi đi.
- PT B: hộp thư yêu cầu nhận vào, xác nhận/từ chối.
- Admin: danh sách, bộ lọc trạng thái và thao tác can thiệp.

### Tiêu chí nghiệm thu

- Dữ liệu lịch sử InBody, giáo án, dinh dưỡng và ghi chú không mất sau chuyển giao.
- Hệ thống không đổi PT phụ trách nếu PT B chưa xác nhận, trừ thao tác Admin.

## 5. Module D — InBody & Body Analysis cơ bản

### Chức năng

- Nhập tay hoặc tải ảnh phiếu InBody; AI có thể trích xuất nhưng PT phải sửa/xác nhận trước khi lưu.
- Lưu từng lần đo: cân nặng, BMI, % mỡ, khối lượng mỡ, SMM, BMR, mỡ nội tạng, InBody Score và chỉ số bổ sung.
- So sánh lần hiện tại với lần trước; biểu đồ cân nặng, % mỡ, SMM.
- PT viết nhận định: điểm mạnh, vấn đề ưu tiên, khuyến nghị; công bố cho khách.

### Quy tắc

- Không cho AI tự công bố kết quả quét.
- Bản công bố khách xem gồm dữ liệu đã xác nhận và nhận định PT chọn hiển thị.
- Lần đo phải có ngày đo; cho phép lưu nguồn “nhập tay” hoặc “quét ảnh”.

## 6. Module E — Mục tiêu, giáo án và dinh dưỡng cơ bản

### Mục tiêu

- PT chọn mục tiêu: giảm cân, giảm mỡ, tăng cân, tăng cơ, recomposition hoặc thể lực.
- Ghi mục tiêu định lượng, thời hạn dự kiến, số buổi tập/tuần, cardio và mốc đánh giá.
- Soạn nháp và công bố cho khách.

### Giáo án cơ bản

- Tạo buổi tập có tên, ngày/tuần áp dụng, bài tập, sets, reps, mức tạ tham khảo, nghỉ, tempo và ghi chú kỹ thuật.
- Gán giáo án cho khách và công bố phiên bản hiện hành.

### Dinh dưỡng cơ bản

- Tính BMR/TDEE, calories mục tiêu, protein/carb/fat từ dữ liệu khách và mức vận động.
- PT điều chỉnh kết quả trước khi lưu.
- Tạo thực đơn ngày/tuần, món ăn, định lượng, thay thế món; xuất bản cho khách xem.

## 7. API và kiểm thử chấp nhận

Nhóm API dự kiến: `/auth`, `/users`, `/pts`, `/customers`, `/packages`, `/transfers`, `/inbody`, `/goals`, `/workout-plans`, `/nutrition-plans`, `/publications`.

Mỗi nhóm API tuân thủ bốn tầng Route → Controller → Service → Model, validate đầy đủ và response chuẩn tại tài liệu tổng quan. Các API danh sách như khách, PT, gói, yêu cầu chuyển và lần đo InBody phải có phân trang/bộ lọc.

Kiểm thử phải bao phủ: phân quyền ba vai trò; tạo khách/cấp tài khoản; chuyển khách xác nhận hai PT; Admin chuyển bắt buộc; luồng nháp/công bố/thu hồi; AI InBody cần xác nhận trước lưu; khách chỉ xem dữ liệu đã công bố; popup xác nhận các thao tác rủi ro và Toast thông báo kết quả.
