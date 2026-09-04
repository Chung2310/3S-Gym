# Quy Tắc Git Workflow (Bắt Buộc)

## 1. Tuyệt đối KHÔNG đẩy trực tiếp vào `develop` và `production`
- **CẤM** chạy `git push origin develop` hoặc `git push origin production` trực tiếp.
- Mọi thay đổi đều phải được thực hiện trên một nhánh mới tách từ nhánh làm việc.

## 2. Quy tắc đặt tên nhánh
- Tính năng mới: `feat/<ten-tinh-nang>` (Ví dụ: `feat/ai-exercise-generation`, `feat/muscle-group-selection`)
- Sửa lỗi: `fix/<ten-loi>` (Ví dụ: `fix/openrouter-credit-error-message`, `fix/allow-empty-workout-days`)
- Đồng bộ / dọn dẹp: `chore/<noi-dung>`

## 3. Quy trình đẩy code ("đẩy lên nhanh")
1. Tạo và chuyển sang nhánh mới: `git checkout -b <feat|fix>/<ten-nhanh>`
2. Kiểm tra typecheck và unit test liên quan.
3. Commit với conventional commit message rõ ràng.
4. Đẩy lên remote theo nhánh mới: `git push -u origin <ten-nhanh>`
5. Cung cấp đường dẫn tạo Pull Request trên GitHub cho người dùng.
