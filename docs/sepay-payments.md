# Nạp credit qua SePay

## Luồng tích hợp

Đơn mới dùng SEPAY: backend tạo đơn và lưu thông tin ngân hàng/nội dung chuyển khoản tại thời điểm tạo; web hiển thị ảnh VietQR và poll trạng thái đơn trong database. Chỉ webhook được xác thực mới cộng credit. Không dùng redirect hoặc thao tác trên giao diện để xác nhận đã thanh toán.

Mobile hiện chỉ có màn ví/lịch sử, chưa có luồng tạo đơn đang được gắn vào màn ví. Component thanh toán dự phòng đã được đổi sang SepayCheckoutModal và dùng nội dung chuyển khoản trả về từ backend.

## Cấu hình backend

Các biến bắt buộc trong .env / secret store của server (không đặt trong EXPO_PUBLIC_* hoặc VITE_*):

- SEPAY_BANK_CODE: mã/alias ngân hàng cho VietQR, ví dụ VCB.
- SEPAY_BANK_NAME: tên ngân hàng đúng như trường gateway của webhook SePay, ví dụ Vietcombank.
- SEPAY_ACCOUNT_NUMBER: tài khoản gốc đúng như accountNumber trong webhook. Giữ nguyên số 0 đầu.
- SEPAY_ACCOUNT_HOLDER: tên chủ tài khoản không dấu.
- SEPAY_WEBHOOK_API_KEY: khóa riêng cho xác thực webhook, trùng khóa cấu hình trong SePay. Đây không phải API token dùng truy vấn giao dịch.

Tùy tài khoản ngân hàng:

- SEPAY_QR_ACCOUNT_NUMBER: số tài khoản/VA đưa vào QR nếu khác tài khoản gốc.
- SEPAY_SUB_ACCOUNT: giá trị subAccount dự kiến trong webhook nếu dùng VA; để trống khi webhook trả null/chuỗi rỗng.
- SEPAY_TRANSFER_PREFIX: nội dung bắt buộc theo ngân hàng, ví dụ SEVQR hoặc TKP001. Mã đơn đầy đủ được thêm phía sau; không bỏ hoặc rút gọn mã.

MongoDB phải hỗ trợ transaction (replica set/Atlas). Khi không có transaction, webhook SePay từ chối xử lý để tránh trạng thái đã thanh toán nhưng chưa cộng credit.

## Thiết lập trong SePay

1. Liên kết tài khoản ngân hàng nhận tiền.
2. Thêm webhook Có tiền vào cho đúng tài khoản/VA.
3. URL production: https://3s.igentechnology.net/api/credits/payments/sepay/webhook
4. Chọn chứng thực API Key. SePay gửi Authorization: Apikey <khóa>; dùng khóa trùng SEPAY_WEBHOOK_API_KEY.
5. Dùng body JSON. Nếu cấu hình nhận diện mã thanh toán, dùng tiền tố CR và phần tiếp theo 20 ký tự chữ/số. Backend cũng đọc mã đầy đủ từ content khi code trống.
6. Kiểm tra payload thực tế để điền BANK_NAME, ACCOUNT_NUMBER và SUB_ACCOUNT khớp chính xác. Lưu ý quy tắc VA/memo riêng của ngân hàng trong tài liệu SePay.
7. Thử Test Mode và webhook thử trên môi trường thử nghiệm trước khi mở nạp tiền production.

Chưa có cấu hình ngân hàng/khóa SePay thực tế trong lần thay đổi này. Không tự tạo webhook bên ngoài hoặc thực hiện chuyển tiền thật.

## Xử lý tiền và chống trùng

- Xác thực khóa trước khi đọc nội dung giao dịch.
- Chỉ nhận transferType=in, số tiền nguyên dương, mã SePay id hợp lệ.
- Tài khoản gốc, ngân hàng, VA và số tiền phải khớp snapshot đơn hàng.
- Webhook lặp dùng cùng id chỉ cộng một lần; unique index gateway + gatewayTransactionId và ledger idempotencyKey được giữ nguyên.
- Tiền thiếu/thừa, mã mơ hồ, giao dịch đã dùng cho đơn khác hoặc đơn đã thanh toán bằng id khác: trả lỗi, không cộng tự động; đối soát thủ công.
- Giao dịch ra hoặc không có mã đơn của ứng dụng: trả success=true, không cộng.
- Đơn hết thời gian hiển thị QR vẫn có thể nhận webhook đến chậm. Giao dịch khớp chính xác được cộng một lần; người dùng có thể kiểm tra lại trạng thái/lịch sử. QR chuyển khoản không thể thu hồi tại ngân hàng.
- Trả HTTP 200 và {"success":true} sau khi xử lý xong. Lỗi máy chủ phải được retry; theo dõi nhật ký webhook trong SePay.
- Không gộp nhiều khoản chuyển vào một đơn, không hoàn tiền tự động.

## Chuyển đổi từ PayOS

- Deploy backend và web cùng phiên bản. Client cũ gửi PAYOS sẽ bị từ chối tạo đơn mới.
- Giữ PayOS SDK, credential và webhook cũ để đối soát các đơn PayOS đã tồn tại, kể cả callback đến muộn; lịch sử không được đổi nhãn sang SEPAY.
- Không đổi gateway/mã đơn của dữ liệu cũ. Khi đã đối soát xong có thể thực hiện một thay đổi riêng để gỡ adapter PayOS.
- VNPay và MoMo giữ nguyên. Chính sách bảo mật web đã bổ sung SePay và ghi rõ phần xử lý PayOS cũ.

## Kiểm tra

Tỉ giá nạp tùy chọn lấy từ CreditPricing qua /api/credits/packages; frontend không giả định 100đ/credit.

Chạy TypeScript, lint các file đã đổi và:
`npx vitest run backend/tests/sepayPayments.test.ts`

Theo .gitignore hiện tại, thư mục backend/tests là local-only; bộ kiểm thử mới nằm tại backend/tests/sepayPayments.test.ts và không tự được đưa vào commit.

Bộ kiểm thử dùng MongoDB replica set tạm, dữ liệu ngân hàng giả và không gọi thanh toán thật. Trước khi triển khai cần xác nhận webhook Test Mode, quét QR trên thiết bị, giao dịch lặp, mất mạng và đối soát lịch sử ví.

## Nguồn chính thức

- [Webhook và phản hồi, API Key, chống trùng](https://docs.sepay.vn/tich-hop-webhooks.html)
- [Ảnh VietQR và quy tắc ngân hàng/VA](https://developer.sepay.vn/vi/tien-ich-khac/tao-qr-code)
- [SePay Test Mode](https://docs.sepay.vn/test-mode.html)
