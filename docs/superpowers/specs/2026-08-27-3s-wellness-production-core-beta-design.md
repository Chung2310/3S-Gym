# 3S Wellness Production Core and Beta Design

## 1. Mục tiêu

Triển khai hệ thống 3S Wellness từ ngày 28/08/2026 đến hết ngày 06/09/2026 với hai tầng phát hành:

- `Production Core`: các chức năng nền tảng và Đợt 1 được kiểm thử, nghiệm thu và mở cho toàn hệ thống.
- `Beta`: toàn bộ nhóm chức năng Đợt 2, Đợt 3 và các chức năng nâng cao được triển khai theo luồng dọc, giới hạn cho tài khoản pilot bằng feature flag.

Sau ngày 06/09/2026, các module beta tiếp tục được hardening theo master roadmap trước khi được nâng lên production.

## 2. Ràng buộc thực hiện

- Thời gian: từ 28/08/2026 đến hết 06/09/2026, múi giờ Asia/Saigon.
- Nhân lực: hai lập trình viên toàn thời gian và AI agent hỗ trợ.
- Phân công theo chức năng; mỗi lập trình viên sở hữu trọn luồng backend, frontend và kiểm thử của chức năng được giao.
- Giữ nền tảng React 19, React Router 7, Vite 8, Express 5, MongoDB/Mongoose, JWT, Vitest, Testing Library và Supertest.
- Backend tiếp tục tuân thủ Route → Controller → Service → Model.
- Hoàn thành migration TypeScript đang dang dở trước khi mở rộng chức năng.
- Không thay đổi schema theo cách phá vỡ dữ liệu hiện có trong đợt phát hành.

## 3. Kiến trúc phát hành

### 3.1 Production Core

Production Core gồm:

- Đăng nhập và phân quyền Admin, PT, Khách hàng.
- Quản lý tài khoản PT.
- CRM khách hàng, tài khoản khách và gói PT.
- Chuyển khách giữa các PT.
- InBody cơ bản.
- Mục tiêu.
- Giáo án cơ bản.
- Dinh dưỡng cơ bản.
- Quy trình nháp → công bố → thu hồi.
- Portal để khách xem nội dung đã được công bố.

Production Core không phụ thuộc dịch vụ AI hoặc OCR để duy trì hoạt động.

### 3.2 Beta có feature flag

Các module sau phải có mặt nhưng chỉ mở cho nhóm PT pilot:

- OCR InBody.
- Goal & Roadmap theo phase, tuần và buổi.
- Thư viện bài tập và giáo án nâng cao.
- Check-in buổi tập và Progress Tracking.
- Biểu đồ và báo cáo tiến độ.
- Nutrition & Calories nâng cao.
- AI tạo nháp giáo án và thực đơn.
- Customer Care, cảnh báo và việc cần làm.
- Dashboard PT và Dashboard Admin.
- Thông báo trong ứng dụng và lịch nội bộ.
- Knowledge Base và tìm kiếm RAG.
- PT Assistant.

Mỗi module beta có feature flag độc lập. Backend kiểm tra flag và quyền truy cập; việc ẩn menu ở frontend không được xem là kiểm soát truy cập.

## 4. Thiết kế chức năng

### 4.1 Nền tảng và phân quyền

- Hoàn tất chuyển mã nguồn backend, frontend, test và cấu hình sang TypeScript/TSX strict.
- Chuẩn hóa cấu hình MongoDB và biến môi trường.
- Giữ response API thống nhất, thông báo tiếng Việt và request ID.
- Mọi quyền sở hữu khách được kiểm tra tại service theo dữ liệu hiện tại, không chỉ theo role.
- Admin có toàn quyền; PT chỉ thao tác trên khách đang phụ trách; khách chỉ xem dữ liệu đã công bố của chính mình.

### 4.2 CRM và gói PT

- Quản lý hồ sơ khách, tài khoản khách, PT phụ trách và trạng thái.
- Quản lý gói PT, tổng số buổi, số buổi đã dùng và số buổi còn lại.
- Chuyển PT theo yêu cầu hai bên; Admin có thể ép chuyển với lý do.
- Giữ toàn bộ lịch sử khi thay đổi PT phụ trách.

### 4.3 InBody và OCR

- Nhập thủ công các chỉ số InBody và lưu lịch sử đo.
- OCR nhận phiếu InBody và tạo dữ liệu nháp.
- PT phải xem ảnh nguồn, kiểm tra và chỉnh sửa kết quả OCR trước khi xác nhận.
- So sánh các lần đo, hiển thị biểu đồ và cảnh báo chỉ số theo rule cấu hình.
- Không đưa ra chẩn đoán y khoa.

### 4.4 Goal, Roadmap, Workout và Progress

