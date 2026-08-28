# Quy tắc Phát Triển & Hành Vi Trợ Lý AI

## 1. Bỏ qua chạy Test tự động (Skip Automated Tests)
- **Tuyệt đối KHÔNG tự động chạy test (`npm test`, `vitest`, `npx vitest`)** sau mỗi lần thay đổi mã nguồn trừ khi người dùng yêu cầu rõ ràng bằng lời (ví dụ: "chạy test đi", "kiểm tra test").
- Tập trung vào kiểm tra tính hợp lệ TypeScript bằng `npm run typecheck` và đảm bảo giao diện trực quan, không bị lỗi cú pháp hay crash runtime.

## 2. Chuẩn hóa hiển thị & chọn Học viên (Customer Selection & Display)
- **Tên và Số điện thoại**: Tất cả các bảng danh sách (InBody, Mục tiêu, Giáo án, Dinh dưỡng, Chuyển PT, Lịch tập,...) **BẮT BUỘC** hiển thị **Họ và tên** kèm **Số điện thoại (SĐT)** của học viên.
- **Không hiển thị ID thô**: Tuyệt đối không để chuỗi ObjectId thô hiển thị trên UI cho người dùng.
- **Component `CustomerSelect`**: Mọi form/modal cần chọn học viên đều phải dùng `CustomerSelect` (tìm kiếm trực tiếp theo Tên và SĐT).

## 3. Placeholder bắt buộc
- Tất cả các trường `<input>`, `<textarea>`, `FormField`, ô tìm kiếm, ô lọc đều bắt buộc phải có `placeholder` trực quan, rõ ràng và có tính hướng dẫn.

## 4. Bắt buộc có Icon Mắt (Show/Hide Password toggle) cho trường Mật khẩu
- Tất cả các ô nhập mật khẩu (Đăng nhập, Cấp tài khoản học viên, Tạo/Sửa người dùng, Đổi mật khẩu) **BẮT BUỘC** phải có nút icon mắt (`Eye` / `EyeOff`) để người dùng có thể bấm xem / ẩn mật khẩu đang nhập.

