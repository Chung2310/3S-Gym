# Kế hoạch triển khai ứng dụng 3S Wellness

**Thời gian dự kiến:** 28/08/2026–05/09/2026  
**Quy mô vận hành ban đầu:** Khoảng 300 tài khoản khách hàng và PT  
**Đối tượng tài liệu:** Đại diện 3S Wellness, quản lý vận hành và người nghiệm thu

## 1. Mục tiêu của ứng dụng

3S Wellness là ứng dụng web hỗ trợ quản lý xuyên suốt hành trình tập luyện và chăm sóc khách hàng. Hệ thống giúp:

- Quản lý tập trung tài khoản PT, hồ sơ khách hàng và gói tập.
- Lưu trữ kết quả InBody, mục tiêu, giáo án, dinh dưỡng và tiến độ tập luyện.
- Giúp PT xây dựng, kiểm tra và công bố kế hoạch phù hợp cho từng khách hàng.
- Giúp khách hàng theo dõi nội dung đã được PT phê duyệt trên tài khoản riêng.
- Cung cấp dashboard và cảnh báo để quản lý, PT chủ động chăm sóc khách.
- Ứng dụng OCR và AI để giảm thao tác nhập liệu, hỗ trợ soạn nội dung và tra cứu kiến thức; PT luôn là người kiểm tra và quyết định cuối cùng.

Ứng dụng được tối ưu để sử dụng trên cả máy tính và điện thoại. Các chức năng quan trọng được ưu tiên tính ổn định, bảo mật dữ liệu và khả năng kiểm soát quyền truy cập.

## 2. Đối tượng sử dụng và chức năng chính

### 2.1. Quản lý/Admin

- Tạo, cập nhật và khóa tài khoản PT.
- Xem và quản lý toàn bộ khách hàng trong hệ thống.
- Phân công hoặc chuyển khách hàng giữa các PT, đồng thời lưu lại lịch sử bàn giao.
- Theo dõi dashboard tổng quan về khách hàng, tiến độ và hoạt động chăm sóc.
- Quản lý quyền truy cập và các tính năng thử nghiệm.

### 2.2. Huấn luyện viên/PT

- Quản lý các khách hàng đang được phân công.
- Tạo và cập nhật hồ sơ, gói tập, thông tin sức khỏe và kết quả InBody.
- Nhập phiếu InBody thủ công hoặc sử dụng OCR để hỗ trợ đọc dữ liệu từ hình ảnh; PT kiểm tra trước khi lưu.
- Thiết lập mục tiêu, lộ trình theo giai đoạn/tuần, giáo án tập luyện và kế hoạch dinh dưỡng.
- Cập nhật buổi tập, mức độ hoàn thành, chỉ số cơ thể và hình ảnh tiến độ.
- Tạo báo cáo và chủ động công bố nội dung để khách hàng xem.
- Theo dõi cảnh báo chăm sóc, công việc cần xử lý và lịch sử tương tác với khách.
- Sử dụng AI để tạo bản nháp giáo án, thực đơn, nội dung chăm sóc hoặc tra cứu tài liệu nội bộ.

### 2.3. Khách hàng

- Đăng nhập bằng tài khoản riêng.
- Xem hồ sơ và kết quả InBody của chính mình.
- Xem mục tiêu, lộ trình, giáo án và kế hoạch dinh dưỡng đã được PT công bố.
- Theo dõi tiến độ và báo cáo qua từng giai đoạn.
- Không tự ý chỉnh sửa dữ liệu chuyên môn hoặc xem dữ liệu của người khác.

## 3. Flow hoạt động dự kiến

```text
Quản lý tạo tài khoản và phân công PT
                  ↓
PT tiếp nhận, tạo hồ sơ và gói tập cho khách
                  ↓
PT nhập hoặc chụp phiếu InBody
                  ↓
Hệ thống hỗ trợ đọc dữ liệu → PT kiểm tra và xác nhận
                  ↓
PT đặt mục tiêu, xây lộ trình tập luyện và dinh dưỡng
                  ↓
PT duyệt và công bố nội dung
                  ↓
Khách đăng nhập để xem kế hoạch đã được công bố
                  ↓
PT cập nhật buổi tập, chỉ số và hình ảnh tiến độ
                  ↓
Hệ thống tổng hợp báo cáo và cảnh báo chăm sóc
                  ↓
AI hỗ trợ PT soạn đề xuất → PT duyệt → mới được áp dụng
```

### Nguyên tắc kiểm soát nội dung

