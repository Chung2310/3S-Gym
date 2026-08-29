# Workout Exercise Recommendations Design

## Mục tiêu

Liên kết dữ liệu Thư viện bài tập với Studio để tự động đề xuất tối đa năm bài phù hợp với mục tiêu tự do, nhóm cơ và cấp độ của giáo án.

## Xếp hạng

- Chuẩn hóa văn bản về chữ thường, bỏ dấu tiếng Việt và bỏ ký tự đặc biệt.
- So khớp từ khóa mục tiêu với tên, nhóm cơ, thiết bị và kỹ thuật của bài tập.
- Ưu tiên mạnh bài thuộc nhóm cơ chung đã chọn cho giáo án.
- Ưu tiên bài có cùng cấp độ giáo án.
- Loại kết quả có điểm bằng không, giữ thứ tự ổn định khi bằng điểm và trả tối đa năm bài.
- Nếu mục tiêu không khớp, nhóm cơ hoặc cấp độ vẫn tạo được đề xuất.

## Giao diện

- Nhóm `Đề xuất cho giáo án` nằm trên ô tìm kiếm trong palette bên trái.
- Mỗi bài đề xuất hiển thị tên và nhóm cơ, hỗ trợ kéo hoặc bấm để thêm giống bài trong thư viện.
- Danh sách cập nhật ngay khi mục tiêu, cấp độ hoặc nhóm cơ chung thay đổi.
- Khi chưa có đề xuất, không hiển thị nhóm này để giữ giao diện gọn.

## Phạm vi

Không thêm API, không thay đổi backend và không lưu danh sách đề xuất vào giáo án.