- Mục tiêu có baseline, chỉ số đích, thời hạn và trạng thái công bố.
- Roadmap gồm nhiều phase; mỗi phase có tuần, mục tiêu, mốc đánh giá và lịch buổi tập.
- Thư viện bài tập quản lý nhóm cơ, level, thiết bị, video, kỹ thuật, lỗi thường gặp, chống chỉ định và biến thể.
- Giáo án có template, phiên bản, buổi tập và chi tiết sets, reps, weight, RPE/RIR, tempo, nghỉ và ghi chú.
- Check-in lưu kết quả thực tế, trạng thái có mặt/vắng/muộn, cảm nhận và ghi chú.
- Buổi tập hoàn thành cập nhật số buổi đã dùng theo rule do Admin cấu hình.
- Dữ liệu check-in giữ snapshot giáo án để chỉnh sửa giáo án sau này không làm sai lịch sử.
- Progress Tracking gồm cân nặng, body fat, SMM, số đo, thành tích, tần suất tập và ảnh Before/After.
- Báo cáo tiến độ chỉ hiển thị cho khách sau khi PT công bố.

### 4.5 Nutrition & Calories

- Quản lý BMR, TDEE, calories mục tiêu và macro.
- Quản lý thực đơn, bữa ăn, món ăn thay thế và theo dõi lượng ăn.
- Thư viện hoạt động hỗ trợ ước tính calories tiêu hao dựa trên cân nặng, thời gian và cường độ.
- Công thức và hệ số phải cấu hình được và có phiên bản.
- AI có thể tạo thực đơn nháp; PT phải duyệt trước khi áp dụng hoặc công bố.

### 4.6 Customer Care và thông báo

- Phân loại khách theo trạng thái nghiệp vụ.
- Sinh cảnh báo cho khách 5 ngày chưa tập, còn tối đa 5 buổi, 30 ngày chưa InBody, follow-up quá hạn hoặc đến mốc đánh giá.
- Màn hình “Việc cần làm hôm nay” tổng hợp lịch tập, chăm sóc, InBody, gói sắp hết và khách rủi ro.
- PT có thể xử lý cảnh báo, tạo nhiệm vụ, đặt hạn và ghi kết quả.
- Lưu lịch sử để tránh sinh cảnh báo trùng bất hợp lý.
- Thông báo trong ứng dụng và lịch nội bộ thuộc phạm vi beta; tích hợp kênh bên ngoài được thực hiện trong giai đoạn hardening.

### 4.7 Dashboard

- Dashboard PT hiển thị tổng khách, trạng thái tiến độ, khách nổi bật, khách cần quan tâm và công việc hôm nay.
- Dashboard Admin hiển thị tổng quan PT, khách, gói PT, cảnh báo và mức sử dụng hệ thống.
- Điểm tiến độ được tính bằng rule có cấu hình và có giải thích.
- AI chỉ diễn giải kết quả; AI không quyết định điểm.
- Khi thiếu dữ liệu, hiển thị “Chưa đủ dữ liệu” và không xếp hạng.
- Mỗi chỉ số phải liên kết ngược về hồ sơ hoặc dữ liệu nguồn.

### 4.8 Knowledge Base, RAG và PT Assistant

- Knowledge Base quản lý tài liệu theo chủ đề, phiên bản, trạng thái nháp/xuất bản, người duyệt và ngày hiệu lực.
- Chỉ nội dung đã xuất bản được lập chỉ mục và dùng làm nguồn RAG.
- PT chọn khách hoặc nhập ngữ cảnh; backend chỉ lấy dữ liệu khách thuộc quyền của PT.
- Assistant trả phân tích, đề xuất, kịch bản tư vấn và danh sách nguồn đã sử dụng.
- AI có thể tạo nháp giáo án và thực đơn nhưng không tự áp dụng.
- Kết quả luôn có trạng thái “PT cần kiểm tra và phê duyệt”.
- Assistant không tự gửi cho khách, tự công bố, thay đổi hồ sơ hoặc đưa ra chẩn đoán, đơn thuốc hay kết luận y khoa.
- Lưu nhật ký yêu cầu, kết quả, nguồn, người phê duyệt và hành động sau phê duyệt.

## 5. Mô hình dữ liệu

Tiếp tục sử dụng các model hiện có:

- `User`
- `CustomerProfile`
- `PtPackage`
- `TransferRequest`
- `InBodyRecord`
- `Goal`
- `WorkoutPlan`
- `NutritionPlan`

Bổ sung các nhóm model:

- Lộ trình: `Roadmap`, `RoadmapPhase`.
- Tập luyện: `Exercise`, `WorkoutTemplate`, `WorkoutSession`, `ExerciseSetLog`.
- Tiến độ: `BodyMeasurement`, `ProgressReport`, `Achievement`.
- Chăm sóc: `CareAlert`, `CareTask`, `CareLog`.
- AI: `KnowledgeDocument`, `KnowledgeChunk`, `AssistantConversation`, `AssistantSuggestion`.
- Hệ thống: `FeatureFlag`, `AuditLog`, `Notification`.

Mọi bản ghi sức khỏe, công bố, AI và chuyển giao khách phải lưu người tạo, người cập nhật và thời gian. Các thao tác quan trọng phải có audit log.

## 6. Xử lý lỗi và khả năng suy giảm an toàn

