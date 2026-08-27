# Thiết kế cấu hình môi trường tối giản

## Mục tiêu

Giới hạn giao diện cấu hình runtime còn đúng các biến thực sự chứa bí mật hoặc phụ thuộc môi trường triển khai. Các chính sách ứng dụng ổn định được định nghĩa tập trung trong code để `.env` ngắn, dễ cấu hình và không tạo cảm giác mọi giá trị đều cần tùy chỉnh.

## Danh sách biến được hỗ trợ

Ứng dụng chỉ đọc các biến sau:

```text
NODE_ENV
PORT
MONGODB_URI
MONGODB_USER
MONGODB_PASSWORD
MONGODB_AUTH_SOURCE
JWT_SECRET
CORS_ORIGINS
ADMIN_USERNAME
ADMIN_PASSWORD
ADMIN_FULL_NAME
OPENROUTER_API_KEY
APP_URL
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

`.env` cục bộ giữ giá trị hiện tại của các biến này và xóa các key khác. `ADMIN_PASSWORD=adminpassword` được giữ tạm theo yêu cầu người vận hành và phải được đổi sau triển khai. `.env` không được commit.

`.env.example` dùng đúng danh sách trên nhưng để trống password, JWT secret, API key và credential Cloudinary. Các giá trị không nhạy cảm có thể dùng ví dụ local như port `3008`, MongoDB local, CORS local và tên admin.

## Constants trong code

Các giá trị sau được cố định và chỉ có một nguồn định nghĩa trong `backend/config/env.ts`:

- JWT issuer: `3s-gym`;
- JWT audience: `3s-gym-api`;
- JWT algorithm: `HS256`;
- trust proxy: `false`;
- JSON body limit: `1mb`;
- provider timeout: `15000` ms;
- auth rate limit: `20` request mỗi 15 phút;
- AI rate limit: `10` request mỗi phút;
- OCR upload limit: `8388608` byte;
- shutdown timeout: `10000` ms;
- AI/OCR model: `google/gemini-2.5-flash`;
- vector search: `atlas` trong production, `local` ở môi trường khác;
- Atlas vector index: `knowledge-vector`;
- log level: `info` trong production, `debug` trong development, `silent` trong test;
- error response debug: luôn tắt.

Constants được export bằng tên rõ nghĩa để server, middleware và provider dùng trực tiếp hoặc thông qua `AppEnv`. Không service nào tiếp tục đọc biến môi trường đã bị loại bỏ.

## Telemetry

Do `SENTRY_DSN`, `SENTRY_ENVIRONMENT` và `APP_RELEASE` không còn thuộc giao diện môi trường, tích hợp Sentry bị vô hiệu hóa. `initializeTelemetry`, `captureError` và `flushTelemetry` giữ contract không lỗi để không phải thay đổi luồng server/error handler, nhưng không tải hoặc gửi dữ liệu tới Sentry.

## Luồng cấu hình

`loadEnv()` chỉ parse và validate các biến được hỗ trợ. Production tiếp tục bắt buộc `MONGODB_URI` và `JWT_SECRET`, đồng thời yêu cầu JWT secret tối thiểu 32 ký tự. `PORT` tiếp tục được validate trong khoảng hợp lệ. Các credential tùy chọn được kiểm tra tại service sở hữu chúng như hiện tại.

Các module AI, OCR, vector search, logger, server shutdown và error handler nhận policy từ constants thay vì `process.env`. Điều này đảm bảo thêm một key đã bị loại vào process environment không thể âm thầm thay đổi hành vi hệ thống.

## Bảo mật

- Không ghi hoặc commit nội dung `.env`.
- Không chuyển secret thành constant trong source.
- `.env.example` không chứa `adminpassword` hoặc secret thật.
- `ADMIN_PASSWORD` vẫn là biến bắt buộc cho bootstrap production; giá trị yếu chỉ được chấp nhận tạm ở file local theo quyết định của người vận hành.

## Kiểm thử

Test tự động phải chứng minh:

- `loadEnv()` trả đúng constants cố định;
- các biến cũ như `JWT_ISSUER`, `TRUST_PROXY`, `LOG_LEVEL`, `AI_MODEL`, `VECTOR_SEARCH_MODE` và timeout không còn override hành vi;
- production vẫn validate MongoDB URI, JWT secret và port;
- AI/OCR provider dùng model cố định;
- vector provider chọn mode theo `NODE_ENV` và index cố định;
- error response không bao giờ phát stack debug từ biến môi trường;
- telemetry hoạt động như no-op;
- `.env.example` chỉ chứa danh sách key đã duyệt;
- toàn bộ backend tests, typecheck, lint, build và production smoke đều đạt.

## Ngoài phạm vi

- Tự động thay mật khẩu admin sau triển khai.
- Thay đổi database, API contract hoặc giao diện frontend.
- Bổ sung nền tảng telemetry khác.
- Cho phép runtime override các policy đã được fix cứng.
