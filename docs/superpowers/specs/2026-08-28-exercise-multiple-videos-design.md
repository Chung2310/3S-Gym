# Thiết kế nhiều video cho Thư viện bài tập

## Mục tiêu

Cho phép PT/Admin gắn nhiều video hướng dẫn vào một bài tập. Mỗi video có tiêu đề và được cung cấp theo một trong hai cách: tải file lên hoặc nhập liên kết video.

## Phạm vi

- Bổ sung quản lý nhiều video trong form tạo/sửa bài tập.
- Hỗ trợ file MP4, WebM và MOV, tối đa 100 MB mỗi file.
- Hiển thị các video đã lưu trong Thư viện bài tập.
- Giữ tương thích với dữ liệu cũ đang dùng trường `videoUrl`.
- Không bao gồm cắt video, tạo thumbnail, thay đổi thứ tự bằng kéo-thả hoặc xoá file vật lý khỏi Cloudinary.

## Mô hình dữ liệu và tương thích

`Exercise` có thêm trường `videos`, là mảng các phần tử:

```ts
interface ExerciseVideo {
  title: string;
  url: string;
  source: 'UPLOAD' | 'LINK';
}
```

- `title` bắt buộc, được trim.
- `url` bắt buộc và phải là URI hợp lệ.
- `source` bắt buộc để giao diện biết video được tải lên hay nhập link.
- Thứ tự phần tử trong mảng là thứ tự hiển thị.
- Trường `videoUrl` cũ được giữ trong schema trong giai đoạn tương thích, nhưng client mới không ghi vào trường này.
- Khi trả bài tập, nếu `videos` rỗng nhưng `videoUrl` cũ có giá trị, API chuẩn hoá thành một phần tử `{ title: 'Video hướng dẫn', url: videoUrl, source: 'LINK' }`. Nhờ vậy dữ liệu cũ xuất hiện ngay mà không cần migration bắt buộc.
- Khi bài tập cũ được sửa và gửi `videos`, mảng mới trở thành nguồn dữ liệu chính.

## API bài tập

API tạo/cập nhật bài tập nhận thêm `videos`:

```json
{
  "videos": [
    {
      "title": "Kỹ thuật chuẩn",
      "url": "https://example.com/squat.mp4",
      "source": "LINK"
    }
  ]
}
```

Joi kiểm tra mảng, tiêu đề, URI và enum nguồn. Payload không hợp lệ sử dụng hệ thống lỗi validation tiếng Việt hiện có. Service chuẩn hoá dữ liệu cũ ở đầu ra danh sách và đầu ra tạo/cập nhật.

## API tải video

Thêm endpoint có xác thực `POST /api/upload/video` cho ADMIN và PT:

- multipart field: `video`
- MIME cho phép: `video/mp4`, `video/webm`, `video/quicktime`
- dung lượng tối đa: 100 MB
- upload lên Cloudinary với `resource_type: 'video'` và thư mục riêng `3s-gym/exercises/videos`
- trả về `url` và `publicId` theo cấu trúc response upload hiện có
- lỗi thiếu file, sai định dạng, quá dung lượng hoặc Cloudinary chưa cấu hình có thông báo tiếng Việt

Upload diễn ra khi người dùng chọn file. URL nhận về được đưa vào mục video tương ứng; form bài tập chỉ được gửi sau khi mọi upload hoàn tất. Nếu upload thất bại, mục đó hiển thị lỗi và không cho lưu URL rỗng.

## Giao diện form

Form tạo/sửa có khu vực **Video hướng dẫn** bên dưới thông tin kỹ thuật:

- Nút **Thêm video** tạo một mục mới.
- Mỗi mục gồm tiêu đề bắt buộc và lựa chọn nguồn **Điền liên kết** / **Tải video lên**.
- Với liên kết: hiển thị input URL có placeholder rõ ràng.
- Với upload: hiển thị file input, tên file, trạng thái đang tải và URL sau khi tải thành công.
- Có nút xoá từng mục.
- Có thể thêm không giới hạn về mặt nghiệp vụ; giới hạn thực tế do kích thước request JSON và tài nguyên trình duyệt.
- Nút lưu bị vô hiệu trong lúc đang upload.
- Khi sửa bài tập, form nạp đầy đủ `videos`; dữ liệu `videoUrl` cũ đã được API chuẩn hoá nên hiển thị như một mục bình thường.

## Hiển thị trong thư viện

Danh sách thêm cột **Video**. Nếu bài tập có video, cột hiển thị số lượng và các liên kết theo tiêu đề; liên kết mở tab mới với thuộc tính an toàn `noopener noreferrer`. Nếu không có, hiển thị trạng thái chưa có video. Cột giữ gọn để không làm bảng quá rộng.

## Trạng thái và lỗi

- URL hoặc tiêu đề thiếu: validation phía trình duyệt chặn submit và backend vẫn kiểm tra lại.
- Đổi nguồn của một mục: xoá giá trị URL/file của nguồn trước để tránh gửi nhầm.
- Xoá mục đã upload chỉ xoá khỏi bài tập; chưa xoá asset Cloudinary trong phạm vi này.
- Đóng form khi có thay đổi tiếp tục dùng cảnh báo dirty của `FormModal`.
- Upload thất bại không làm mất các mục video khác.

## Kiểm thử

- Backend model/validator chấp nhận nhiều video hợp lệ và từ chối title, URL, source sai.
- Upload route chấp nhận MP4/WebM/MOV, từ chối MIME khác và file quá 100 MB.
- Service/API trả một video chuẩn hoá từ `videoUrl` cũ.
- Frontend tạo nhiều mục gồm cả link và upload, xoá mục, chặn lưu lúc upload, và gửi đúng payload.
- Frontend sửa bài tập nạp đúng các video hiện có và danh sách hiển thị số lượng/tiêu đề.
- Chạy typecheck, test liên quan và build sau khi triển khai.
