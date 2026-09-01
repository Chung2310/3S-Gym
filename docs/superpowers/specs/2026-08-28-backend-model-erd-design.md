# Thiết kế ERD đầy đủ cho backend 3S Gym

## Mục tiêu

Tạo một ảnh ERD duy nhất từ toàn bộ Mongoose model trong `backend/models`, giúp đội phát triển tra cứu collection, trường dữ liệu và quan hệ giữa các collection.

## Phạm vi

- Bao gồm đủ 29 model hiện có trong `backend/models`.
- Mỗi collection hiển thị `_id`, toàn bộ trường được khai báo trong schema, kiểu dữ liệu và các ràng buộc đáng chú ý: required, unique, index, enum.
- Các subdocument và mảng subdocument được thể hiện lồng trong collection cha, không giả lập thành collection độc lập.
- Các trường do `timestamps: true` sinh ra được ghi là `createdAt` và `updatedAt`.

## Quy ước quan hệ

- Đường liền: quan hệ thật được khai báo bằng Mongoose `ref`.
- Đường nét đứt: tham chiếu mềm, không có `ref`, chẳng hạn `resourceId` hoặc `referenceId`; chỉ vẽ khi đích không mơ hồ.
- Nhãn cạnh dùng tên trường nguồn để phân biệt khi một collection tham chiếu cùng một đích qua nhiều vai trò.
- Quan hệ từ trường mảng, ví dụ `FeatureFlag.pilotUserIds`, được ký hiệu nhiều-phần-tử tới một collection đích.

## Bố cục và khả năng đọc

- Đây là ERD đầy đủ nên ưu tiên khổ ngang lớn, nền sáng và độ tương phản cao.
- `User` và `CustomerProfile` là hai nút trung tâm vì phần lớn model nghiệp vụ tham chiếu tới chúng.
- Các collection còn lại được bố trí theo vùng nghiệp vụ: tập luyện, dinh dưỡng & chỉ số cơ thể, chăm sóc & vận hành, tri thức & trợ lý, hệ thống.
- Có chú giải cho ký hiệu trường và kiểu đường quan hệ.

## Đầu ra

- `docs/diagrams/backend-model-erd.svg`: bản vector để phóng to và chỉnh sửa.
- `docs/diagrams/backend-model-erd.png`: bản raster độ phân giải cao để xem hoặc chia sẻ nhanh.
- Một file nguồn sơ đồ có thể tái tạo hai ảnh khi model thay đổi.

## Kiểm chứng

- Đối chiếu danh sách model trong ảnh với danh sách file `backend/models/*.ts`.
- Đối chiếu mọi `ref` trong mã nguồn với cạnh tương ứng trên sơ đồ.
- Kiểm tra SVG hợp lệ và PNG mở được, có kích thước đủ lớn để đọc toàn bộ trường.