- PT chỉ quản lý khách hàng đang được phân công.
- Khách hàng chỉ xem dữ liệu của chính mình và chỉ thấy nội dung PT đã công bố.
- Nội dung chưa hoàn thiện được lưu ở trạng thái bản nháp, không hiển thị cho khách.
- AI và OCR chỉ hỗ trợ tạo dữ liệu/bản nháp; không tự lưu kết quả cuối cùng, tự gửi hoặc tự công bố.
- AI không thay thế chẩn đoán y khoa. Các trường hợp đau, chấn thương, bệnh lý hoặc chỉ số rủi ro phải được chuyên gia phù hợp kiểm tra.

## 4. Các nhóm chức năng bàn giao

### 4.1. Nền tảng và quản lý khách hàng

- Đăng nhập và phân quyền theo vai trò Quản lý, PT và Khách hàng.
- Quản lý tài khoản, hồ sơ khách, gói PT và lịch sử thay đổi.
- Chuyển giao khách hàng giữa các PT có bước xác nhận và lưu lịch sử.
- Phân trang, tìm kiếm và lọc danh sách để vận hành với khoảng 300 tài khoản ban đầu.

### 4.2. InBody, mục tiêu và lộ trình

- Lưu kết quả InBody theo từng lần đo.
- Hỗ trợ OCR để đọc phiếu InBody; PT có màn hình kiểm tra và sửa trước khi xác nhận.
- Thiết lập mục tiêu và lộ trình theo giai đoạn, tuần.
- Lưu lịch sử để so sánh thay đổi theo thời gian.

### 4.3. Giáo án, dinh dưỡng và tiến độ

- Thư viện bài tập và mẫu giáo án.
- Xây dựng kế hoạch tập luyện theo từng giai đoạn.
- Lập kế hoạch dinh dưỡng và calories ở mức phù hợp với phạm vi sản phẩm.
- Ghi nhận buổi tập, mức độ hoàn thành và chỉ số tiến độ.
- Tạo báo cáo có biểu đồ và công bố cho khách hàng.

### 4.4. Chăm sóc khách hàng và dashboard

- Danh sách công việc chăm sóc và lịch sử liên hệ.
- Cảnh báo khách hàng cần quan tâm dựa trên các quy tắc đã thống nhất.
- Dashboard cho PT theo nhóm khách mình phụ trách.
- Dashboard cho quản lý theo dữ liệu toàn hệ thống.

### 4.5. OCR, kho kiến thức và trợ lý AI

- OCR hỗ trợ nhập dữ liệu từ phiếu InBody.
- AI hỗ trợ tạo bản nháp giáo án, dinh dưỡng và nội dung chăm sóc.
- Kho kiến thức nội bộ giúp AI trả lời dựa trên tài liệu đã được phê duyệt.
- Câu trả lời AI có nguồn tham khảo khi sử dụng tài liệu nội bộ.
- Mọi đề xuất của AI đều yêu cầu PT kiểm tra trước khi áp dụng.

Các chức năng OCR, AI, dashboard nâng cao và kho kiến thức được mở thử nghiệm có kiểm soát cho nhóm người dùng pilot. Các chức năng cốt lõi vẫn có thể hoạt động thủ công khi dịch vụ AI hoặc OCR tạm thời không khả dụng.

## 5. Kế hoạch triển khai dự kiến

Lịch dưới đây chỉ tính ngày triển khai thực tế, không bố trí công việc vào Chủ nhật và ngày nghỉ lễ Quốc khánh 02/09.

| Ngày | Nội dung thực hiện | Kết quả khách hàng có thể kiểm tra |
|---|---|---|
| **28/08/2026** | Hoàn thiện nền tảng kỹ thuật, chuẩn hóa hệ thống và giao diện theo ba vai trò | Quản lý, PT và khách hàng đăng nhập đúng khu vực chức năng |
| **29/08/2026** | Hoàn thiện phân quyền, bảo mật dữ liệu, quản lý tài khoản và hồ sơ khách hàng | Mỗi PT chỉ quản lý khách được phân công; khách chỉ xem dữ liệu của mình |
| **31/08/2026** | Hoàn thiện InBody, nhập liệu/OCR và quản lý mục tiêu | PT nhập hoặc quét phiếu InBody, kiểm tra dữ liệu và thiết lập mục tiêu |
| **01/09/2026** | Xây dựng lộ trình, thư viện bài tập, giáo án và dinh dưỡng | PT tạo kế hoạch theo giai đoạn/tuần; nội dung do AI hỗ trợ ở trạng thái chờ duyệt |
| **03/09/2026** | Hoàn thiện theo dõi buổi tập, tiến độ, hình ảnh và báo cáo cho khách | PT cập nhật kết quả; khách xem báo cáo đã được công bố |
| **04/09/2026** | Hoàn thiện chăm sóc khách hàng, dashboard, thông báo và trợ lý AI | Quản lý/PT xem cảnh báo; AI hỗ trợ tra cứu và soạn đề xuất có nguồn |
| **05/09/2026** | Kiểm thử toàn bộ hành trình, sao lưu/khôi phục, nghiệm thu và chuẩn bị bàn giao | Chạy thử từ Quản lý → PT → Khách hàng; chốt bản phát hành và tài liệu hướng dẫn |

