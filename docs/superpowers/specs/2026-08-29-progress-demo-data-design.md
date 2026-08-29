# Progress Demo Data Design

## Goal

Tạo một bộ dữ liệu local riêng, đủ dày để xem toàn bộ màn hành trình và tiến độ mà không làm lẫn dữ liệu đang có.

## Dataset

- Một PT demo và một tài khoản khách hàng demo có thể đăng nhập.
- Một hồ sơ `Khách Demo Tiến Độ`, một giáo án 3 buổi mỗi tuần và một bản gán đang hoạt động.
- 36 buổi trong 12 tuần, gồm có mặt, đi muộn và vắng; các buổi hoàn thành có sets, reps, mức tạ, RPE/RIR, cảm nhận và ghi chú.
- 13 mốc đo hàng tuần gồm cân nặng, body fat, muscle và sáu vòng đo.
- Lịch tập tương ứng, ba ảnh minh họa Before/Progress/After và hai báo cáo đã công bố.

## Safety

Tất cả bản ghi dùng định danh cố định bắt đầu bằng `demo-progress`. Seeder dùng upsert hoặc xóa/thay thế duy nhất dữ liệu thuộc khách demo, không sửa khách hàng thật. Chạy lại cho cùng kết quả và không nhân bản dữ liệu.

## Access

Seeder in thông tin đăng nhập sau khi hoàn tất. PT demo xem màn quản trị tiến độ; khách demo xem màn hành trình chỉ đọc.
