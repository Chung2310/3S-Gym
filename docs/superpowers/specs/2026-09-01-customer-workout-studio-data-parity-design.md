# Thiết kế đồng bộ dữ liệu Customer Workout Studio

## Bối cảnh

Workout Studio dùng chung một trang cho hai chế độ:

- tạo hoặc sửa giáo án mẫu;
- sửa snapshot giáo án riêng đã gán cho khách hàng.

Frontend gửi cùng cấu trúc lịch gồm `weekNumber`, `dayNumber`, `startMinute`, `durationMinutes`, thông tin bài tập, `trackingType` và `prescription`. Tuy nhiên backend hiện dùng hai hợp đồng khác nhau:

- validator giáo án mẫu hiểu lịch nhiều tuần và kiểm tra các quy tắc Studio;
- validator giáo án khách hàng chưa cho phép `weekNumber`;
- schema MongoDB của `WorkoutPlan.scheduledExercises` cũng chưa lưu `weekNumber`.

Vì vậy một giáo án hợp lệ có thể được tạo và gán thành công nhưng bị từ chối khi PT mở bản của khách rồi bấm lưu mà không chỉnh sửa. Với giáo án nhiều tuần, snapshot còn có nguy cơ mất số tuần ngay lúc gán.

## Mục tiêu

- Giáo án mẫu và giáo án khách hàng dùng chung hợp đồng dữ liệu cốt lõi của Workout Studio.
- Snapshot khách hàng bảo toàn đầy đủ lịch nhiều tuần khi gán, tải, sửa và lưu lại.
- Bấm lưu một bản giáo án khách hàng hợp lệ mà không chỉnh sửa không phát sinh lỗi validation.
- Các quy tắc thời gian, tracking và prescription nhất quán giữa hai chế độ Studio.
- Sửa snapshot khách hàng không làm thay đổi giáo án mẫu nguồn.

## Ngoài phạm vi

- Không tự động suy đoán hoặc khôi phục `weekNumber` đã mất trong dữ liệu cũ.
- Không đồng bộ tự động thay đổi mới từ template sang snapshot đã gán.
- Không thay đổi giao diện Workout Studio.
- Không thay đổi quy tắc một giáo án active cho mỗi khách hàng.

## Thiết kế backend

### Schema validation dùng chung

Tách các thành phần Joi dùng chung khỏi validator giáo án mẫu thành một module validator cốt lõi:

- các loại tracking được phân loại;
- schema prescription theo từng `trackingType`;
- trường bài tập dùng trong Studio;
- schema session;
- schema bài đã xếp lịch;
- schema bài chưa xếp lịch;
- metadata chung của giáo án;
- hàm kiểm tra lịch theo số ngày và xung đột thời gian.

Schema bài đã xếp lịch dùng cấu trúc chuẩn:

- `weekNumber`: số nguyên từ 1, mặc định 1;
- `dayNumber`: số nguyên từ 1 đến 7;
- `startMinute`: từ 0 đến 1425 và chia hết cho 15;
- `durationMinutes`: từ 15 đến 1440 và chia hết cho 15;
- tổng thời gian không vượt quá 24 giờ;
- đầy đủ trường bài tập, tracking và prescription.

Validator giáo án mẫu tiếp tục bổ sung các trường chỉ thuộc template như `generatedExercises` và quy tắc tạo mới phải có nội dung. Validator PATCH giáo án khách hàng sử dụng trực tiếp các trường Studio dùng chung, yêu cầu body không rỗng và chạy cùng hàm kiểm tra lịch.

Hàm kiểm tra lịch tính ngày tuyệt đối bằng:

```text
dayIndex = (weekNumber - 1) * 7 + dayNumber
```

Một bài không được vượt quá `durationDays`. Hai bài chỉ được xem là xung đột khi cùng tuần, cùng ngày và giao nhau về thời gian. Cùng giờ ở hai tuần khác nhau là hợp lệ.

### Lưu trữ snapshot

Thêm `weekNumber` vào `WorkoutPlan.scheduledExercises` với kiểu số, giá trị nhỏ nhất 1 và mặc định 1. Cấu trúc này đồng nhất với `WorkoutTemplate.scheduledExercises`.

