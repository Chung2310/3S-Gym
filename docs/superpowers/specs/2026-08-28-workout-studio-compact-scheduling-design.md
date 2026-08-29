# Thiết kế Studio giáo án tập trung vào xếp lịch

## Mục tiêu

Thu gọn Workout Plan Studio thành công cụ kết hợp các bài tập đã có trong Thư viện bài tập. Studio chỉ quyết định bài nào xuất hiện vào ngày nào, bắt đầu lúc mấy giờ và kéo dài bao lâu; Studio không khai báo lại chi tiết chuyên môn của bài tập.

## Phạm vi dữ liệu

Mỗi thẻ đã xếp lịch trong Studio chỉ cần các thông tin phục vụ bố trí timeline:

- Bài tập được tham chiếu bằng `exerciseId` và hiển thị `name`.
- `dayNumber`.
- `startMinute`.
- `durationMinutes`.

Các thông tin kỹ thuật, video, nhóm cơ, cấp độ và hướng dẫn thực hiện được quản lý tại Thư viện bài tập. Studio không cho chỉnh sets, reps, mức tạ, thời gian nghỉ, tempo, RPE, RIR hoặc ghi chú riêng trên thẻ.

Để tương thích dữ liệu cũ, backend có thể tiếp tục giữ các trường chi tiết hiện có trong schema và payload. Frontend Studio không hiển thị hoặc tạo giá trị mới cho các trường này. Việc thu gọn không tự ý xóa dữ liệu cũ đang lưu.

## Giao diện

### Bố cục

- Giảm padding và khoảng cách dọc ở header, thanh chọn ngày và lưới ba vùng.
- Thư viện bài tập bên trái giữ tìm kiếm, bộ lọc và danh sách bài.
- Timeline là vùng chính và nhận phần lớn chiều rộng.
- Inspector bên phải thu gọn thành một card hẹp.

### Inspector

Khi chưa chọn bài, hiển thị một hướng dẫn ngắn. Khi đã chọn bài, chỉ hiển thị:

- Tên bài tập.
- Ngày.
- Giờ bắt đầu.
- Thời lượng, gồm nút tăng/giảm 15 phút.
- Nút đưa về khay Chưa xếp lịch.

Inspector không hiển thị các trường chuyên môn của bài tập.

### Mobile

Drawer thuộc tính trên mobile giữ nguyên cơ chế mở/đóng hiện tại nhưng có chiều cao nhỏ hơn nhờ chỉ còn các trường lịch.

## Luồng dữ liệu

- Khi kéo hoặc chọn bài từ thư viện, Studio tạo thẻ lịch từ định danh và tên bài tập.
- Các thao tác đổi ngày, giờ và thời lượng tiếp tục kiểm tra giới hạn 24 giờ và chống trùng lịch.
- Khi tải giáo án cũ, các trường chi tiết vẫn được bảo toàn trong state/payload để tránh mất dữ liệu, nhưng không được chỉnh tại Studio.
- Backend tiếp tục dựng `sessions` tương thích từ các bài đã xếp lịch.

## Kiểm thử

- Component test xác nhận inspector chỉ có ngày, giờ và thời lượng.
- Xác nhận sets, reps, mức tạ, nghỉ, tempo, RPE, RIR và ghi chú không xuất hiện.
- Regression test kéo thả, bàn phím, lưu giáo án, khay chưa xếp lịch và chống trùng lịch tiếp tục chạy.
- Chạy lint các component Studio, typecheck và production build.

## Ngoài phạm vi

- Thay đổi form tạo bài tập trong Thư viện bài tập.
- Xóa các trường chi tiết cũ khỏi database.
- Thay đổi cách gán giáo án cho khách hàng.
