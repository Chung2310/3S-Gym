# Runbook rollback 3S Wellness

## Khi nào rollback

Rollback ngay khi có lỗi P0/P1, sai ownership/RBAC, mất dữ liệu, migration không hoàn tất hoặc health readiness thất bại kéo dài.

## Cô lập ảnh hưởng

1. Tắt feature flag của module beta bị lỗi trước.
2. Nếu Core bị ảnh hưởng, dừng rollout và chuyển image về phiên bản ổn định trước đó.
3. Không restore database nếu lỗi chỉ nằm ở ứng dụng và dữ liệu vẫn đúng.

## Rollback ứng dụng

Đặt `IMAGE_TAG` về tag ổn định trước đó rồi chạy:

```powershell
docker compose pull
docker compose up -d
```

Kiểm tra `/api/health/live`, `/api/health/ready` và smoke test ba role.

## Restore database

Restore là thao tác phá hủy dữ liệu đích và chỉ thực hiện sau khi xác nhận phạm vi mất dữ liệu, thời điểm backup và downtime:

```powershell
powershell -File scripts/restore-mongodb.ps1 -Environment production -BackupPath backups/release-YYYYMMDD-HHmm -MongoUri $env:MONGODB_URI -ConfirmProduction
```

Sau restore, đối chiếu số collection/bản ghi quan trọng, kiểm tra tài khoản, khách hàng, gói PT, nội dung published và audit log trước khi mở traffic.

## Ghi nhận sự cố

Lưu timeline, release tag, backup path, người phê duyệt, nguyên nhân, phạm vi dữ liệu và kết quả smoke test. Không xóa backup hoặc log liên quan cho đến khi đóng postmortem.