Luồng `assignCustomerWorkoutPlan` vẫn sao chép snapshot độc lập. Khi Mongoose tạo `WorkoutPlan`, `weekNumber` không còn bị loại khỏi dữ liệu. Các bản ghi cũ không có trường này được đọc như tuần 1 nhờ giá trị mặc định và logic hydrate hiện có ở frontend.

Không chạy migration suy đoán tuần cho dữ liệu cũ vì không có nguồn chắc chắn để xác định lịch ban đầu. Việc thiếu `weekNumber` ở bản cũ luôn được xử lý an toàn thành tuần 1.

### Cập nhật giáo án khách hàng

`updateCustomerWorkoutPlan` tiếp tục:

- chỉ cho phép sửa snapshot `ACTIVE`;
- kiểm tra quyền truy cập khách hàng;
- kiểm tra toàn bộ bài tập đã có tracking hợp lệ;
- cập nhật các trường mutable;
- dựng lại `sessions` từ `scheduledExercises` khi client không gửi `sessions`;
- tăng `version` sau mỗi lần lưu.

Khi dựng sessions, nhóm bài theo cặp `weekNumber:dayNumber` để không gộp nhầm các ngày giống nhau ở nhiều tuần.

## Luồng dữ liệu

1. PT tạo giáo án mẫu trong Studio với lịch một hoặc nhiều tuần.
2. Backend validate và lưu đầy đủ `weekNumber` trong template.
3. PT gán template cho khách hàng.
4. Service tạo snapshot `WorkoutPlan`, bảo toàn lịch, tracking và metadata.
5. PT mở `Chi tiết khách hàng → Giáo án → Mở Studio`.
6. Frontend tải snapshot, hydrate bài tập và mặc định dữ liệu legacy thiếu tuần thành tuần 1.
7. Khi lưu, payload đi qua cùng hợp đồng validation cốt lõi với Studio mẫu.
8. Backend lưu snapshot và dựng lại sessions mà không sửa template nguồn.

## Xử lý lỗi

- Field không thuộc hợp đồng vẫn bị từ chối; không bật `unknown(true)`.
- Lịch vượt quá số ngày trả lỗi validation rõ ràng.
- Bài trùng giờ trong cùng tuần/ngày bị từ chối.
- Cùng giờ ở tuần khác nhau được chấp nhận.
- Snapshot archived vẫn không thể sửa.
- Bài chưa có tracking hợp lệ vẫn bị từ chối như hiện tại.

## Kiểm thử

### Validator

- PATCH giáo án khách chấp nhận payload Studio có `weekNumber`.
- Lưu nguyên payload nhiều tuần không báo field không được phép.
- Cùng ngày và giờ ở hai tuần khác nhau hợp lệ.
- Trùng giờ trong cùng tuần/ngày bị từ chối.
- Bài vượt `durationDays`, giờ không theo bước 15 phút hoặc vượt 24 giờ bị từ chối.
- Tracking và prescription áp dụng cùng quy tắc với giáo án mẫu.

### Model và service

- Gán template nhiều tuần tạo snapshot giữ nguyên từng `weekNumber`.
- Tải rồi cập nhật snapshot bằng dữ liệu không thay đổi vẫn thành công.
- Sau cập nhật, `scheduledExercises` và sessions vẫn phân biệt đúng tuần.
- Sửa snapshot không thay đổi template nguồn.
- Dữ liệu legacy thiếu `weekNumber` được hiểu là tuần 1.

### Hồi quy

- Test tạo và sửa giáo án mẫu tiếp tục qua.
- Test phân quyền, active/archive và gán lại giáo án khách tiếp tục qua.
- Typecheck, lint, toàn bộ test và production build phải thành công trước khi hoàn tất.

## Tiêu chí nghiệm thu

- Giáo án tạo trong Studio có thể gán cho khách rồi lưu lại ngay trong Customer Studio mà không cần chỉnh sửa.
- Không còn lỗi `tuần tập ... không được phép`.
- Giáo án 2 tuần trở lên giữ nguyên vị trí bài tập qua chu kỳ tạo → gán → tải → lưu → tải lại.
- Hai chế độ Studio dùng chung một nguồn định nghĩa validation cho dữ liệu cốt lõi.
