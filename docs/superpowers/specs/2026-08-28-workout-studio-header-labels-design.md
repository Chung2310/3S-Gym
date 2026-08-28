# Workout Studio Header Labels Design

## Mục tiêu

Hiển thị nhãn cố định phía trên bốn trường thông tin trong header Studio để người dùng luôn nhận biết được ý nghĩa của dữ liệu sau khi đã nhập.

## Thiết kế

- Bốn nhãn: `Tên giáo án`, `Mục tiêu`, `Cấp độ`, `Số ngày`.
- Mỗi nhãn và control nằm trong một `label` riêng, không thay đổi props hay luồng cập nhật dữ liệu hiện tại.
- Nhãn dùng cỡ chữ nhỏ, rõ ràng; control giữ chiều cao đồng nhất.
- Nhóm trường dùng grid responsive: một cột trên màn hình hẹp, hai cột ở màn hình vừa và bốn cột khi đủ rộng.
- Giữ `aria-label`, placeholder, disabled state và các callback hiện tại.
- Không thay đổi API hoặc dữ liệu giáo án.

## Kiểm thử

- Component test xác nhận đủ bốn nhãn hiển thị và liên kết đúng với control.
- Chạy test Studio hiện có, lint và build frontend.
