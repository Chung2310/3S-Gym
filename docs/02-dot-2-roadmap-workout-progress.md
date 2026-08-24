# Đợt 2 — Roadmap, giáo án và theo dõi tiến độ

## 1. Mục tiêu và ranh giới

Đợt 2 biến các nội dung cơ bản ở Đợt 1 thành hành trình có thể thực thi và đo lường. Dữ liệu vẫn do PT nhập; khách tiếp tục chủ yếu xem nội dung đã công bố. Nếu sau này cho khách check-in, đó là hạng mục mở rộng riêng.

## 2. Module F — Goal & Roadmap chi tiết

### Chức năng

- Tạo roadmap từ mục tiêu + InBody + lịch tập: thời lượng, phase, tuần và mốc đánh giá.
- Mỗi phase có mục tiêu, tiêu chí hoàn thành, calories/macro mục tiêu, tần suất tập/cardio và lưu ý.
- PT có thể dùng mẫu, chỉnh sửa hoặc tạo mới; hệ thống có thể đề xuất nhưng không tự áp dụng.
- So sánh mục tiêu kế hoạch với kết quả thực tế, hiển thị trạng thái đúng tiến độ/chậm/rủi ro.

### Dữ liệu

`Roadmap`, `RoadmapPhase`, `RoadmapWeek`, `Milestone`, `RoadmapRevision`.

### Quy tắc

- Một khách chỉ có một roadmap `active` tại một thời điểm.
- Sửa roadmap đã công bố tạo phiên bản mới, không ghi đè lịch sử.
- PT phải xác định mốc InBody/đánh giá lại cho từng phase.

## 3. Module G — Thư viện bài tập và giáo án nâng cao

### Thư viện bài tập

- Quản lý tên, nhóm cơ, level, thiết bị, video, mô tả kỹ thuật, lỗi thường gặp, chống chỉ định và biến thể.
- Admin quản lý thư viện dùng chung; PT có thể tạo bài tập riêng nếu được cấp quyền.

### Giáo án nâng cao

- Tạo template theo mục tiêu/level, sao chép và gán khách.
- Lập lịch buổi tập theo tuần/phase; mỗi bài có sets, reps, weight, RPE/RIR, tempo, nghỉ, ghi chú.
- Lưu phiên bản để biết khách đã tập theo giáo án nào ở từng thời điểm.

### Tiêu chí nghiệm thu

- Khi PT sửa giáo án hiện hành, lịch sử check-in cũ vẫn hiển thị đúng phiên bản bài tập cũ.
- Giáo án công bố có thể xem được ở tài khoản khách.

## 4. Module H — Progress Tracking

### Check-in do PT nhập

- Tạo buổi check-in: ngày tập, giáo án/buổi tập, bài đã tập, sets/reps/weight thực tế, thành tích, RPE, cảm nhận và ghi chú.
- Lưu số đo, cân nặng, ảnh tiến độ và sự kiện quan trọng.
- Đánh dấu buổi có mặt/vắng/muộn, lý do vắng nếu có.

### Báo cáo tiến độ

- Biểu đồ cân nặng, % mỡ, SMM, số đo, mức tạ/rep và tần suất tập.
- So sánh với baseline, mục tiêu phase và mốc gần nhất.
- Báo cáo tóm tắt theo tuần/tháng để PT công bố cho khách.

### Dữ liệu

`WorkoutSession`, `ExerciseSetLog`, `BodyMeasurement`, `ProgressReport`, `Achievement`.

## 5. Tích hợp liên module

- Check-in buổi tập tự động cập nhật số buổi đã dùng của gói PT theo quy tắc do Admin cấu hình.
- Dữ liệu Progress là đầu vào cho đánh giá roadmap, Customer Care và Dashboard ở Đợt 3.
- Lần InBody mới có thể gợi ý đánh giá lại mục tiêu, nhưng PT quyết định áp dụng.

## 6. Kiểm thử chấp nhận

- PT tạo roadmap 12 tuần gồm nhiều phase/tuần, công bố và khách xem được đúng bản hiện hành.
- PT ghi buổi tập; biểu đồ và báo cáo phản ánh dữ liệu vừa lưu.
- Sửa giáo án không làm sai dữ liệu của buổi đã hoàn thành.
- PT khác không thể xem hay ghi check-in cho khách không thuộc quyền quản lý.
- Danh sách roadmap, giáo án, buổi tập, số đo và báo cáo đều có phân trang/bộ lọc; thao tác công bố/thu hồi dùng popup xác nhận và trả kết quả bằng Toast.
