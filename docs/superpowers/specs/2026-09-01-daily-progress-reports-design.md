# Thiết kế báo cáo tiến độ theo ngày

## Mục tiêu

Trong tab **Báo cáo** của chi tiết tiến độ khách hàng, tự động hiển thị một báo cáo cho mỗi ngày PT đã hoàn tất thao tác **Ghi nhận buổi tập**. Báo cáo ngày được dựng từ dữ liệu hành trình hiện có và không tạo thêm bản ghi báo cáo trong database.

## Phạm vi

- Áp dụng cho tab **Báo cáo** trong chi tiết tiến độ của PT.
- Giữ nguyên form tạo báo cáo tự động và lịch sử báo cáo tổng hợp hiện có.
- Không thay đổi API hoặc schema backend.
- Không thay đổi luồng ghi nhận buổi tập.

## Nguồn dữ liệu

Báo cáo ngày nhận trực tiếp từ `CustomerJourneyDto`:

- `sessions`: nguồn chính, quyết định ngày nào xuất hiện trong danh sách.
- `measurements`: ghép vào ngày có cùng ngày lịch với `measuredAt`.
- `photos`: ghép vào ngày có cùng ngày lịch với `takenDate`.

Backend hiện lưu số đo và ảnh được nhập trong form ghi nhận với cùng ngày `performedAt` của buổi tập. Vì vậy việc ghép theo ngày không cần khóa liên kết mới.

## Quy tắc nhóm và sắp xếp

1. Chuẩn hóa `performedAt`, `measuredAt` và `takenDate` thành khóa ngày `YYYY-MM-DD`.
2. Chỉ tạo nhóm ngày khi ngày đó có ít nhất một `session`.
3. Một ngày có nhiều buổi tập thì tất cả buổi nằm trong cùng nhóm.
4. Các nhóm ngày sắp xếp giảm dần, ngày mới nhất hiển thị trước.
5. Các buổi trong cùng ngày sắp xếp giảm dần theo `performedAt` nếu có thông tin thời gian; thứ tự đầu vào được giữ ổn định khi thời gian bằng nhau.
6. Số đo hoặc ảnh không gắn với một ngày có buổi tập vẫn tiếp tục hiển thị ở các tab chuyên biệt, không tự tạo báo cáo ngày riêng.

## Giao diện

Tab **Báo cáo** gồm ba khối theo thứ tự:

1. Form **Tạo báo cáo tiến độ** hiện có.
2. Khối **Ghi nhận theo ngày**.
3. Khối **Báo cáo tổng hợp** hiện có.

Mỗi nhóm ngày hiển thị:

- Tiêu đề ngày theo định dạng tiếng Việt.
- Tổng số buổi được ghi nhận trong ngày.
- Với từng buổi: trạng thái có mặt, đi muộn hoặc vắng; tên giáo án và tên buổi; kết quả bài tập; volume; RPE; cảm nhận; ghi chú.
- Danh sách số đo được ghi cùng ngày, chỉ hiển thị những trường có giá trị.
- Lưới ảnh tiến độ được ghi cùng ngày, dùng `alt` mô tả ngày và góc chụp.

Giao diện dùng Tailwind CSS v4 và các token hiện có. Không thêm CSS module, inline style hoặc namespace CSS mới.

## Kiến trúc component

### `dailyProgressReports` service

Một hàm thuần trong `frontend/src/services/` nhận sessions, measurements và photos rồi trả về các nhóm ngày đã sắp xếp. Hàm này chịu trách nhiệm chuẩn hóa ngày, ghép dữ liệu và đảm bảo không mutate props.

### `DailyProgressReports` component

Component trong `frontend/src/components/progress/` nhận danh sách nhóm ngày đã hoàn chỉnh qua props và chỉ chịu trách nhiệm render. Component không gọi API hoặc service.

### Tích hợp tab Báo cáo

`ProgressPage` gọi service khi `journey` thay đổi rồi truyền các nhóm ngày xuống `ProgressDetailModal`. Modal dựng `DailyProgressReports` và truyền nó vào `CustomerJourney` dưới dạng nội dung tùy chọn, tương tự `reportComposer`. Cổng học viên không nhận nội dung này nên hành vi read-only hiện tại không bị mở rộng ngoài phạm vi.

## Trạng thái rỗng và dữ liệu không hợp lệ

- Không có session: hiển thị **Chưa có ghi nhận theo ngày**.
- Session thiếu hoặc có ngày không hợp lệ: bỏ qua khỏi nhóm ngày, không làm hỏng toàn bộ tab.
- Số đo hoặc ảnh có ngày không hợp lệ: không ghép vào nhóm.
- Trường số đo không có giá trị: không render chỉ số rỗng.
- Ảnh thiếu URL: không render ảnh đó.

## Kiểm thử

### Unit test service

- Nhóm nhiều buổi cùng ngày.
- Sắp xếp ngày mới nhất trước.
- Ghép số đo và ảnh đúng ngày.
- Không mutate mảng đầu vào.
- Bỏ qua ngày không hợp lệ.

### Component test

- Hiển thị tiêu đề ngày, số buổi và trạng thái điểm danh.
- Hiển thị chi tiết bài tập, số đo và ảnh của ngày.
- Hiển thị empty state khi chưa có buổi tập.

### Integration test

- Mở chi tiết tiến độ, chọn tab **Báo cáo** và thấy khối **Ghi nhận theo ngày**.
- Form tạo báo cáo và lịch sử báo cáo tổng hợp vẫn còn.

## Tiêu chí hoàn thành

- Mỗi ngày PT đã ghi nhận ít nhất một buổi tập có đúng một nhóm báo cáo ngày.
- Các nhóm mới nhất đứng trước.
- Dữ liệu buổi tập, số đo và ảnh cùng ngày xuất hiện đúng nhóm.
- Không tạo hoặc cập nhật `ProgressReport` khi chỉ xem báo cáo ngày.
- Các test tập trung, typecheck file thay đổi, lint và diff check đạt.