### Ngày không triển khai

- **30/08/2026:** Chủ nhật.
- **02/09/2026:** Nghỉ lễ Quốc khánh.
- **06/09/2026:** Chủ nhật; không bố trí công việc. Mốc hoàn thành kỹ thuật và chuẩn bị bàn giao là cuối ngày 05/09/2026.

### Điều kiện để bảo đảm tiến độ

- Khách hàng cung cấp kịp thời tài khoản, logo/nội dung nhận diện và dữ liệu mẫu cần thiết.
- 3S Wellness cung cấp hoặc xác nhận các quy tắc chuyên môn, công thức, mẫu giáo án và tài liệu dùng cho AI.
- Đại diện khách hàng phản hồi và xác nhận kết quả kiểm tra theo lịch thống nhất.
- Các thay đổi lớn ngoài phạm vi nêu trong tài liệu sẽ được đánh giá lại về thời gian.

## 6. Phạm vi nghiệm thu và bàn giao

### Chức năng cốt lõi

Các chức năng đăng nhập, phân quyền, CRM khách hàng, gói tập, InBody cơ bản, mục tiêu, giáo án, dinh dưỡng cơ bản và cổng thông tin khách hàng được ưu tiên hoàn thiện ổn định để đưa vào sử dụng.

### Chức năng thử nghiệm có kiểm soát

Các chức năng OCR, lộ trình nâng cao, theo dõi tiến độ, Customer Care, dashboard, Knowledge Base và PT Assistant được mở cho nhóm pilot. Từng chức năng có thể được bật/tắt riêng để không ảnh hưởng đến phần cốt lõi.

### Điều kiện nghiệm thu chính

- Ba vai trò đăng nhập và truy cập đúng phạm vi dữ liệu.
- PT thực hiện được hành trình từ tạo hồ sơ đến công bố kế hoạch cho khách.
- Khách chỉ xem được nội dung đã công bố của chính mình.
- Dữ liệu AI/OCR phải qua bước PT kiểm tra.
- Không còn lỗi nghiêm trọng làm gián đoạn hành trình chính.
- Sao lưu, khôi phục và phương án quay lại phiên bản ổn định đã được kiểm tra.

## 7. Chi phí triển khai

Chi phí nhân sự phát triển, thiết kế và triển khai phần mềm **không thuộc phạm vi ước tính của tài liệu này**. Phần dưới đây chỉ tính các dịch vụ cần duy trì để hệ thống hoạt động hàng tháng.

## 8. Chi phí duy trì hàng tháng dự kiến

### 8.1. Dịch vụ nền tảng

| Hạng mục | Phương án ban đầu | Chi phí dự kiến/tháng |
|---|---|---:|
| VPS Vietnix | Gói 168.000đ, chạy ứng dụng, API và MongoDB | **168.000đ** |
| MongoDB | Cài đặt và vận hành chung trên VPS | **0đ phí thuê dịch vụ riêng** |
| Cloudinary | Gói Free để lưu ảnh, video và tài liệu | **0đ** khi chưa vượt hạn mức |
| OpenRouter/Gemini 2.5 Flash | Thanh toán theo lượng token thực tế | **Biến đổi theo mức sử dụng** |

VPS 168.000đ/tháng phù hợp để khởi đầu và chạy pilot. Do ứng dụng và MongoDB cùng sử dụng một máy chủ, cần theo dõi CPU, RAM và dung lượng ổ đĩa. Hệ thống có thể cần nâng cấu hình khi số người dùng đồng thời, dữ liệu hoặc lưu lượng tăng.

### 8.2. Lưu trữ Cloudinary

Gói Cloudinary Free hiện có **25 credit mỗi tháng**, dùng chung cho dung lượng lưu trữ, xử lý/biến đổi nội dung và băng thông phân phối. Một credit có thể tương đương 1 GB lưu trữ, 1 GB băng thông ảnh/video trên gói Free hoặc 1.000 lượt biến đổi ảnh.

