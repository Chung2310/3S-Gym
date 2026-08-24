# 3S Wellness — Tổng quan sản phẩm và lộ trình ba đợt

## 1. Mục tiêu

Xây dựng ứng dụng web cho 3S Wellness để PT quản lý toàn bộ hành trình của khách: hồ sơ, InBody, mục tiêu, giáo án, dinh dưỡng, tiến độ và chăm sóc. Khách có tài khoản riêng để **xem** nội dung PT công bố. Admin quản lý toàn hệ thống.

Tài liệu này là nền tảng chung cho ba đặc tả triển khai:

1. [Đợt 1 — Nền tảng, CRM và nội dung cho khách](01-dot-1-nen-tang-crm-noi-dung-khach.md)
2. [Đợt 2 — Roadmap, giáo án và theo dõi tiến độ](02-dot-2-roadmap-workout-progress.md)
3. [Đợt 3 — Chăm sóc, dashboard và PT Assistant](03-dot-3-care-dashboard-ai.md)

## 2. Phân vai và phạm vi truy cập

| Vai trò | Phạm vi chính |
|---|---|
| Admin/Quản lý | Tạo/khoá tài khoản PT, xem và quản lý toàn bộ khách, xử lý chuyển PT bắt buộc, xem dashboard toàn hệ thống. |
| PT | Quản lý khách đang phụ trách; tạo nội dung nháp; công bố nội dung cho khách; gửi/nhận yêu cầu chuyển khách. |
| Khách hàng | Chỉ xem hồ sơ, InBody, mục tiêu/roadmap, giáo án, thực đơn và báo cáo mà PT đã công bố cho chính mình. Không sửa dữ liệu hoặc check-in ở Đợt 1. |

### Quy tắc bảo mật bắt buộc

- Mọi API phải xác thực bằng tài khoản đăng nhập và kiểm tra quyền ở backend, không chỉ ẩn nút ở giao diện.
- PT chỉ đọc/ghi khách mà mình đang phụ trách; sau chuyển giao, PT cũ không được chỉnh sửa khách đó.
- Khách chỉ truy cập bản dữ liệu đã công bố của hồ sơ gắn với tài khoản của họ.
- Admin được xem toàn hệ thống; thao tác chuyển bắt buộc phải có lý do.
- Các bản ghi sức khỏe, ảnh Before/After và phiếu InBody phải được lưu kèm người tạo, thời điểm tạo/cập nhật.

## 3. Quy trình chuyển khách giữa PT

```text
PT A (đang phụ trách) tạo yêu cầu → PT B (nhận khách) xác nhận
                                      └─ từ chối → không thay đổi người phụ trách
PT B xác nhận → hệ thống đổi PT phụ trách, ghi lịch sử bàn giao
Admin → có thể hủy hoặc chuyển bắt buộc, bắt buộc nhập lý do
```

Quy tắc nghiệp vụ:

- Một yêu cầu có trạng thái `pending`, `accepted`, `rejected`, `cancelled`, hoặc `admin_forced`.
- Chỉ PT đang phụ trách mới được khởi tạo hoặc hủy yêu cầu khi còn `pending`.
- Chỉ PT đích mới được xác nhận/từ chối.
- Khi hoàn tất, giữ nguyên toàn bộ lịch sử của khách; chỉ thay đổi PT phụ trách hiện tại.
- Không cho phép đồng thời nhiều yêu cầu đang chờ cho cùng một khách.

## 4. Quy tắc nháp và công bố

Các nội dung khách xem gồm: kết quả InBody, mục tiêu/roadmap, giáo án và thực đơn.

- PT tạo/chỉnh sửa ở trạng thái `draft`.
- PT chủ động `publish`; hệ thống lưu thời điểm công bố và phiên bản.
- Khách chỉ thấy phiên bản `published` mới nhất; PT vẫn xem lịch sử phiên bản.
- Thu hồi công bố chỉ ẩn nội dung với khách, không xóa dữ liệu lịch sử.

## 5. Lộ trình phụ thuộc

| Đợt | Kết quả kinh doanh | Điều kiện đầu ra |
|---|---|---|
| 1 | PT quản lý khách và khách xem được nội dung được cấp quyền. | Tài khoản/phân quyền, CRM, InBody cơ bản, mục tiêu, giáo án và thực đơn cơ bản hoạt động. |
| 2 | PT thiết kế lộ trình và đo lường kết quả có cấu trúc. | Roadmap phase/tuần, thư viện bài tập, check-in và báo cáo tiến độ hoạt động. |
| 3 | PT làm việc chủ động theo cảnh báo và được AI hỗ trợ có kiểm soát. | Customer Care, dashboard dữ liệu thật, Assistant và Knowledge Base hoạt động. |

## 6. Nguyên tắc chuyên môn và AI

- AI chỉ là công cụ đề xuất/trích xuất; PT phải kiểm tra và xác nhận trước khi công bố hoặc dùng để tư vấn.
- Không đưa ra chẩn đoán y khoa. Với đau, chấn thương, bệnh lý hay chỉ số rủi ro, hệ thống chỉ hiển thị cảnh báo và khuyến nghị theo quy trình 3S/chuyên gia phù hợp.
- Công thức BMR/TDEE, macro, ngưỡng cảnh báo và nội dung Knowledge Base phải cấu hình được, có chủ sở hữu chuyên môn phê duyệt.

## 7. Chuẩn kỹ thuật bắt buộc cho mọi đợt

### Backend

- Mỗi module backend phải tách đúng bốn tầng: **Route → Controller → Service → Model**.
  - `Route`: khai báo endpoint, middleware xác thực/phân quyền và middleware validate.
  - `Controller`: nhận request, gọi service, trả HTTP response; không chứa nghiệp vụ phức tạp.
  - `Service`: chứa quy tắc nghiệp vụ, kiểm tra quyền theo dữ liệu và điều phối model/tích hợp ngoài.
  - `Model`: định nghĩa schema, index, quan hệ và ràng buộc dữ liệu MongoDB.
