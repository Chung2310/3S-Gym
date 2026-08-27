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

Dự án này sử dụng GitHub Actions để tự động hóa toàn bộ quá trình Tích hợp liên tục (CI) và Triển khai liên tục (CD) lên Firebase cùng máy chủ VPS chạy Docker.

### 1. Cấu hình GitHub Secrets
Để kích hoạt luồng triển khai tự động (CD), bạn cần truy cập vào Repo GitHub của mình -> **Settings** -> **Secrets and variables** -> **Actions** và tạo mới các **Repository Secrets** sau:

| Tên Secret | Mô tả chi tiết | Cách lấy thông tin |
| :--- | :--- | :--- |
| `GCP_SA_KEY` | Khóa tài khoản dịch vụ (JSON Key) để xác thực và deploy Rules & Functions lên Firebase. | Tạo Service Account với vai trò Editor trong GCP IAM Console và tải file JSON Key về. |
| `SSH_HOST` | Địa chỉ IP hoặc tên miền của máy chủ VPS đích. | Địa chỉ máy chủ VPS của bạn. |
| `SSH_USER` | Tên tài khoản đăng nhập SSH của VPS. | Thường là `root`, `ubuntu`, hoặc `centos`. |
| `SSH_KEY` | Nội dung khóa Private Key SSH dùng để xác thực kết nối. | Khóa SSH Private tương ứng với Public Key được thêm vào `authorized_keys` của VPS. |
| `SSH_PORT` | Cổng kết nối SSH (tùy chọn). | Mặc định là `22` nếu không thiết lập. |

### 2. Quy trình kiểm tra tích hợp (CI)
Mỗi khi bạn thực hiện **Push** hoặc **Tạo Pull Request** hướng về nhánh `develop` hoặc `production`, GitHub Actions sẽ tự động chạy:
1. **Kiểm tra kiểu dữ liệu (Type check)**: Chạy `yarn typecheck` (`tsc --noEmit`) trên toàn bộ dự án.
2. **Kiểm tra biên dịch (chỉ trên Pull Request)**: Chạy thử build dự án (`yarn build`) để bắt lỗi build trước khi merge. Khi push, bước này được bỏ qua vì Docker image đã build lại toàn bộ.

### 3. Quy trình triển khai tự động (CD)
Khi mã nguồn được merge thành công vào các nhánh chỉ định, CD sẽ tự động triển khai tương ứng:
* **Nhánh `develop`**: Triển khai lên môi trường **Staging** trên VPS (đường dẫn `/opt/igen-erp/staging`).
* **Nhánh `production`**: Triển khai lên môi trường **Production** trên VPS (đường dẫn `/opt/igen-erp/production`).
* Cả hai môi trường đều tự động cập nhật Firebase Cloud Functions, Firestore & Storage Security Rules.
# 3S Gym

## Log hệ thống và API

Backend ghi log UTF-8 dễ đọc trong cả development và production:

```text
[2026-08-27 09:54:11.541] [info]: [REQUEST] POST /api/customers - IP: 172.18.0.1
[2026-08-27 09:54:11.612] [info]: [RESPONSE] POST /api/customers - 201 - Duration: 71 ms
```

Mỗi API có `REQUEST` và `RESPONSE` dùng chung request ID. Query, JSON request/response body và lỗi được ghi có giới hạn; password, token, cookie, authorization, API key, secret, base64 và dữ liệu nhị phân luôn được che hoặc tóm tắt. Không ghi prefix của API key.

Các biến cấu hình:

- `LOG_LEVEL`: level tối thiểu, mặc định `debug` ở development và `info` ở production.
- `LOG_MAX_STRING_LENGTH`: số ký tự tối đa mỗi chuỗi, mặc định `2000`.
- `LOG_MAX_DEPTH`: độ sâu object tối đa, mặc định `4`.
- `LOG_MAX_COLLECTION_ITEMS`: số field/item tối đa, mặc định `25`.

Nếu PowerShell host cũ vẫn hiển thị sai tiếng Việt, chuyển terminal sang UTF-8 trước khi chạy ứng dụng:

```powershell
chcp 65001
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()
```
