<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

## MongoDB configuration

The backend reads its MongoDB connection settings from these four environment variables:

```env
MONGODB_URI=mongodb://localhost:27017/igen-erp
MONGODB_USER=
MONGODB_PASSWORD=
MONGODB_AUTH_SOURCE=admin
```

Leave `MONGODB_USER` and `MONGODB_PASSWORD` empty when the local MongoDB instance does not require authentication.

## Validation commands

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Ví credit và thanh toán AI

Mọi tài khoản `ADMIN`, `PT` và `CUSTOMER` có một ví credit. Migration `002-credit-wallets-and-pricing` tạo ví số dư 0 cho tài khoản hiện có, đồng thời tạo cấu hình quy đổi, policy tính phí AI và các gói nạp mặc định.

Sau khi cập nhật mã nguồn, chạy migration trước khi nhận lưu lượng:

```bash
npm run db:migrate:status
npm run db:migrate
```

Cấu hình VNPay và MoMo theo các biến trong `.env.example`. URL callback/IPN phải là HTTPS công khai và đi thẳng tới backend; URL redirect/return đưa người dùng về `/wallet/payment-result`:

```env
VNPAY_RETURN_URL=https://your-domain.example/wallet/payment-result
VNPAY_IPN_URL=https://your-domain.example/api/credits/payments/vnpay/ipn
MOMO_REDIRECT_URL=https://your-domain.example/wallet/payment-result
MOMO_IPN_URL=https://your-domain.example/api/credits/payments/momo/ipn
```

Redirect trình duyệt không bao giờ cộng credit. Backend chỉ cộng credit một lần sau IPN/webhook có chữ ký hợp lệ; trang kết quả tra lại đơn cục bộ từ API và không tin mã trạng thái trên query string của cổng thanh toán.

Checklist production:

- Thay toàn bộ credential sandbox bằng credential production và đăng ký đúng IPN URL tại cổng thanh toán.
- Chạy `npm run db:migrate` trên một instance trước khi rollout ứng dụng.
- Kiểm tra DNS/TLS và cho phép VNPay/MoMo gọi các endpoint IPN từ Internet.
- Tạo một giao dịch giá trị nhỏ trên từng cổng, đối chiếu `payment_orders`, `credit_ledger_entries` và số dư ví.
- Theo dõi mục “Thiếu hụt” trong trang quản trị credit để xử lý trường hợp chi phí provider vượt mức đã tạm giữ.

View your app in AI Studio: https://ai.studio/apps/c9f16f0c-380d-4f8a-bd87-6bcf8a623f13

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

   The command starts the complete development application at
   `http://localhost:3008`: Express serves `/api/*` and embeds Vite in
   middleware mode for the frontend and hot module replacement. Do not start
   a separate Vite server on port `5173`.

---

## 🚀 Hướng dẫn cấu hình CI/CD (GitHub Actions)

GitHub Actions kiểm tra mã nguồn, build Docker image lên GHCR và triển khai lên VPS.

### 1. Cấu hình GitHub Variables và Secrets

Vào **Settings → Secrets and variables → Actions → Variables**, tạo **Repository variables**:

| Tên Variable | Nội dung | Nhánh sử dụng |
| :--- | :--- | :--- |
| `ENV_FILE` | Toàn bộ nội dung file `.env` của staging, giữ nguyên các dòng `KEY=value`. | `develop` |
| `ENV_FILE_PROD` | Toàn bộ nội dung file `.env` của production, giữ nguyên các dòng `KEY=value`. | `production` |

Workflow đọc `vars.ENV_FILE` và `vars.ENV_FILE_PROD`, chuyển nội dung qua biến môi trường của bước SSH rồi ghi vào `.env` trên VPS. Không fallback sang Secrets. Nếu Variable rỗng hoặc chưa được tạo, bước deploy dừng trước khi ghi đè `.env`. Các cấu hình SePay nằm trong nội dung `.env` tương ứng; xem [hướng dẫn SePay](docs/sepay-payments.md).

Trong tab **Secrets**, cấu hình thông tin kết nối:

| Tên Secret staging | Tên Secret production | Nội dung |
| :--- | :--- | :--- |
| `SSH_HOST` | `SSH_HOST_PROD` | IP hoặc tên miền VPS. |
| `SSH_USER` | `SSH_USER_PROD` | Tài khoản SSH. |
| `SSH_KEY` | `SSH_KEY_PROD` | Private key SSH. |
| `SSH_PORT` | `SSH_PORT_PROD` | Cổng SSH, mặc định `22`. |

`GITHUB_TOKEN` do GitHub Actions cấp để đăng nhập GHCR.

### 2. Quy trình kiểm tra tích hợp (CI)

Khi push hoặc mở pull request tới `develop` / `production`, pipeline chạy `npm ci`, lint và TypeScript. Pull request chạy thêm build frontend. Workflow backend riêng kiểm tra TypeScript, lint, build và smoke test backend.

### 3. Quy trình triển khai tự động (CD)

Sau khi kiểm tra thành công, push lên nhánh triển khai sẽ build/push image và deploy:

- `develop`: staging tại `/opt/3s-gym/staging`, dùng `ENV_FILE`.
- `production`: production tại `/opt/3s-gym/production`, dùng `ENV_FILE_PROD`.

Push nhánh tính năng không chạy bước triển khai production/staging.

# 3S Gym

## Cấu hình môi trường

`.env` chỉ dùng cho secret và thông tin phụ thuộc môi trường triển khai: Node environment, port, MongoDB, JWT secret, CORS, tài khoản bootstrap admin, OpenRouter, URL ứng dụng và Cloudinary. Các timeout, rate limit, JWT policy, model AI/OCR, vector index, giới hạn upload/body, log level và shutdown timeout là policy cố định trong `backend/config/env.ts`.

Sau khi triển khai, phải cấu hình `SUPER_ADMIN_USERNAME` và `SUPER_ADMIN_PASSWORD`; mật khẩu phải gồm đúng 6 chữ số và cần được giữ bí mật. Không commit `.env`; `.env.example` luôn để trống password và API credential.

## Log hệ thống và API

Backend ghi log UTF-8 dễ đọc trong cả development và production:

```text
[2026-08-27 09:54:11.541] [info]: [REQUEST] POST /api/customers - IP: 172.18.0.1
[2026-08-27 09:54:11.612] [info]: [RESPONSE] POST /api/customers - 201 - Duration: 71 ms
```

Mỗi API có `REQUEST` và `RESPONSE` dùng chung request ID. Query, JSON request/response body và lỗi được ghi có giới hạn; password, token, cookie, authorization, API key, secret, base64 và dữ liệu nhị phân luôn được che hoặc tóm tắt. Không ghi prefix của API key.

Log level và các giới hạn metadata được chọn tự động theo policy trong code, không cấu hình qua `.env`.

Nếu PowerShell host cũ vẫn hiển thị sai tiếng Việt, chuyển terminal sang UTF-8 trước khi chạy ứng dụng:

```powershell
chcp 65001
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()
```
