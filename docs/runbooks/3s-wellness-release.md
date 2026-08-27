# Runbook phát hành 3S Wellness

## Điều kiện Go/No-Go

- Toàn bộ test, backend typecheck, lint và build phải đạt.
- Không còn lỗi P0/P1; biến môi trường bắt buộc đã được cấu hình.
- Có ảnh Docker phiên bản trước để rollback.
- Backup production thành công và lần diễn tập restore gần nhất đã được xác nhận.
- Các feature beta mặc định tắt; danh sách pilot đã được duyệt.

## Chuẩn bị và backup

```powershell
powershell -File scripts/backup-mongodb.ps1 -Environment production -OutputPath backups/release-YYYYMMDD-HHmm -MongoUri $env:MONGODB_URI -ConfirmProduction
```

Kiểm tra `manifest.json`, dung lượng file và log `mongodump`. Không tiếp tục nếu backup lỗi.

## Migration và seed

```powershell
npm run db:migrate
npm run db:migrate:status
npm run db:seed
```

Hai lệnh được thiết kế idempotent. Chạy trên staging trước, sau đó mới chạy production.

## Deploy và smoke test

```powershell
docker compose pull
docker compose up -d
```

Xác nhận lần lượt:

1. `GET /api/health/live` trả 200.
2. `GET /api/health/ready` trả 200.
3. Đăng nhập Admin/PT/Customer.
4. PT chỉ truy cập khách được phân công.
5. Publish một nội dung thử nghiệm và Customer chỉ thấy nội dung published.
6. Các beta flag vẫn tắt, sau đó mở tuần tự cho pilot và theo dõi lỗi tối thiểu 15 phút mỗi flag.

Thứ tự flag: `ROADMAP`, `EXERCISE_LIBRARY`, `PROGRESS`, `CARE`, `DASHBOARD`, `OCR_INBODY`, `NUTRITION_AI`, `KNOWLEDGE_BASE`, `PT_ASSISTANT`.
