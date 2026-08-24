# Thiết kế middleware xử lý lỗi production

## Mục tiêu

Đưa toàn bộ lỗi backend về một pipeline thống nhất, có response tiếng Việt ổn định, mã lỗi máy đọc được, request ID để truy vết, structured logging và khả năng gửi lỗi nghiêm trọng lên Sentry.

## Kiến trúc

Thứ tự middleware bắt buộc:

```text
request
  → requestContext
  → requestLogger
  → body parser / CORS
  → authentication / validation / route / controller / service
  → notFoundHandler
  → errorNormalizer
  → errorLogger
  → errorHandler
```

Controller bất đồng bộ được bọc bởi `asyncHandler`. Service ném `AppError` cho lỗi dự kiến. Lỗi thư viện hoặc lỗi ngoài dự kiến được `errorNormalizer` chuyển thành cấu trúc nội bộ trước khi log và trả response.

## Thành phần

### AppError

`AppError` có các thuộc tính:

- `status`: HTTP status từ 400 đến 599.
- `code`: mã lỗi ổn định dạng `UPPER_SNAKE_CASE`.
- `message`: thông báo tiếng Việt an toàn cho người dùng.
- `errors`: danh sách lỗi theo field nếu có.
- `details`: dữ liệu nội bộ chỉ dành cho log, không trả về production.
- `cause`: lỗi gốc theo chuẩn JavaScript Error.
- `isOperational`: `true` với lỗi dự kiến từ nghiệp vụ/client.

Service không tự gắn `error.status` lên `Error` thường sau khi migration.

### asyncHandler

`asyncHandler(handler)` trả Express handler gọi `Promise.resolve(handler(...)).catch(next)`. Controller không còn `try/catch` chỉ để chuyển lỗi thành response.

### Request context

Mỗi request nhận `requestId`:

- Chấp nhận `x-request-id` từ reverse proxy khi đúng định dạng an toàn.
- Nếu thiếu hoặc không hợp lệ, sinh UUID mới.
- Trả `x-request-id` trong mọi response.
- Gắn `req.requestId` và child logger `req.log`.

Không dùng AsyncLocalStorage trong giai đoạn này; truyền context qua `req` đủ cho cấu trúc Express hiện tại và tránh tăng độ phức tạp.

### Structured logging

Dùng Pino và `pino-http`:

- Log JSON ở production; pretty transport chỉ dùng development nếu được cấu hình.
- Redact `authorization`, `cookie`, `set-cookie`, password, token, refreshToken, API key, secret và nội dung file/base64.
- Không log toàn bộ request/response body mặc định.
- 2xx/3xx ghi `info`; lỗi 4xx dự kiến ghi `warn`; lỗi 5xx ghi `error` kèm stack và cause trong log nội bộ.
- Mỗi log request chứa request ID, method, path, status, response time và user ID/role nếu đã xác thực.

### Sentry adapter

Sentry là tùy chọn:

- Chỉ khởi tạo khi có `SENTRY_DSN`.
- Chỉ gửi lỗi 5xx hoặc lỗi `isOperational=false`.
- Gắn request ID, user ID, role, route và release; không gửi password/token/body nhạy cảm.
- Khi Sentry lỗi hoặc chưa cấu hình, request vẫn được xử lý bình thường.

## Chuẩn response lỗi

Response lỗi thống nhất:

```json
{
  "success": false,
  "message": "Dữ liệu gửi lên không hợp lệ.",
  "code": "VALIDATION_ERROR",
  "requestId": "req_hoặc_uuid",
  "errors": [
    { "field": "email", "message": "Email không hợp lệ." }
  ]
}
```

`errors` chỉ xuất hiện khi có lỗi chi tiết. Production không trả stack, cause, raw query, đường dẫn máy chủ hoặc message kỹ thuật. Development chỉ trả `debug.stack` khi `ERROR_DEBUG=true`; mặc định tắt.

Response thành công hiện tại giữ nguyên. Header `x-request-id` được thêm cho cả thành công và lỗi.

## Danh mục mã lỗi ban đầu

| Code | HTTP | Trường hợp |
|---|---:|---|
| `VALIDATION_ERROR` | 400 | Validate body/query/params hoặc Mongoose validation |
| `INVALID_JSON` | 400 | JSON body sai cú pháp |
| `AUTHENTICATION_ERROR` | 401 | Thiếu/sai/hết hạn token |
| `AUTHORIZATION_ERROR` | 403 | Không đủ quyền |
| `RESOURCE_NOT_FOUND` | 404 | Không tìm thấy bản ghi |
| `ROUTE_NOT_FOUND` | 404 | Không tồn tại API route |
| `DUPLICATE_RESOURCE` | 409 | MongoDB duplicate key |
| `PAYLOAD_TOO_LARGE` | 413 | Body hoặc file vượt giới hạn |
| `UPLOAD_ERROR` | 400 | File sai loại/định dạng |
| `EXTERNAL_SERVICE_ERROR` | 502 | Cloudinary/OpenRouter/Pollinations/Gemini lỗi |
| `SERVICE_UNAVAILABLE` | 503 | Database hoặc dependency chưa sẵn sàng |
| `INTERNAL_SERVER_ERROR` | 500 | Lỗi ngoài dự kiến |

Mỗi lỗi gửi tới client phải dùng message tiếng Việt. Lỗi 500 luôn dùng thông báo chung, không dùng `error.message` gốc.

## Chuẩn hóa lỗi thư viện

`errorNormalizer` ánh xạ theo thứ tự cụ thể:

1. `AppError`: giữ nguyên dữ liệu an toàn.
2. MongoDB `code=11000`: `409 DUPLICATE_RESOURCE`, xác định field trùng từ `keyPattern` nhưng không trả raw value.
3. Mongoose `ValidationError`: `400 VALIDATION_ERROR`, chuyển từng path thành `{ field, message }` tiếng Việt.
4. Mongoose `CastError`: `400 VALIDATION_ERROR` hoặc `404 RESOURCE_NOT_FOUND` theo context route; mặc định 400.
5. JWT `TokenExpiredError`/`JsonWebTokenError`: `401 AUTHENTICATION_ERROR`.
6. Body parser `entity.parse.failed`: `400 INVALID_JSON`.
7. Body parser/Multer vượt kích thước: `413 PAYLOAD_TOO_LARGE`.
8. Lỗi ngoài danh mục: `500 INTERNAL_SERVER_ERROR`, giữ lỗi gốc trong `cause` để log.

## Authentication và validation

- `authenticate` gọi `next(new AppError(...))` thay vì trả response trực tiếp.
- `authorize` làm tương tự với lỗi 403.
- `validate(schema)` chuyển danh sách field error vào `AppError.errors`.
- Validation vẫn chạy tại mọi route như yêu cầu kiến trúc hiện tại.

## Migration controller và service

Thứ tự migration:

1. Users và auth.
2. Customers và packages.
3. Transfers.
4. InBody, goals, workout plans, nutrition plans và customer content.
5. Upload.
6. Route dinh dưỡng legacy có logic trực tiếp và gọi AI bên ngoài.

Trong mỗi module:

- Service đổi `new Error + error.status` thành `AppError`.
- Controller bỏ helper `handleError`, bỏ `try/catch` chuyển lỗi thủ công.
- Route bọc controller bằng `asyncHandler` hoặc controller factory trả handler đã bọc.
- Test contract của module phải qua trước khi chuyển module tiếp theo.

Không thay đổi business rule hoặc response thành công trong migration này.

## Lỗi dịch vụ ngoài

Cloudinary và các dịch vụ AI phải có timeout, giữ lỗi gốc trong log và ném `EXTERNAL_SERVICE_ERROR`. Client chỉ nhận message tiếng Việt theo nghiệp vụ. Không log prompt chứa thông tin sức khỏe đầy đủ; chỉ log provider, operation, duration, status và request ID.

## Process-level safety

Tách hàm bootstrap/shutdown để kiểm thử được:

- `unhandledRejection`: log `fatal`, bắt đầu graceful shutdown.
- `uncaughtException`: log `fatal`, bắt đầu graceful shutdown.
- Ngừng nhận kết nối mới, chờ request đang chạy tối đa thời gian cấu hình, đóng MongoDB, flush Sentry/Pino rồi thoát với code 1.
- `SIGTERM`/`SIGINT`: graceful shutdown và thoát code 0.
- Không gọi `process.exit` trực tiếp trong module dùng bởi test; inject hàm exit vào lifecycle service.

## Health checks

- `GET /api/health/live`: tiến trình đang chạy, không phụ thuộc MongoDB.
- `GET /api/health/ready`: trả 200 khi MongoDB sẵn sàng, 503 `SERVICE_UNAVAILABLE` khi chưa kết nối.
- Giữ `/api/health` trong giai đoạn tương thích, trỏ về liveness và đánh dấu để loại bỏ sau.

## Cấu hình môi trường

- `LOG_LEVEL`: mặc định `info` production, `debug` development.
- `LOG_PRETTY`: mặc định `false`; chỉ dùng local.
- `ERROR_DEBUG`: mặc định `false`.
- `SENTRY_DSN`: tùy chọn.
- `SENTRY_ENVIRONMENT`: mặc định theo `NODE_ENV`.
- `APP_RELEASE`: phiên bản triển khai.
- `SHUTDOWN_TIMEOUT_MS`: mặc định `10000`.

Không ghi giá trị secret vào log khởi động.

## Kiểm thử

### Unit

- `AppError` giữ đúng status/code/message/errors/cause.
- `asyncHandler` chuyển rejected promise vào `next` đúng một lần.
- Request ID chấp nhận giá trị hợp lệ và thay giá trị nguy hiểm/quá dài.
- Normalizer ánh xạ toàn bộ danh mục lỗi thư viện.
- Logger redaction loại bỏ header và field nhạy cảm.
- Sentry adapter bỏ qua lỗi 4xx và hoạt động an toàn khi chưa cấu hình.

### Integration

- Mọi response có header `x-request-id`.
- Mọi response lỗi có `success`, `message`, `code`, `requestId` cùng kiểu dữ liệu.
- Validation có `errors`; lỗi khác không có field thừa.
- Production không lộ stack/message Mongo/JWT/đường dẫn file/token/password.
- Request ID giống nhau giữa header, response, log và Sentry context.
- Route 404, invalid JSON, payload quá lớn và lỗi controller async đều đi qua middleware chung.

### Lifecycle

- Readiness đổi theo trạng thái MongoDB.
- Graceful shutdown chỉ chạy một lần khi nhận nhiều signal.
- Server đóng, Mongo disconnect và telemetry flush trước khi exit.
- Timeout shutdown buộc kết thúc với log `fatal` nhưng không làm treo test.

## Tiêu chí hoàn thành

- Không còn controller tự tạo response lỗi bằng `fail`.
- Không còn service gắn thủ công `error.status` lên `Error` thường.
- Tất cả route async đều chuyển rejected promise tới middleware chung.
- Response lỗi toàn API tuân thủ contract mới và message tiếng Việt.
- Log production có request ID, được redact và không chứa dữ liệu sức khỏe nhạy cảm.
- Test, lint và production build thành công.

## Ngoài phạm vi

- Dashboard quan sát log/metric riêng.
- Distributed tracing OpenTelemetry.
- Thay đổi business rule hoặc giao diện frontend.
- Lưu log vào database ứng dụng.
