# Thiết kế Workout Plan Studio

## Mục tiêu

Thay form tạo giáo án dạng CRUD bằng một Studio trực quan. PT tạo giáo án có số ngày tùy ý, chọn từng ngày và kéo bài tập vào timeline 24 giờ. Vị trí và chiều cao thẻ thể hiện giờ bắt đầu và tổng thời lượng bài tập.

## Luồng điều hướng

- Nút **Tạo giáo án** tại `/pt/my-workout-plans` điều hướng tới `/pt/my-workout-plans/new`.
- Nút **Sửa** điều hướng tới `/pt/my-workout-plans/:templateId/edit`.
- Studio có nút quay lại danh sách; nếu có thay đổi chưa lưu phải xác nhận trước khi rời trang.
- Sau khi lưu thành công, PT có thể tiếp tục chỉnh sửa trong Studio hoặc quay về danh sách. Lưu lần đầu thay route `new` bằng route edit chứa ID vừa tạo.

## Bố cục Studio

Desktop dùng ba vùng:

1. **Thư viện bài tập** bên trái: tìm kiếm, lọc nhóm cơ/cấp độ và danh sách bài tập có thể kéo.
2. **Timeline trong ngày** ở giữa: hiển thị 00:00–24:00, chia 96 bước 15 phút.
3. **Thuộc tính bài tập** bên phải: chỉnh thời lượng và thông số của thẻ đang chọn.

Thanh trên gồm tên giáo án, mục tiêu, cấp độ, số ngày, trạng thái lưu và nút lưu. Thanh chọn ngày cuộn ngang từ `Ngày 1` đến `Ngày N`, có nút ngày trước/ngày sau và hiển thị tổng thời gian tập của ngày đang chọn.

Trên mobile, ba vùng chuyển thành các panel tuần tự: chọn ngày, thư viện thu gọn, timeline một cột và drawer thuộc tính. Thao tác chạm chọn bài tập rồi chọn **Thêm vào ngày** là phương án dự phòng cho thiết bị không kéo thả thuận tiện.

## Tỷ lệ thời gian

- Timeline phủ từ phút 0 (`00:00`) đến phút 1440 (`24:00`).
- Đơn vị căn chỉnh là 15 phút.
- Mỗi bước 15 phút cao 20 px; toàn timeline cao 1.920 px.
- Vị trí trên của thẻ: `(startMinute / 15) * 20px`.
- Chiều cao thẻ: `(durationMinutes / 15) * 20px`.
- `startMinute` nằm trong 0–1425 và chia hết cho 15.
- `durationMinutes` tối thiểu 15, chia hết cho 15 và không được làm thẻ vượt quá phút 1440.

PT kéo thẻ theo trục dọc để đổi giờ bắt đầu. Tay nắm cạnh dưới thay đổi thời lượng theo bước 15 phút. Nhãn thẻ luôn hiển thị tên, giờ bắt đầu–kết thúc và tổng phút.

## Chống trùng thời gian

Hai thẻ trong cùng ngày không được giao nhau. Hai khoảng `[start, start + duration)` và `[otherStart, otherStart + otherDuration)` trùng khi:

```ts
start < otherStart + otherDuration && otherStart < start + duration
```

Kiểm tra chạy khi thả thẻ, resize, đổi ngày và trước khi lưu. Nếu không hợp lệ, giao diện hoàn tác vị trí/thời lượng gần nhất và báo lỗi. Backend kiểm tra lại toàn bộ lịch để không thể gửi dữ liệu chồng giờ trực tiếp qua API.

## Mô hình dữ liệu

`WorkoutTemplate` giữ các trường cũ và bổ sung:

```ts
interface ScheduledExercise {
  dayNumber: number;
  startMinute: number;
  durationMinutes: number;
  exerciseId?: ObjectId;
  name: string;
  sets: number;
  reps: string;
  weight: string;
  rpe?: number;
  rir?: number;
  tempo: string;
  restSeconds: number;
  notes: string;
}

interface WorkoutTemplate {
  durationDays: number;
  scheduledExercises: ScheduledExercise[];
  sessions: LegacySession[];
}
```

- `dayNumber` bắt đầu từ 1 và không vượt `durationDays`.
- `durationDays` là số nguyên dương tùy ý về nghiệp vụ; áp dụng giới hạn kỹ thuật 365 ngày để bảo vệ payload và UI.
- `scheduledExercises` là nguồn chính cho Studio.
- `sessions` được giữ để tương thích các luồng gán giáo án và lịch sử hiện tại trong giai đoạn chuyển đổi.
- Khi lưu Studio, backend dựng `sessions` tương thích từ các ngày có bài tập, sắp theo `dayNumber` rồi `startMinute`. Mỗi session có tên `Ngày N` và danh sách exercise tương ứng.

