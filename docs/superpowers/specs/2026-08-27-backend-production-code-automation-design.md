# Backend Production Code and Automation Design

## Mục tiêu

Hoàn thiện các khoảng trống backend còn lại trong `2026-08-27-backend-production-completion.md` ở phạm vi code và automated tests. Kết quả phải tạo được production artifact chạy bằng Node ESM, bảo vệ API và provider, giữ dữ liệu nhất quán, đồng thời cung cấp quality gates có thể chạy lặp lại trong CI mà không cần credential hoặc dịch vụ staging thật.

## Ngoài phạm vi

- Không sửa `frontend/src/**`.
- Không deploy hoặc rehearsal trên staging.
- Không chạy backup/restore database thật.
- Không smoke test OpenRouter, Atlas hoặc OCR provider bằng credential thật.
- Không lập hồ sơ Go/No-Go thủ công hoặc đo SLO staging.
- Không thay đổi response envelope hay public endpoint nếu chưa có backward-compatibility contract test.

## Hiện trạng đã audit

Một số nền tảng đã tồn tại: ESM path dùng `import.meta.url`, request ID, structured error middleware, Sentry adapter, migration/rollback cơ bản, local vector embedding, cùng một phần audit và notification. Tuy nhiên các tiêu chí production trong tài liệu gốc chưa hoàn tất:

- Backend vẫn chạy bằng `tsx`; Docker chưa dùng JavaScript artifact độc lập với devDependencies.
- Env chưa được validate trước dependency graph; JWT còn fallback `secret_key` và chưa khóa issuer/audience/algorithm.
- Route legacy Nutrition/OCR còn chứa provider call trực tiếp và fallback chỉ số sức khỏe giả.
- Chưa có transaction wrapper dùng chung hoặc atomicity test cho mutation nhiều collection.
- Chưa có security headers, CORS allowlist, rate-limit buckets và provider request wrapper chuẩn hóa.
- Audit/notification mới phủ một phần và chưa có matrix test tổng thể.
- Vector search mới là local implementation; chưa có Atlas adapter với mode contract rõ ràng.
- Migration chưa có atomic lock, TTL owner và trạng thái `RUNNING`/`FAILED`.
- Chưa có index coverage test, production smoke automation và CI gate hoàn chỉnh.
- Baseline hiện có một lỗi timeout ở `backend/tests/esmRuntime.test.ts`; lỗi này phải được xử lý trước khi triển khai các nhóm còn lại.

## Kiến trúc

Giữ kiến trúc hiện tại `Route → Controller → Service → Model/Provider`. Route chỉ thực hiện routing, auth/RBAC, feature flag và validation. Controller chuyển đổi HTTP input/output. Service sở hữu nghiệp vụ, transaction, idempotency, audit và notification. Provider adapter là biên duy nhất thực hiện external HTTP hoặc vector search.

Các concern dùng chung được triển khai trước domain code:

- `backend/config/env.ts` parse và validate môi trường một lần trước khi app/server được import.
- `backend/middlewares/security.ts` và `backend/middlewares/rateLimit.ts` cấu hình chính sách HTTP.
- `backend/services/providerRequest.ts` cung cấp timeout, abort và chuẩn hóa lỗi provider.
- `backend/services/transactionService.ts` cung cấp transaction lifecycle thống nhất.

Không tạo framework abstraction mới ngoài bốn boundary trên. Các service hiện có tiếp tục dùng Mongoose models và `AppError` để phù hợp codebase.

## Giai đoạn triển khai

### 1. Baseline và production runtime

Ổn định test ESM đang timeout, sau đó tạo backend build config để sinh JavaScript ESM chạy trực tiếp bằng Node. Docker build frontend và backend riêng, runner chỉ chứa production dependencies và artifacts. Env được load/validate trước app dependency graph; production thiếu `MONGODB_URI` hoặc `JWT_SECRET` phải fail-fast. JWT khóa thuật toán, issuer và audience; authentication middleware truy vấn lại user để từ chối tài khoản đã khóa sau khi token được cấp.

### 2. Security và provider foundation

Áp dụng security headers, CORS allowlist, body-size limit và `trust proxy` chỉ khi env bật. Rate limiting được chia thành `AUTH`, `AI`, `OCR`, `GENERAL`, có storage abstraction đủ để test deterministic. `fetchWithTimeout` dùng `AbortController`, giữ signal của caller nếu có, chuẩn hóa timeout/network/429/5xx thành lỗi ổn định và không đưa response body nhạy cảm vào log.

### 3. Cô lập legacy Nutrition/OCR

Tách route legacy thành controller và focused services cho calculate, meal image và OCR scan. Các endpoint cũ giữ contract tương thích và phát tín hiệu deprecation rõ ràng; code mới tiếp tục dùng canonical endpoints. Provider failure hoặc output không hợp lệ chỉ tạo draft `REVIEW_REQUIRED` khi còn đủ dữ liệu xác thực, nếu không trả lỗi chuẩn. Không sinh tên, tuổi, cân nặng, body fat hoặc chỉ số sức khỏe mẫu.

### 4. Atomic workflows

`withTransaction<T>` sở hữu session lifecycle và truyền `ClientSession` qua mọi write trong cùng use case. Áp dụng lần lượt cho workout session/package usage, PT transfer/reassignment, knowledge document/chunks, nutrition formula activation và progress report publish. Idempotency được enforce bằng unique index hoặc atomic conditional upsert; pre-check đơn thuần không được xem là đủ chống concurrent request.

