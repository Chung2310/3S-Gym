# Thiết kế popup thêm và sửa PT

## Mục tiêu

Admin thêm và sửa đầy đủ hồ sơ PT trong popup dùng chung, có validation, phản hồi tiếng Việt, Toast và giao diện responsive.

## Phạm vi dữ liệu

Mở rộng model `User` cho tài khoản vai trò `PT` với các trường:

- `avatarUrl`: URL ảnh đại diện, không triển khai upload file trong phạm vi này.
- `fullName`: họ tên, bắt buộc.
- `dateOfBirth`: ngày sinh.
- `gender`: `MALE`, `FEMALE` hoặc `OTHER`.
- `phone`: số điện thoại, bắt buộc và duy nhất khi có giá trị.
- `email`: email, duy nhất khi có giá trị.
- `address`: địa chỉ.
- `specialization`: chuyên môn.
- `yearsOfExperience`: số năm kinh nghiệm, số nguyên không âm.
- `certificates`: danh sách chứng chỉ dạng chuỗi; giao diện nhập mỗi chứng chỉ một dòng.
- `bio`: giới thiệu ngắn.
- `username`: tên đăng nhập, bắt buộc và duy nhất; không cho sửa sau khi tạo.
- `password`: bắt buộc khi tạo; khi sửa chỉ đổi nếu Admin nhập mật khẩu mới.
- `status`: `ACTIVE` hoặc `LOCKED`.

Các trường mở rộng chỉ phục vụ hồ sơ PT trong giao diện hiện tại. Tài khoản Admin và Khách vẫn dùng chung model nhưng không bắt buộc các trường hồ sơ PT.

## Backend

Giữ cấu trúc bốn tầng:

1. Route `PATCH /api/users/:id` yêu cầu đăng nhập Admin, validate `id`, body và chỉ nhận tài khoản PT.
2. Controller chuyển dữ liệu hợp lệ sang service và trả response chuẩn.
3. Service kiểm tra tài khoản tồn tại, vai trò PT, trùng email/số điện thoại; băm mật khẩu mới nếu được cung cấp.
4. Model lưu các trường hồ sơ và không trả mật khẩu trong response.

`POST /api/users` được mở rộng cùng bộ validation. `GET /api/users` tiếp tục có phân trang và bộ lọc, trả các trường cần hiển thị. Tất cả message lỗi và thành công dùng tiếng Việt.

## Frontend

Tạo `PtFormModal` dùng chung cho hai chế độ:

- “Thêm PT”: form rỗng; mật khẩu bắt buộc.
- “Sửa PT”: điền sẵn dữ liệu; username chỉ đọc; mật khẩu mới không bắt buộc.

Popup chia bốn nhóm: thông tin cá nhân, liên hệ, chuyên môn và tài khoản. Desktop dùng hai cột; điện thoại dùng một cột, popup gần toàn màn hình và phần nút hành động luôn dễ tiếp cận.

Danh sách PT có nút “Sửa”. Nhấn “Thêm PT” hoặc “Sửa” chỉ mở popup, không hiển thị form nội tuyến. Lưu thành công đóng popup, tải lại đúng danh sách và hiện Toast. Lỗi giữ popup mở và hiện Toast tiếng Việt.

Nếu form đã thay đổi mà người dùng bấm Hủy/đóng, hiển thị popup xác nhận bỏ thay đổi. Không hỏi xác nhận khi form chưa thay đổi.

## Validation

- Họ tên, tên đăng nhập và số điện thoại bắt buộc khi tạo PT.
- Mật khẩu khi tạo có ít nhất 8 ký tự.
- Email và URL ảnh đại diện phải đúng định dạng khi có giá trị.
- Ngày sinh không được ở tương lai.
- Số năm kinh nghiệm là số nguyên từ 0 đến 80.
- Bio tối đa 1.000 ký tự.
- Khi sửa, không nhận thay đổi username hoặc role từ client.

## Kiểm thử

- Backend: tạo PT đủ thông tin; sửa hồ sơ; đổi mật khẩu tùy chọn; từ chối trùng email/số điện thoại; từ chối sửa tài khoản không phải PT; kiểm tra message và response chuẩn.
- Frontend: nút thêm và sửa mở đúng popup; sửa điền sẵn dữ liệu; username khóa; mật khẩu bắt buộc theo chế độ; request đúng endpoint; Toast thành công/lỗi; xác nhận khi bỏ form đã thay đổi.
- Hồi quy: chạy toàn bộ test, lint và production build.

## Ngoài phạm vi

- Upload và xử lý file ảnh đại diện.
- Quản lý file chứng chỉ.
- Lịch làm việc, KPI, doanh thu và đánh giá PT.
- Cho PT tự sửa hồ sơ của mình.
