# Thiết kế popup thêm và sửa khách hàng

## Mục tiêu

PT tạo và sửa đầy đủ hồ sơ khách hàng trong popup responsive. Giao diện tái sử dụng nền tảng của popup PT nhưng tách riêng logic nghiệp vụ, không hiển thị trường dành riêng cho PT hoặc tài khoản đăng nhập.

## Quyết định thiết kế

Tách phần dùng chung của `PtFormModal` thành một khung popup hồ sơ, dự kiến là `ProfileFormModal`. Khung dùng chung chịu trách nhiệm về bố cục, tiêu đề, vùng nội dung cuộn, nút hành động, đóng bằng backdrop/nút đóng, trạng thái đang lưu và xác nhận bỏ thay đổi.

`PtFormModal` và `CustomerFormModal` là hai component nghiệp vụ riêng sử dụng khung này. Mỗi component tự quản lý dữ liệu form, validation phía trình duyệt, chuyển đổi payload, endpoint và các nhóm trường. Không đưa logic khách hàng vào `PtFormModal` bằng nhiều nhánh điều kiện.

## Phạm vi dữ liệu khách hàng

Popup khách hàng gồm các trường model hiện đang hỗ trợ:

- Thông tin cá nhân: `fullName`, `dateOfBirth`, `gender`.
- Liên hệ: `phone`, `email`.
- Chỉ số và sức khỏe: `height`, `initialWeight`, `medicalNotes`.
- Quản lý: `initialGoal`, `internalNotes`, `status`.

Khi PT tạo khách, backend tự gán `assignedPtId` bằng PT đang đăng nhập. Popup không cho nhập hoặc thay đổi PT phụ trách. Việc chuyển PT tiếp tục đi qua quy trình hai PT xác nhận trong ứng dụng.

Các trường sau không xuất hiện trong popup khách: ảnh đại diện, địa chỉ, chuyên môn, số năm kinh nghiệm, chứng chỉ, giới thiệu, tên đăng nhập và mật khẩu. Model khách hiện chưa có ảnh đại diện và địa chỉ; các trường chuyên môn thuộc hồ sơ PT; thông tin đăng nhập thuộc luồng cấp tài khoản riêng.

## Luồng giao diện

- Trong tab Khách hàng, nút “Tạo mới” mở `CustomerFormModal` ở chế độ tạo; không chèn form trực tiếp vào trang.
- Mỗi dòng khách hàng có nút “Sửa” luôn hiển thị và nút “Cấp tài khoản” chỉ hiển thị khi khách chưa có `userId`.
- Nút “Sửa” mở cùng `CustomerFormModal` với dữ liệu đã điền sẵn.
- Tạo thành công gọi `POST /api/customers`; sửa thành công gọi `PATCH /api/customers/:id`.
- Thành công đóng popup, tải lại danh sách hiện tại và hiển thị Toast tiếng Việt.
- Lỗi giữ popup mở và hiển thị Toast tiếng Việt.
- Nếu form đã thay đổi, thao tác đóng, hủy hoặc nhấn backdrop mở `ConfirmModal` để xác nhận bỏ thay đổi. Form chưa thay đổi được đóng ngay.
- Popup cấp tài khoản khách vẫn là component và thao tác riêng, không nằm trong popup hồ sơ.

## Bố cục và responsive

Popup khách tái sử dụng màu sắc, kích thước, header, footer và hành vi responsive của popup PT. Nội dung chia thành các section rõ ràng: thông tin cá nhân, liên hệ, sức khỏe và quản lý.

Desktop dùng lưới hai cột khi đủ chiều rộng. Điện thoại dùng một cột, chiều rộng gần toàn màn hình, nội dung cuộn trong popup và vùng nút hành động dễ tiếp cận. Tất cả input có label liên kết đúng; dialog có tên truy cập; nút đóng có nhãn tiếng Việt.

## Backend và validation

Giữ cấu trúc bốn tầng Route → Controller → Service → Model.

- Tách validator tạo và sửa khách hàng để áp dụng cho cả `POST /api/customers` và `PATCH /api/customers/:id`.
- Tạo mới bắt buộc `fullName` tối thiểu 2 ký tự và số điện thoại hợp lệ.
- Sửa cho phép payload từng phần nhưng phải từ chối body rỗng hoặc trường ngoài danh sách cho phép.
- Email phải đúng định dạng khi có giá trị.
- Ngày sinh hợp lệ và không ở tương lai.
- `gender` chỉ nhận `MALE`, `FEMALE`, `OTHER`.
- Chiều cao và cân nặng ban đầu là số không âm khi có giá trị.
- `status` chỉ nhận `ACTIVE`, `INACTIVE`, `LEAD`.
- Các chuỗi ghi chú được giới hạn độ dài phù hợp để tránh payload quá lớn.
- Route sửa tiếp tục validate ObjectId và bổ sung validate body; hiện tại route này mới chỉ kiểm tra ID.
- Service chỉ lấy các trường được phép, không chấp nhận thay đổi `assignedPtId` hoặc `userId` qua API sửa hồ sơ.
- Response tiếp tục theo mẫu chung và toàn bộ message trả về bằng tiếng Việt.

## Quản lý trạng thái frontend

`CustomerFormModal` nhận các prop `open`, `customer`, `onClose`, `onSaved`. Có `customer._id` là chế độ sửa; không có customer là chế độ tạo.

Form khởi tạo lại mỗi lần popup mở hoặc khách được chọn thay đổi. Giá trị ngày được chuẩn hóa sang `YYYY-MM-DD`; số rỗng không gửi thành `0` ngoài ý muốn; chuỗi được trim trước khi gửi. Trong lúc lưu, khóa nút gửi để tránh tạo request trùng.

`PtView` thay trạng thái boolean `showForm` của riêng tab khách bằng state lưu khách đang thao tác và trạng thái mở popup. Các tab nội dung khác vẫn giữ luồng hiện tại trong phạm vi thay đổi này.

## Kiểm thử

- Component khung: render tiêu đề/nội dung, gọi đúng hành động đóng, hiển thị trạng thái loading và xác nhận khi có thay đổi.
- Frontend khách hàng: nút tạo mở dialog “Thêm khách hàng”; nút sửa mở “Sửa khách hàng” và điền sẵn dữ liệu; hiển thị đủ trường khách; không hiển thị trường PT hoặc tài khoản; gửi đúng POST/PATCH; xử lý Toast và đóng popup đúng.
- Danh sách: nút Sửa và Cấp tài khoản có thể cùng tồn tại; khách có tài khoản không còn nút Cấp tài khoản.
- Backend: validator tạo/sửa, giới hạn enum/số/ngày/email, từ chối trường không được phép, bảo vệ `assignedPtId` và `userId`, kiểm tra response chuẩn tiếng Việt.
- Hồi quy: test toàn bộ backend/frontend, lint và production build.

## Ngoài phạm vi

- Thêm ảnh đại diện hoặc địa chỉ vào model khách hàng.
- Gộp cấp tài khoản vào popup hồ sơ.
- Thay đổi hoặc đặt lại tên đăng nhập/mật khẩu khi sửa hồ sơ.
- Chuyển PT phụ trách trực tiếp trong popup.
- Chuyển các form nội dung, chuyển PT hoặc cấp tài khoản sang khung popup mới trong cùng thay đổi này.