- Chi phí ban đầu: **0đ/tháng** khi tổng sử dụng chưa vượt hạn mức Free.
- Video thường tiêu tốn dung lượng và băng thông nhanh hơn ảnh, vì vậy cần giới hạn kích thước/tần suất tải lên và theo dõi dashboard Cloudinary.
- Nếu cần nâng cấp, gói Plus hiện được niêm yết **99 USD/tháng**, tương đương khoảng **2.623.500đ/tháng** theo tỷ giá giả định 26.500đ/USD.
- Chỉ nâng cấp sau khi có số liệu vận hành thực tế hoặc khi hạn mức Free không còn đáp ứng được nhu cầu.

Tham khảo: [Cloudinary Pricing](https://cloudinary.com/pricing) và [Cloudinary Billing and Plans](https://cloudinary.com/documentation/billing_and_plans).

### 8.3. Chi phí AI qua OpenRouter

Mô hình dự kiến sử dụng: `google/gemini-2.5-flash`.

Đơn giá tham chiếu tại thời điểm lập tài liệu:

- Token đầu vào: **0,30 USD/1 triệu token**.
- Token đầu ra: **2,50 USD/1 triệu token**.
- OpenRouter thu phí **5,5% khi mua credit**, tối thiểu 0,80 USD cho mỗi lần nạp.

Để ước tính, mỗi lượt AI được giả định sử dụng trung bình:

- 6.000 token đầu vào, gồm yêu cầu, ngữ cảnh khách hàng và nội dung tra cứu.
- 1.000 token đầu ra cho phần gợi ý hoặc bản nháp.
- Tỷ giá quy đổi: **26.500đ/USD**.

| Mức sử dụng | Số lượt AI/tháng | Chi phí AI ước tính | Tổng gồm VPS |
|---|---:|---:|---:|
| Thấp | 1.500 lượt | khoảng **180.000đ** | khoảng **348.000đ/tháng** |
| Trung bình | 4.500 lượt | khoảng **540.000đ** | khoảng **708.000đ/tháng** |
| Cao | 9.000 lượt | khoảng **1.080.000đ** | khoảng **1.248.000đ/tháng** |

Chi phí thực tế phụ thuộc vào số lượt gọi AI, độ dài tài liệu gửi vào, độ dài câu trả lời, lượng token suy luận, tỷ giá và bảng giá của nhà cung cấp. Số tiền mua credit tối thiểu và phí thanh toán có thể làm số tiền nạp ban đầu cao hơn chi phí sử dụng trong một tháng; credit còn lại được dùng cho các tháng tiếp theo theo chính sách của OpenRouter.

Tham khảo: [Gemini 2.5 Flash trên OpenRouter](https://openrouter.ai/google/gemini-2.5-flash) và [OpenRouter FAQ về phí và credit](https://openrouter.ai/docs/faq).

### 8.4. Ngân sách khuyến nghị ban đầu

Trong giai đoạn chạy thử với khoảng 300 tài khoản khách hàng và PT:

- Ngân sách vận hành khuyến nghị: **350.000–710.000đ/tháng**.
- Mức này gồm VPS và lượng sử dụng AI từ thấp đến trung bình.
- Cloudinary được giả định vẫn nằm trong gói Free.
- Nên đặt hạn mức chi tiêu trên OpenRouter và cảnh báo sử dụng trên Cloudinary.
- Sau 1–2 tháng vận hành, đối chiếu số liệu thực tế để điều chỉnh ngân sách và cấu hình VPS.

### 8.5. Các khoản chưa bao gồm

- Chi phí nâng cấu hình VPS khi tải thực tế vượt khả năng gói ban đầu.
- Chi phí Cloudinary trả phí khi vượt hạn mức Free.
- Tên miền, email/SMS/Zalo OA hoặc dịch vụ bên thứ ba khác nếu được bổ sung sau này.
- Chi phí nhân sự vận hành, hỗ trợ người dùng, bảo trì hoặc phát triển tính năng mới.
- Thuế, phí chuyển đổi ngoại tệ và biến động tỷ giá khi thanh toán dịch vụ quốc tế.

## 9. Lưu ý về số liệu ước tính

Các mức giá dịch vụ quốc tế có thể thay đổi theo chính sách nhà cung cấp. Trước khi đưa hệ thống vào vận hành chính thức, cần kiểm tra lại bảng giá Cloudinary, OpenRouter và tỷ giá thanh toán thực tế. Nên cấu hình cảnh báo ngân sách để mọi khoản tăng chi phí đều được phát hiện sớm.
