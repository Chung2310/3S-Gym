# Đợt 3 — Customer Care, Dashboard và PT Assistant

## 1. Mục tiêu và ranh giới

Đợt 3 khai thác dữ liệu đã tích lũy để PT ưu tiên công việc, phát hiện khách cần hỗ trợ và tạo tư vấn có kiểm soát. AI không thay thế quyết định chuyên môn của PT.

## 2. Module I — Customer Care & cảnh báo

### Phân loại trạng thái khách

- Khách mới; khách tiềm năng; đang tập tốt; cần quan tâm; nguy cơ bỏ tập; sắp hết gói; khách trung thành.
- Hệ thống tính trạng thái gợi ý từ rule; PT/Admin có thể chỉnh tay và phải ghi lý do khi khác rule.

### Rule cảnh báo khởi đầu

- 5 ngày chưa có buổi tập/check-in.
- Còn 5 buổi PT hoặc ít hơn.
- 30 ngày chưa đo InBody.
- Quá hạn follow-up hoặc mốc đánh giá mục tiêu.
- Xu hướng xấu theo rule cấu hình: cân nặng/% mỡ/SMM đi ngược mục tiêu trong nhiều mốc liên tiếp.

### Chức năng

- Màn “Việc cần làm hôm nay”: lịch tập, follow-up, đo InBody, gói sắp hết, khách rủi ro.
- Tạo nhiệm vụ, giao PT, hạn xử lý, kết quả và trạng thái hoàn tất.
- Nhật ký chăm sóc và lịch sử cảnh báo để tránh nhắc lặp.

## 3. Module J — Dashboard

### Dashboard PT

- Tổng số khách quản lý; số khách tiến bộ tốt/chậm/kết quả xấu.
- Danh sách 3–5 khách nổi bật theo mức thay đổi so với mục tiêu.
- Danh sách cần quan tâm, nguyên nhân dữ liệu gợi ý và hành động tiếp theo.
- Hôm nay: lịch tập, follow-up, InBody đến hạn, gói sắp hết.

### Dashboard Admin

- Tổng quan PT, số khách, cảnh báo chưa xử lý, trạng thái gói và mức sử dụng hệ thống.
- Bộ lọc theo PT, khoảng thời gian và trạng thái khách.

### Nguyên tắc tính điểm

- Công thức phải cấu hình và giải thích được: mục tiêu ban đầu, body fat, SMM, cân nặng, số đo, tần suất tập, thành tích và thời gian.
- Không xếp hạng khi dữ liệu không đủ; thay vào đó hiển thị “thiếu dữ liệu”.
- Dashboard luôn liên kết ngược đến hồ sơ và dữ liệu nguồn.

## 4. Module K — PT Assistant

### Tình huống hỗ trợ

- Khách mới: khai thác nhu cầu, tư vấn, xử lý từ chối, chốt PT, follow-up.
- Khách đang tập: mất động lực, nghỉ tập, không thấy kết quả, phàn nàn, muốn đổi giáo án.
- Khách sắp hết gói: đánh giá kết quả, tư vấn lộ trình tiếp theo, kịch bản gia hạn.

### Luồng an toàn

1. PT chọn khách hoặc nhập ngữ cảnh.
2. Hệ thống lấy dữ liệu được phép của khách và nguồn Knowledge Base liên quan.
3. AI trả về phân tích, đề xuất và kịch bản; nêu rõ dữ liệu/nguồn đã dùng.
4. PT chỉnh sửa, sao chép hoặc phê duyệt nội dung trước khi dùng với khách.

### Ràng buộc

- Không gửi tự động cho khách.
- Không tạo kết luận y khoa, đơn thuốc hoặc hướng dẫn vượt quy trình chuyên môn 3S.
- Lưu log yêu cầu/đầu ra/phê duyệt, không đưa dữ liệu khách của PT khác vào ngữ cảnh.

## 5. Module L — Knowledge Base 3S

- Quản trị nội dung theo nhóm: gym, dinh dưỡng, InBody, mobility, stretching, sai lệch tư thế, kỹ thuật bài tập, quy trình PT, chăm sóc và kịch bản tư vấn.
- Mỗi bài có tiêu đề, nội dung, nhóm chủ đề, phiên bản, trạng thái nháp/xuất bản, người duyệt và ngày hiệu lực.
- Chỉ bài đã xuất bản mới được Assistant dùng làm nguồn trả lời.

## 6. Kiểm thử chấp nhận

- Cảnh báo xuất hiện đúng rule, có thể đánh dấu xử lý và không lặp bất hợp lý.
- Dashboard PT không lộ dữ liệu khách của PT khác; dashboard Admin có lọc đúng.
- AI trả kết quả có cảnh báo, nguồn Knowledge Base và trạng thái “PT cần duyệt”.
- AI không thể tự công bố, tự gửi hoặc thay đổi hồ sơ khách.
- Danh sách cảnh báo, nhiệm vụ, nguồn Knowledge Base và log Assistant có phân trang/bộ lọc; các hành động xử lý quan trọng dùng popup xác nhận và Toast thông báo bằng tiếng Việt.