- Dùng error middleware hiện có và mã lỗi ổn định cho frontend.
- Không trả stack trace, raw database error, secret hoặc dữ liệu kỹ thuật nhạy cảm.
- Lỗi AI, OCR hoặc vector search không được làm gián đoạn CRM và nhập liệu thủ công.
- Khi OCR lỗi, PT vẫn có thể nhập InBody thủ công.
- Khi AI lỗi, PT vẫn có thể tạo giáo án và thực đơn thủ công.
- Khi dashboard không đủ dữ liệu, hiển thị trạng thái thiếu dữ liệu thay vì kết quả suy đoán.
- Công bố, thu hồi, chuyển PT, áp dụng nội dung AI và thao tác phá hủy dùng modal xác nhận và Toast.

## 7. Kiểm thử và điều kiện phát hành

### 7.1 Production Core

Chỉ phát hành khi đáp ứng đồng thời:

- Toàn bộ test hiện có đạt.
- TypeScript strict, lint và production build đạt.
- Kiểm thử phân quyền Admin/PT/Khách đạt.
- Luồng Admin tạo PT → PT tạo khách → nhập nội dung → công bố → khách xem đạt.
- Luồng chuyển PT giữ dữ liệu và chặn PT cũ sửa khách đạt.
- Responsive tại chiều rộng 320 px không có thao tác chính buộc cuộn ngang.
- Backup và rollback đã được chạy thử.
- Không còn lỗi nghiêm trọng hoặc cao chưa xử lý.

### 7.2 Module beta

Mỗi module beta phải có:

- Test API cho luồng chính, validation và quyền sở hữu dữ liệu.
- Test component cho thao tác quan trọng.
- Smoke test tích hợp.
- Feature flag được xác minh có thể tắt tức thời.
- OCR và nội dung AI vào trạng thái nháp, bắt buộc PT xác nhận.
- Nhật ký audit cho thao tác quan trọng.

Module beta không được tuyên bố đạt production cho đến khi hoàn tất hardening, kiểm thử tải, kiểm thử bảo mật, nghiệm thu nghiệp vụ và kế hoạch vận hành tương ứng.

## 8. Phân công theo chức năng

### 8.1 Lập trình viên 1 — Nền tảng, khách hàng và tập luyện

Sở hữu trọn luồng backend, frontend và kiểm thử của:

- Migration TypeScript và ổn định nền tảng.
- Đăng nhập, phân quyền và feature flag.
- CRM, gói PT và chuyển PT.
- InBody và OCR.
- Goal & Roadmap.
- Thư viện bài tập, giáo án và check-in.
- Progress Tracking và cập nhật số buổi gói PT.
- Backup, migration dữ liệu và hỗ trợ triển khai.

### 8.2 Lập trình viên 2 — Dinh dưỡng, chăm sóc và AI

Sở hữu trọn luồng backend, frontend và kiểm thử của:

- Nutrition & Calories.
- AI tạo thực đơn nháp.
- Customer Care, cảnh báo và việc cần làm.
- Dashboard PT và Dashboard Admin.
- Notification trong ứng dụng và lịch nội bộ.
- Knowledge Base và RAG.
- PT Assistant và nhật ký phê duyệt.
- Responsive cho các module phụ trách.

### 8.3 Review chéo

| Hạng mục | Owner | Reviewer |
|---|---|---|
| API contract và response chuẩn | Lập trình viên 1 | Lập trình viên 2 |
| Component dùng chung, modal và Toast | Lập trình viên 2 | Lập trình viên 1 |
| Phân quyền và bảo vệ dữ liệu khách | Lập trình viên 1 | Lập trình viên 2 |
| An toàn AI và quy trình PT duyệt | Lập trình viên 2 | Lập trình viên 1 |
| Test tích hợp toàn hệ thống | Lập trình viên 1 | Lập trình viên 2 |
| Responsive và nghiệm thu UI | Lập trình viên 2 | Lập trình viên 1 |
| Deploy, backup và rollback | Lập trình viên 1 | Lập trình viên 2 |

AI agent hỗ trợ hai lập trình viên theo từng chức năng bằng cách phân tích yêu cầu, viết test trước, triển khai nhiệm vụ nhỏ, rà soát contract, kiểm tra hồi quy và tài liệu hóa. Mọi thay đổi do AI tạo phải được một lập trình viên đọc diff và chạy kiểm thử trước khi merge.

## 9. Kết quả bàn giao ngày 06/09/2026

- Production Core hoạt động trên môi trường production.
- Tất cả nhóm chức năng trong tài liệu `App hỗ trợ PT_3S Wellness.xlsx` có mặt trong hệ thống.
- Đợt 2, Đợt 3 và các chức năng nâng cao chạy dưới beta có feature flag cho nhóm pilot.
- Có backup, quy trình rollback, health check và audit log cho thao tác quan trọng.
- Có báo cáo kết quả kiểm thử, danh sách lỗi/tồn đọng và master roadmap hardening 8–12 tuần.
- Không gắn nhãn production cho module beta khi chưa đạt đủ điều kiện phát hành production.