### 5. Audit và notification

Tạo matrix test cho mọi mutation nhạy cảm trong exercise, workout, body measurement, nutrition, knowledge, care và operations. Mỗi mutation thành công ghi đúng một audit với actor, role, resource và customer context phù hợp. Metadata không chứa token, OCR image, raw provider payload hoặc medical notes. Notification dùng dedup key ổn định dựa trên recipient, type và resource/event identity.

### 6. Production provider adapters

AI và OCR giữ public function signatures hiện có nhưng dùng provider request wrapper. Contract tests bao phủ success, response rỗng, malformed JSON, timeout, abort, 429 và 5xx. Vector search hỗ trợ `local` cho development/test và `atlas` cho production. Atlas mode cấu hình sai hoặc query lỗi trả `503 UNAVAILABLE`; không âm thầm chuyển sang local. Diagnostics được phép nêu mode nhưng không chứa URI/index credential.

### 7. Migration, indexes và CI automation

Migration record hỗ trợ `RUNNING`, `APPLIED`, `FAILED`, `ROLLED_BACK`, cùng `ownerId`, `lockedAt`, `expiresAt` và sanitized error summary. Hai runner đồng thời chỉ một runner được apply một version; lock hết hạn có thể được tiếp quản bằng atomic filter. Index chỉ được thêm khi gắn với query hot path và có index coverage test. Automated production smoke khởi động compiled server với MongoDB test, xác minh readiness, auth và một representative API journey.

CI gate cuối chạy backend tests, backend typecheck, backend lint và production build/smoke. Không có bước nào cần secret hoặc network provider thật.

## Luồng dữ liệu và tính nhất quán

Request đi qua request context, security, rate limiting, auth/RBAC, feature flag và validation trước controller. Controller gọi đúng một service use case. Use case nhiều write mở một transaction, truyền session xuống model/service phụ, ghi audit/notification trong cùng transaction khi chúng là phần bắt buộc của kết quả nghiệp vụ, rồi commit một lần.

External provider request không nằm trong MongoDB transaction. Provider được gọi và validate trước; chỉ dữ liệu đã chuẩn hóa mới được đưa vào transaction để tạo draft hoặc cập nhật record. Điều này tránh giữ transaction mở trong thời gian chờ network.

Retry cùng idempotency key trả lại kết quả đã tạo thay vì tạo resource mới. Concurrent retry phải được chặn ở database bằng unique constraint hoặc conditional write.

## Xử lý lỗi và bảo mật

Tất cả lỗi HTTP đi qua `AppError` và error envelope hiện có. Production không lộ stack, provider body, database URI hoặc secret. Timeout, abort do timeout, provider throttling và provider unavailable có mapping ổn định; caller-initiated abort được phân biệt nếu cần cho lifecycle nhưng không tạo unhandled rejection.

Upload OCR kiểm tra MIME allowlist, kích thước byte thực và giới hạn nghiệp vụ trước provider call. Logger redact Authorization, cookie, password, token, base64 image và các field cấu hình nhạy cảm. Audit metadata áp dụng allowlist thay vì ghi toàn bộ request body.

## Chiến lược automated test

- Baseline test: sửa `esmRuntime.test.ts` để không phụ thuộc timeout mong manh và xác minh import/app startup kết thúc sạch.
- Production artifact test: compile backend, chạy Node trên artifact và xác minh không cần `tsx` hoặc devDependencies.
- Environment/auth test: production fail-fast, JWT claims/algorithm đúng và user bị khóa sau login không thể tiếp tục dùng token.
- Security test: headers, CORS, proxy mode, body/file limits, rate buckets và log redaction.
- Provider contract test: dùng stub HTTP/fake timers; tuyệt đối không gọi network thật.
- Transaction test: dùng `MongoMemoryReplSet`, làm write thứ hai thất bại và xác minh rollback đầy đủ.
- Idempotency test: gửi request lặp và đồng thời, xác minh một resource/counter/notification/audit.
- Migration concurrency test: chạy hai runner song song và kiểm tra lock/FAILED/recovery.
- Index coverage test: đối chiếu exact index definitions với query hot paths đã chọn.
- Production smoke: khởi động compiled artifact với database test và gọi health/auth/representative API.

Mỗi giai đoạn chạy targeted tests trước, sau đó regression suite liên quan. Gate cuối chạy toàn bộ backend tests, `npm run typecheck:backend`, lint backend, production build và production smoke.

## Tiêu chí hoàn thành

- Không còn baseline test failure hoặc timeout đã biết.
- Compiled backend chạy bằng Node ESM mà không cần `tsx`/devDependencies.
- Production không khởi động với env bắt buộc bị thiếu và không có JWT secret mặc định.
- Route legacy không gọi provider trực tiếp và không tạo health data giả.
- Các workflow nhiều collection đã chọn rollback hoàn toàn khi một write thất bại.
- Retry và concurrent retry không tạo duplicate side effects.
- Security/provider/audit/notification/migration/index contracts đều có automated test.
- Full backend quality gate chạy xanh mà không cần staging hoặc credential thật.

## Ranh giới kế hoạch triển khai

Implementation plan sẽ chia theo bảy giai đoạn trên. Mỗi task phải có exact files, interface tạo ra/tiêu thụ, test RED, implementation tối thiểu, test GREEN và commit suggestion. Việc commit chỉ được thực hiện khi người dùng cấp quyền; plan không tự động cho phép commit, push hoặc PR.
