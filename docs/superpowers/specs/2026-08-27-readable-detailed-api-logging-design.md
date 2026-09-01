# Thiết kế log hệ thống và API dễ đọc

## Mục tiêu

Thay log JSON một dòng hiện tại bằng log văn bản dễ đọc trong cả development và production, hiển thị đúng Unicode tiếng Việt, đồng thời bổ sung đủ dữ liệu để truy vết vòng đời của từng API mà không làm lộ bí mật hoặc ghi log payload không kiểm soát.

## Định dạng chuẩn

Mỗi sự kiện bắt đầu bằng một dòng theo cấu trúc:

```text
[2026-08-27 09:54:11.541] [info]: [REQUEST] POST /api/customers - IP: 172.18.0.1 - Request ID: 0d61...
```

- Timestamp dùng múi giờ chạy ứng dụng và có mili-giây theo dạng `YYYY-MM-DD HH:mm:ss.SSS`.
- Level viết thường: `debug`, `info`, `warn`, `error`.
- Context nằm trong ngoặc vuông, ví dụ `REQUEST`, `RESPONSE`, `Auth Service`, `AI Provider`.
- Metadata đơn giản được nối trên cùng dòng. Object hoặc array có cấu trúc được pretty-print ở các dòng tiếp theo.
- Output được ghi bằng UTF-8. Chuỗi tiếng Việt và các Unicode khác được giữ nguyên, không chuyển thành escape sequence.

## Kiến trúc

### Logger trung tâm

Thay Pino bằng Winston và cung cấp một logger trung tâm trong `backend/config/logger.ts`. Logger chịu trách nhiệm:

- chuẩn hóa timestamp, level, context và message;
- format object nhiều dòng bằng bộ serialize an toàn;
- che dữ liệu nhạy cảm theo tên trường ở mọi độ sâu;
- cắt ngắn chuỗi hoặc cấu trúc vượt giới hạn;
- xử lý `Error` gồm name, message, code và stack phù hợp môi trường;
- xuất cùng định dạng dễ đọc trong development và production.

Logger hỗ trợ API theo ngữ nghĩa `debug/info/warn/error/fatal` để giảm thay đổi tại các call site hiện có. `fatal` được ánh xạ sang mức lỗi nghiêm trọng tương thích với Winston.

### Middleware vòng đời API

Middleware request context tiếp tục tạo hoặc chấp nhận `x-request-id` hợp lệ và trả ID này trong response header. Middleware ghi hai sự kiện tự động:

1. `REQUEST` khi bắt đầu xử lý.
2. `RESPONSE` khi response kết thúc hoặc kết nối đóng.

Hai sự kiện dùng chung request ID để đối chiếu. Thời gian xử lý được đo bằng đồng hồ monotonic nhằm tránh sai lệch khi giờ hệ thống thay đổi.

## Nội dung log API

### REQUEST

Log request bao gồm:

- HTTP method và path/URL;
- địa chỉ IP, có xét `trust proxy` theo cấu hình Express;
- request ID;
- user ID và role khi đã xác thực;
- query params;
- route params nếu đã có tại thời điểm ghi log;
- request body đã che và giới hạn dung lượng;
- user agent và content type khi có ích cho chẩn đoán.

Không ghi raw authorization header, cookie hoặc toàn bộ headers.

### RESPONSE

Log response bao gồm:

- HTTP method và path/URL;
- status code;
- thời gian xử lý theo mili-giây;
- request ID;
- content length nếu xác định được;
- response body JSON đã che và giới hạn dung lượng khi middleware có thể quan sát an toàn.

Response thành công ghi `info`, lỗi 4xx ghi `warn`, lỗi 5xx hoặc lỗi runtime ghi `error`.

## Log nghiệp vụ

Các controller/service/provider có thể tạo child/context logger, ví dụ:

```text
[2026-08-27 09:54:11.541] [info]: [AI Provider] Sending request - Provider: OpenRouter - Model: google/gemini-2.5-flash
```

Phạm vi lần triển khai này là cung cấp API context thống nhất và chuyển các log hệ thống hiện có. Không thêm log thủ công vào mọi controller/service nếu luồng đó chưa có sự kiện nghiệp vụ đáng chú ý; tránh nhân đôi request/response log tự động.

## Bảo mật và giới hạn dữ liệu

Các trường nhạy cảm được che không phân biệt hoa thường và ở mọi độ sâu, gồm tối thiểu:

- `password`, `passwordHash`;
- `token`, `accessToken`, `refreshToken`, `authorization`, `cookie`;
- `apiKey`, `secret`, `clientSecret`;
- `base64`, `imageBase64`, `sourceImage`.

API key không được ghi bất kỳ ký tự prefix/suffix nào. Chỉ được log các thuộc tính không tiết lộ bí mật như `configured`, `length`, `valid` và tên provider.

Buffer, file upload và dữ liệu nhị phân chỉ ghi loại, tên trường và kích thước. Chuỗi dài, object sâu hoặc collection lớn bị cắt theo giới hạn cấu hình; log phải đánh dấu rõ `[TRUNCATED]` khi dữ liệu bị lược bớt. Bộ serialize phải xử lý circular reference và không được làm request thất bại nếu format log lỗi.

## Unicode và môi trường Windows

Mã nguồn và output logger dùng UTF-8. Các chuỗi mojibake đang tồn tại trong thông báo logger, ví dụ chuỗi che dữ liệu hoặc thông báo xử lý request thất bại, được thay bằng tiếng Việt UTF-8 đúng. Tài liệu vận hành ghi rõ terminal Windows phải dùng UTF-8 khi host không tự nhận encoding; bản thân logger không phát JSON escape hoặc biến đổi Unicode.

## Xử lý lỗi

- Lỗi operational ghi error code, request ID và tên lỗi ở mức `warn` hoặc `error` theo status.
- Lỗi không dự kiến ghi object `Error` đầy đủ; stack chỉ xuất ngoài production để tránh lộ internals.
- Nếu response đã gửi, middleware không cố ghi hoặc sửa body lần hai.
- Nếu serialize metadata thất bại, logger ghi message tối thiểu kèm dấu hiệu serialization failure thay vì ném lỗi vào luồng API.

## Cấu hình

- `LOG_LEVEL` tiếp tục điều khiển level tối thiểu.
- Thêm giới hạn body/metadata với default an toàn trong code; có thể override bằng biến môi trường được kiểm tra hợp lệ.
- Test giữ logger ở chế độ silent mặc định để output test gọn, nhưng formatter và middleware được kiểm thử trực tiếp.

## Kiểm thử và tiêu chí hoàn thành

Các test tự động phải chứng minh:

- một request tạo log `REQUEST` và `RESPONSE` có method, URL, IP, status, duration và cùng request ID;
- level được chọn đúng cho 2xx, 4xx và 5xx;
- tiếng Việt và Unicode được giữ nguyên trong output;
- object/JSON hiển thị nhiều dòng dễ đọc;
- mọi secret lồng sâu bị che, API key không lộ prefix;
- body dài, base64, buffer và circular reference được xử lý an toàn;
- lỗi runtime vẫn đi qua error handler và không thay đổi response contract hiện tại;
- typecheck, backend tests, lint và production build đều vượt qua.

## Ngoài phạm vi

- Gửi log sang Elasticsearch, Loki, CloudWatch hoặc dịch vụ bên thứ ba.
- Lưu log ra file và thực hiện rotation.
- Ghi toàn bộ payload không giới hạn.
- Thay đổi response schema của API.