- Mọi route, bao gồm route đọc danh sách, bắt buộc validate dữ liệu đầu vào: params, query, body và file upload (nếu có). Request không hợp lệ phải trả lỗi 400 theo mẫu response thống nhất.
- Mọi API trả danh sách bắt buộc hỗ trợ phân trang và bộ lọc. Query chuẩn: `page`, `limit`, `sort`, `order`; module bổ sung filter theo nghiệp vụ (ví dụ `status`, `ptId`, `keyword`, `fromDate`, `toDate`). Response phải trả metadata phân trang.
- Chuẩn response thành công:

```json
{
  "success": true,
  "message": "Lấy danh sách khách hàng thành công.",
  "data": [],
  "meta": { "page": 1, "limit": 20, "total": 0, "totalPages": 0 }
}
```

- Chuẩn response lỗi:

```json
{
  "success": false,
  "message": "Dữ liệu gửi lên không hợp lệ.",
  "code": "VALIDATION_ERROR",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "errors": [{ "field": "email", "message": "Email không đúng định dạng." }]
}
```

- `code` là mã lỗi ổn định để frontend xử lý; `requestId` dùng để đối chiếu response với log backend. `errors` chỉ xuất hiện khi có lỗi chi tiết theo field.
- Mọi `message` và nội dung lỗi trả từ backend phải viết bằng tiếng Việt có dấu. Mã lỗi nội bộ có thể dùng tiếng Anh nhưng không hiển thị trực tiếp cho người dùng.

### Middleware xử lý lỗi production — đã triển khai

Hạ tầng xử lý lỗi chung đã được triển khai và áp dụng cho các module backend:

- `AppError` chuẩn hóa lỗi nghiệp vụ với HTTP status, error code, message tiếng Việt và danh sách field error.
- `asyncHandler` chuyển lỗi từ controller bất đồng bộ về middleware chung; controller không tự tạo response lỗi.
- Các API JSON, bao gồm tính dinh dưỡng và quét phiếu InBody, trả cùng mẫu `success`, `message`, `data`, `meta`; endpoint proxy ảnh món ăn là ngoại lệ vì trả dữ liệu ảnh nhị phân.
- `errorNormalizer` ánh xạ lỗi MongoDB duplicate key, Mongoose validation/cast, JWT, JSON sai cú pháp và payload quá lớn.
- Mọi request có `x-request-id`; cùng giá trị được trả trong response lỗi và ghi vào structured log.
- Structured logging sử dụng Pino và `pino-http`; log production che authorization, cookie, password, token, secret và dữ liệu file/base64.
- Lỗi 4xx dự kiến ghi mức `warn`; lỗi 5xx ghi mức `error`. Production không trả stack trace, raw database error hoặc message kỹ thuật cho client.
- Sentry là tích hợp tùy chọn, chỉ kích hoạt khi có `SENTRY_DSN`; lỗi Sentry không làm gián đoạn request.
- Upload và route dinh dưỡng legacy đã được nối vào error pipeline chung.
- Health check gồm:
  - `GET /api/health/live`: kiểm tra tiến trình đang chạy.
  - `GET /api/health/ready`: kiểm tra MongoDB đã sẵn sàng.
  - `GET /api/health`: endpoint tương thích hiện tại.
- Server hỗ trợ graceful shutdown cho `SIGTERM`, `SIGINT`, `unhandledRejection` và `uncaughtException`; có timeout, đóng MongoDB và flush telemetry trước khi kết thúc.

Các mã lỗi nền tảng hiện có: `VALIDATION_ERROR`, `INVALID_JSON`, `AUTHENTICATION_ERROR`, `AUTHORIZATION_ERROR`, `RESOURCE_NOT_FOUND`, `ROUTE_NOT_FOUND`, `DUPLICATE_RESOURCE`, `PAYLOAD_TOO_LARGE`, `UPLOAD_ERROR`, `EXTERNAL_SERVICE_ERROR`, `SERVICE_UNAVAILABLE` và `INTERNAL_SERVER_ERROR`.

Tài liệu chi tiết:

- [Thiết kế middleware xử lý lỗi production](superpowers/specs/2026-08-24-production-error-middleware-design.md)
- [Kế hoạch triển khai middleware xử lý lỗi production](superpowers/plans/2026-08-24-production-error-middleware.md)

### Frontend

- Giữ màu chủ đạo và nhận diện thị giác của giao diện hiện tại; thiết kế tối giản, ưu tiên nội dung PT thao tác hằng ngày.
- Bắt buộc responsive trên điện thoại: không có thao tác chính nào yêu cầu cuộn ngang; bảng dữ liệu phải có cách hiển thị dạng thẻ/chi tiết khi màn hình hẹp.
- Tái sử dụng component: bố cục trang, form field, bộ lọc danh sách, bảng/thẻ dữ liệu, phân trang, trạng thái rỗng/tải/lỗi, badge trạng thái, modal xác nhận và toast không được sao chép rời rạc giữa các module.
- Mọi thao tác cần xác nhận như xóa/khóa tài khoản, công bố/thu hồi, từ chối hoặc xác nhận chuyển khách, chuyển bắt buộc phải dùng popup/modal xác nhận; popup phải nêu hậu quả thao tác và yêu cầu nhập lý do nếu quy tắc nghiệp vụ yêu cầu.
- Thông báo thành công, lỗi và cảnh báo thao tác phải dùng Toast; không dùng `alert` của trình duyệt. Thông báo validation đặt cạnh field tương ứng, đồng thời có Toast tóm tắt khi cần.
