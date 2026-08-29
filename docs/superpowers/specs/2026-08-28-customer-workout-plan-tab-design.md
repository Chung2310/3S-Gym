# Thiết kế tab Giáo án trong chi tiết khách hàng

## Mục tiêu

Chuyển nghiệp vụ gán và cá nhân hóa giáo án khỏi module riêng trên menu PT vào tab `Giáo án` trong chi tiết từng khách hàng. PT gán một giáo án mẫu để tạo bản sao độc lập, sau đó chỉnh bản của khách bằng Workout Studio mà không làm thay đổi giáo án mẫu.

## Phạm vi

- Bỏ mục `Giáo án khách hàng` khỏi menu PT.
- Giữ `Giáo án của tôi` làm nơi tạo và quản lý giáo án mẫu.
- Thêm tab `Giáo án` trong `CustomerDetailModal`, tách biệt với tab `Lịch sử tập luyện` hiện có.
- Mỗi khách hàng chỉ có một giáo án ở trạng thái `ACTIVE` tại một thời điểm.
- Khi thay giáo án, giáo án đang áp dụng chuyển sang `ARCHIVED` và được giữ trong lịch sử.
- Giáo án lịch sử chỉ được xem. Thao tác `Gán lại` luôn tạo một snapshot mới.

## Luồng giao diện

### Khách chưa có giáo án

Tab `Giáo án` hiển thị trạng thái trống và nút `Gán giáo án`. Nút mở popup liệt kê giáo án mẫu thuộc PT hiện tại. Mỗi lựa chọn hiển thị tên, mục tiêu, cấp độ, thời lượng và tổng số bài tập. PT xem nhanh rồi xác nhận gán.

### Khách có giáo án đang áp dụng

Tab hiển thị thẻ giáo án hiện tại gồm tên, mục tiêu, ngày áp dụng, thời lượng và trạng thái. Hai thao tác chính:

- `Mở Studio`: mở bản giáo án riêng của khách để chỉnh lịch.
- `Thay giáo án`: chọn mẫu khác, lưu bản hiện tại vào lịch sử rồi tạo bản active mới.

Phía dưới là khu vực `Lịch sử giáo án` dạng thu gọn. Giáo án archived có thể mở ở chế độ chỉ xem hoặc dùng thao tác `Gán lại` để tạo bản active mới.

### Workout Studio theo khách hàng

Studio tái sử dụng timeline kéo-thả hiện có nhưng hiển thị rõ tên khách hàng và ngữ cảnh `Giáo án khách hàng`. Route và lệnh lưu dùng tài nguyên giáo án khách hàng, không dùng API cập nhật giáo án mẫu. Cảnh báo thay đổi chưa lưu tiếp tục hoạt động như Studio mẫu.

## Mô hình dữ liệu

Giáo án khách hàng là snapshot độc lập, gồm:

- `customerId`: khách nhận giáo án.
- `ptId`: PT sở hữu và quản lý bản gán.
- `sourceTemplateId`: ID mẫu nguồn để truy vết; không dùng để đồng bộ dữ liệu.
- `status`: `ACTIVE` hoặc `ARCHIVED`.
- `assignedAt`, `archivedAt`: mốc thời gian vòng đời.
- Thông tin giáo án và toàn bộ lịch bài tập đã sao chép: tên, mục tiêu, cấp độ, số ngày, bài đã xếp lịch và bài chưa xếp lịch.

Các thuộc tính chuyên môn legacy vẫn được bảo toàn trong snapshot. Thay đổi hoặc xóa giáo án mẫu sau khi gán không ảnh hưởng snapshot của khách.

Backend áp dụng unique partial index hoặc ràng buộc tương đương để mỗi `customerId` chỉ có tối đa một bản `ACTIVE`.

## API và phân quyền

- `GET /api/customers/:customerId/workout-plans`: trả giáo án active và lịch sử của khách.
- `POST /api/customers/:customerId/workout-plans/assign`: nhận `templateId`, archive bản active hiện tại nếu có và tạo snapshot mới.
- `GET /api/customers/:customerId/workout-plans/:planId`: tải snapshot cho tab hoặc Studio.
- `PATCH /api/customers/:customerId/workout-plans/:planId`: chỉ sửa bản active của khách.

Mọi endpoint phải xác nhận khách hàng thuộc phạm vi quản lý của PT đăng nhập. Template nguồn phải tồn tại, thuộc PT hiện tại và đủ dữ liệu hợp lệ. Không cung cấp xóa vĩnh viễn trong luồng chính.

Thao tác archive bản cũ và tạo bản mới phải chạy trong transaction. Nếu bất kỳ bước nào thất bại, giáo án active cũ được giữ nguyên.

## Cấu trúc frontend

- Component tab khách hàng chịu trách nhiệm tải trạng thái active và lịch sử theo `customerId`.
- Popup chọn mẫu là component riêng, chỉ nhận danh sách mẫu và phát sự kiện xác nhận.
- Thẻ giáo án active và danh sách lịch sử là các component hiển thị độc lập.
- Page Studio điều phối tải/lưu theo route giáo án khách hàng và tái sử dụng các component timeline hiện có.
- Route module `pt/customer-workout-plans` cũ được chuyển hướng an toàn về danh sách khách hàng.
- Bỏ thao tác gán khỏi danh sách giáo án mẫu; việc gán chỉ bắt đầu trong tab `Giáo án` của khách đã chọn để luôn có ngữ cảnh khách hàng rõ ràng.
- UI mới dùng Tailwind CSS v4 và các design token hiện có.

## Trạng thái lỗi

- Hiển thị loading skeleton hoặc trạng thái tải trong tab và popup.
- Có empty state khi chưa có giáo án hoặc chưa có mẫu để gán.
- Lỗi tải có nút thử lại.
- Khóa thao tác xác nhận trong khi request đang chạy để tránh gán trùng.
- Backend trả lỗi rõ ràng cho template không tồn tại, khách ngoài phạm vi, snapshot archived không thể sửa và xung đột active plan.
- Frontend hiển thị lỗi qua toast hiện có và giữ nguyên dữ liệu đang hiển thị nếu request thất bại.

## Kiểm thử

### Backend

- Gán mẫu tạo snapshot đầy đủ và chỉnh snapshot không thay đổi mẫu nguồn.
- Một khách không thể có hai giáo án active.
- Thay giáo án archive bản cũ và tạo bản active mới trong cùng transaction.
- Transaction thất bại giữ nguyên giáo án active cũ.
- PT không thể đọc, gán hoặc sửa giáo án của khách ngoài phạm vi.
- Snapshot archived không thể PATCH; gán lại tạo snapshot mới.

### Frontend

- Tab Giáo án xuất hiện trong chi tiết khách hàng và tải đúng `customerId`.
- Empty state mở popup chọn mẫu và gán thành công.
- Giáo án active mở đúng Customer Workout Studio.
- Thay giáo án cập nhật active card và lịch sử.
- Lịch sử chỉ xem; gán lại gọi luồng tạo snapshot mới.
- Menu không còn `Giáo án khách hàng`; route cũ chuyển hướng an toàn.
- Studio khách hàng dùng API snapshot, giữ cảnh báo chưa lưu và không gọi API template khi lưu.
- Lịch kéo-thả và dữ liệu legacy không mất sau chu kỳ tải, sửa và lưu.

## Ngoài phạm vi

- Nhiều giáo án active đồng thời cho một khách.
- Đồng bộ tự động từ mẫu sang giáo án đã gán.
- Xóa vĩnh viễn lịch sử giáo án.
- Theo dõi kết quả từng buổi tập hoặc nhật ký hoàn thành bài tập.
