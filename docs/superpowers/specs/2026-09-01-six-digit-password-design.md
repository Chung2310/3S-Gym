# Thiết kế quy tắc mật khẩu 6 chữ số

## Mục tiêu

Mọi luồng tạo hoặc đổi mật khẩu cho tài khoản `ADMIN`, `PT` và `CUSTOMER` phải yêu cầu mật khẩu gồm đúng 6 ký tự số. Ví dụ hợp lệ: `123456`.

## Phạm vi

- Form tạo và cập nhật tài khoản dùng chung.
- Form tạo tài khoản PT.
- Form cấp tài khoản cho khách hàng.
- API tạo/cập nhật người dùng và API cấp tài khoản khách hàng.
- Hint, thuộc tính nhập liệu và thông báo lỗi liên quan đến mật khẩu trong các luồng trên.

Màn hình đăng nhập không áp dụng kiểm tra định dạng mới để tài khoản hiện hữu có mật khẩu cũ vẫn đăng nhập được. Không có migration mật khẩu vì hệ thống chỉ lưu mật khẩu đã băm và không thể khôi phục mật khẩu gốc.

## Quy tắc nghiệp vụ

- Mật khẩu hợp lệ khi khớp biểu thức `^\d{6}$`.
- Từ chối mật khẩu có ít hơn hoặc nhiều hơn 6 ký tự.
- Từ chối chữ cái, khoảng trắng và ký tự đặc biệt.
- Khi tạo tài khoản, mật khẩu là bắt buộc.
- Khi cập nhật tài khoản, trường mật khẩu được phép để trống; nếu có giá trị thì phải đúng 6 chữ số.
- Quy tắc áp dụng giống nhau cho cả ba vai trò tài khoản.

## Frontend

Các ô mật khẩu liên quan sẽ dùng:

- `minLength={6}` và `maxLength={6}`.
- `inputMode="numeric"` để ưu tiên bàn phím số trên thiết bị di động.
- `pattern="[0-9]{6}"` để hỗ trợ validation gốc của trình duyệt.
- Hint thống nhất, diễn đạt rõ yêu cầu đúng 6 chữ số.

Ngoài validation gốc của input, logic submit sẽ kiểm tra mật khẩu bằng cùng quy tắc trước khi gọi API và hiển thị thông báo `Mật khẩu phải gồm đúng 6 chữ số.`. Validation phía frontend chỉ giúp phản hồi nhanh; backend vẫn là nguồn kiểm tra bắt buộc.

## Backend

Schema Joi của người dùng và tài khoản khách hàng sẽ kiểm tra mật khẩu bằng pattern 6 chữ số. API tạo tài khoản yêu cầu giá trị hợp lệ; API cập nhật vẫn cho phép chuỗi rỗng hoặc `null` để biểu thị không đổi mật khẩu.

Các manual validator cũ nằm trong đoạn mã đã vô hiệu hóa không tham gia luồng chạy và không cần thay đổi.

## Kiểm thử

- Xác nhận `123456` được chấp nhận khi tạo/cập nhật tài khoản.
- Xác nhận `12345`, `1234567`, `12345a`, giá trị có khoảng trắng và ký tự đặc biệt bị từ chối.
- Xác nhận cập nhật tài khoản không có mật khẩu vẫn hợp lệ.
- Xác nhận các form hiển thị hint 6 chữ số và không gửi API khi mật khẩu sai định dạng.
- Chạy test liên quan, typecheck và lint trên các file đã thay đổi.

## Tiêu chí hoàn thành

Không còn hint hoặc validation đang hoạt động yêu cầu tối thiểu 8 ký tự trong các luồng quản lý tài khoản. Frontend và backend thống nhất yêu cầu đúng 6 chữ số cho `ADMIN`, `PT` và `CUSTOMER`, trong khi đăng nhập bằng mật khẩu hiện hữu không bị ảnh hưởng.
