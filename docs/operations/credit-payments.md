# Credit Payments Operations

## Mục tiêu

Runbook này áp dụng cho ví credit AI, VNPay và MoMo. Việc redirect trình duyệt chỉ phục vụ trải nghiệm người dùng; chỉ IPN/webhook đã xác minh chữ ký mới có quyền cộng credit.

## Chuẩn bị môi trường

Sao chép các biến từ `.env.example` và cấu hình độc lập từng cổng. Một cổng thiếu bất kỳ biến bắt buộc nào sẽ bị vô hiệu trong API/UI, nhưng ứng dụng và cổng còn lại vẫn hoạt động.

- Sandbox dùng payment/API endpoint sandbox và credential sandbox.
- Production dùng endpoint và credential production do merchant portal cấp.
- `VNPAY_RETURN_URL` và `MOMO_REDIRECT_URL` trỏ tới `https://<app>/wallet/payment-result`.
- `VNPAY_IPN_URL` trỏ tới `https://<api>/api/credits/payments/vnpay/ipn`.
- `MOMO_IPN_URL` trỏ tới `https://<api>/api/credits/payments/momo/ipn`.
- IPN URL phải truy cập được từ Internet qua HTTPS hợp lệ, không yêu cầu đăng nhập và không bị reverse proxy đổi body/query.

Không đưa hash secret, access key, secret key hoặc chữ ký callback vào frontend, log hay ticket hỗ trợ.

## Migration và policy ban đầu

Trước rollout, chạy:

```bash
npm run db:migrate:status
npm run db:migrate
npm run db:migrate:status
```

Migration tạo ví 0 credit cho toàn bộ `ADMIN`, `PT`, `CUSTOMER`, cấu hình quy đổi và policy cho mọi loại AI hiện có. Trong trang `/admin/credits`, rà soát:

- `vndPerCredit` mặc định 1.000 VND;
- tỷ giá USD/VND dùng cho hạch toán;
- mức tạm giữ phải đủ bao phủ chi phí tối đa hợp lý của từng tác vụ;
- fallback không lớn hơn mức tạm giữ;
- bonus của gói nạp và trạng thái active.

## Kiểm tra sandbox

1. Tạo một đơn giá trị nhỏ bằng VNPay và một đơn bằng MoMo.
2. Xác nhận redirect không tự cộng credit khi IPN chưa đến.
3. Xác nhận IPN hợp lệ chuyển đơn sang `PAID`, tạo đúng một ledger `TOPUP` và tăng đúng số dư.
4. Gửi lại cùng callback; API phải trả thành công tương thích cổng nhưng không tạo grant/ledger/audit thứ hai.
5. Thay đổi chữ ký hoặc amount; API phải từ chối, không đổi ví và tạo audit anomaly đã lọc metadata.
6. Chạy một tác vụ AI thành công và một provider failure; trường hợp failure phải hoàn toàn trả lại phần tạm giữ.

## Đối soát

Trang `/admin/credits` cung cấp các nhóm dữ liệu:

- `payment-orders`: kiểm tra `PENDING`, `PAID`, `FAILED`, `EXPIRED` và gateway transaction ID;
- `ai-usage`: đối chiếu reservation, settlement, provider cost và fallback;
- `credit-ledger`: nguồn chuẩn append-only cho mọi biến động ví;
- `credit-shortfalls`: các usage mà chi phí thực vượt reservation và số dư còn lại.

Đơn `PENDING` quá hạn được đánh dấu `EXPIRED` khi đọc. Một callback thành công đến muộn vẫn có thể thanh toán đơn expired nếu chữ ký, amount, order code và transaction ID hợp lệ; đơn `FAILED` là terminal.

Khi xử lý shortfall, điều chỉnh policy reservation trước. Nếu cần bù/trừ ví, dùng modal điều chỉnh admin với lý do rõ ràng; không sửa trực tiếp balance hoặc ledger trong MongoDB.

## Rotation và sự cố

- Rotation secret từng cổng độc lập, cập nhật merchant portal và biến môi trường trong cùng cửa sổ bảo trì.
- Sau rotation, tạo giao dịch nhỏ và xác nhận IPN trước khi mở lại cổng.
- Nếu nghi lộ secret, vô hiệu cổng tương ứng bằng cách gỡ credential, giữ cổng còn lại hoạt động, rồi rotation.
- Không replay callback bằng cách chỉnh payload. Chỉ replay nguyên request hợp lệ từ công cụ chính thức của cổng; idempotency database sẽ chặn cộng lặp.
- Trước khi xử lý thủ công, lưu order code, thời gian, status và audit reason code; không lưu raw signature hoặc credential.

## Verification trước production

```bash
npm run test:backend
npm test
npm run typecheck
npm run lint
npm run build
```

Các test gateway trong CI dùng fixture chữ ký và HTTP mock. Chúng không thay thế sandbox smoke test bằng credential merchant thực.