## Giáo án cũ

Giáo án không có `scheduledExercises` được mở trong Studio với toàn bộ bài tập cũ nằm trong khay **Chưa xếp lịch**. Không tự suy đoán giờ bắt đầu. PT kéo từng bài vào ngày và giờ mong muốn. Giáo án vẫn có thể xem/gán theo dữ liệu `sessions` cũ nếu chưa lưu lại bằng Studio.

Khay chưa xếp lịch giữ bản sao đầy đủ sets/reps/rest/tempo/notes. Sau khi thả vào timeline, mục được chuyển khỏi khay. Có thể đưa thẻ từ timeline trở lại khay.

## API và validation

POST/PATCH `/api/workout-templates` nhận `durationDays`, `scheduledExercises` và `sessions` tương thích.

Backend kiểm tra:

- `durationDays`: integer 1–365.
- `dayNumber`: integer 1–`durationDays`.
- `startMinute`: integer 0–1425, chia hết cho 15.
- `durationMinutes`: integer 15–1440, chia hết cho 15.
- `startMinute + durationMinutes <= 1440`.
- title, exercise name và các thông số tập theo validator hiện có.
- không có hai scheduled exercise trùng thời gian trong cùng ngày.

Validation phụ thuộc `durationDays` và chống trùng được thực hiện bằng custom Joi validator hoặc helper domain thuần để có thể unit test độc lập. API trả lỗi tiếng Việt, chỉ rõ ngày và bài tập gây xung đột.

## Trạng thái frontend

Studio dùng một draft duy nhất:

```ts
interface WorkoutStudioDraft {
  title: string;
  goal: string;
  level: string;
  durationDays: number;
  scheduledExercises: StudioExercise[];
  unscheduledExercises: StudioExercise[];
}
```

Mọi thao tác kéo, resize, đổi thuộc tính và thay số ngày cập nhật draft bất biến. Nếu giảm số ngày làm mất bài tập ở các ngày cuối, phải xác nhận; bài bị ảnh hưởng được chuyển vào khay chưa xếp lịch thay vì xoá.

## Kéo thả và khả năng truy cập

- Dùng Pointer Events để thống nhất chuột và cảm ứng, không phụ thuộc thư viện ngoài.
- Trong lúc kéo hiển thị ghost card, giờ dự kiến và vùng thả hợp lệ/không hợp lệ.
- Auto-scroll timeline khi con trỏ gần mép trên/dưới.
- Hỗ trợ bàn phím: chọn thẻ, dùng mũi tên để dịch 15 phút; Shift + mũi tên thay đổi 60 phút; nút tăng/giảm thời lượng trong panel thuộc tính.
- Các thao tác quan trọng có `aria-label`, trạng thái lỗi được thông báo bằng vùng `aria-live`.

## Thành phần frontend

- `WorkoutStudioPage`: tải/lưu draft và điều phối cảnh báo rời trang.
- `StudioHeader`: metadata, số ngày và hành động lưu.
- `StudioDayNavigator`: chọn ngày và tổng thời gian.
- `ExercisePalette`: tìm/lọc/kéo bài tập.
- `DayTimeline`: lưới 24 giờ, drop target và phát hiện va chạm.
- `ScheduledExerciseCard`: thẻ tỷ lệ thời gian và resize handle.
- `ExerciseInspector`: chỉnh thông số thẻ đang chọn.
- `UnscheduledExerciseTray`: chứa bài từ giáo án cũ hoặc bài bị đưa ra khỏi lịch.
- `workoutStudioModel.ts`: hàm thuần snap 15 phút, tính hình học, phát hiện overlap, chuyển đổi legacy và dựng payload.

## Kiểm thử

- Unit test helper snap, hình học tỷ lệ, giới hạn cuối ngày và phát hiện overlap.
- Backend test chấp nhận lịch hợp lệ; từ chối sai bước 15 phút, vượt ngày, vượt 24 giờ và trùng lịch.
- Component test kéo bài vào giờ, resize, hoàn tác khi trùng, chuyển ngày, thay số ngày và khay chưa xếp lịch.
- Route test new/edit và redirect sau lần lưu đầu.
- Regression test danh sách, gán giáo án khách hàng và payload `sessions` tương thích.
- Chạy test liên quan, typecheck và production build.

## Ngoài phạm vi phiên bản đầu

- Lặp bài tự động theo quy tắc tuần.
- Chọn nhiều thẻ và di chuyển hàng loạt.
- Undo/redo nhiều bước.
- Cộng tác thời gian thực giữa nhiều PT.
- Lịch ngày thực tế của một khách hàng; Studio chỉ dùng ngày tương đối `Ngày 1…Ngày N`.
