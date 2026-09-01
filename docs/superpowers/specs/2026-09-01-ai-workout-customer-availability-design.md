# Thiết kế xếp lịch giáo án AI theo thời gian rảnh của khách hàng

Ngày: 2026-09-01

## Bối cảnh

Wizard tạo giáo án bằng AI hiện cho PT chọn khách hàng, duyệt đề xuất số tuần, số buổi và thời lượng, sau đó AI tự quyết định ngày giờ cho từng buổi. Hệ thống chưa nhận thời gian rảnh của khách nên lịch sinh ra có thể không phù hợp với lịch thực tế.

Tính năng này bổ sung lịch rảnh lặp hằng tuần vào phiên wizard. Lịch chỉ dùng để phân tích và xếp bản nháp hiện tại, không lưu vào hồ sơ khách hàng hoặc database.

## Mục tiêu

- PT nhập được một hoặc nhiều khung giờ rảnh theo từng ngày trong tuần trước khi AI phân tích.
- AI dùng lịch rảnh khi đề xuất tần suất và tạo nội dung giáo án.
- Backend xếp các buổi tập vào lịch rảnh bằng thuật toán quyết định, không phụ thuộc hoàn toàn vào việc mô hình có tuân thủ prompt hay không.
- Mỗi khách chỉ có tối đa một buổi tập trong một ngày.
- Nếu lịch rảnh không đủ, hệ thống vẫn tạo giáo án và xếp các buổi còn lại ngoài lịch rảnh.
- Workout Studio cảnh báo rõ các buổi nằm ngoài lịch rảnh và cập nhật cảnh báo khi PT chỉnh lịch.
- Lịch rảnh không được lưu cùng template, customer plan hoặc customer profile.

## Ngoài phạm vi

- Không lưu hoặc quản lý lịch rảnh lâu dài trong hồ sơ khách hàng.
- Không tự suy ra lịch rảnh từ Calendar hoặc lịch làm việc của PT.
- Không tự tạo CalendarEvent sau khi sinh giáo án.
- Không tự gán hoặc xuất bản giáo án cho khách hàng.
- Không cho phép nhiều buổi tập trong cùng một ngày.

## Mô hình dữ liệu tạm thời

Frontend và backend dùng cấu trúc chung:

```ts
interface WorkoutAvailabilitySlot {
  dayNumber: number;   // 1 đến 7
  startMinute: number; // 0 đến 1425, bước 15 phút
  endMinute: number;   // 15 đến 1440, bước 15 phút
}
```

`availabilitySlots` là mảng bắt buộc có ít nhất một phần tử trong cả request phân tích và request tạo chi tiết. Các quy tắc:

- `dayNumber` từ 1 đến 7;
- thời gian theo bước 15 phút;
- `endMinute` phải lớn hơn `startMinute`;
- các khung trong cùng ngày không được chồng nhau;
- một ngày có thể có nhiều khung rảnh;
- lịch được lặp lại giống nhau cho mọi tuần trong chu kỳ 4–12 tuần.

Không thêm field vào Mongoose model. Backend chỉ echo lịch rảnh trong bản nháp AI để Workout Studio sử dụng trong phiên điều hướng hiện tại; payload lưu template loại bỏ field này.

## Luồng giao diện

### Bước chọn khách và nhập lịch rảnh

Trong bước đầu của `AiWorkoutWizard`, sau khi chọn khách hàng, PT nhập lịch rảnh theo Thứ 2 đến Chủ nhật. Mỗi ngày có thể thêm hoặc xóa nhiều hàng `Giờ bắt đầu – Giờ kết thúc`.

PT không thể bấm `Phân tích bằng AI` nếu chưa có khung giờ hợp lệ. Lỗi hiển thị tại wizard và dữ liệu đã nhập không bị mất.

### Bước duyệt đề xuất

API đề xuất nhận `availabilitySlots`. Prompt có bản tóm tắt số ngày rảnh, số khung và độ dài từng khung để AI cân nhắc `sessionsPerWeek` và `minutesPerSession`.

Màn hình duyệt hiển thị thêm số ngày rảnh và tổng số khung. PT vẫn được chỉnh số tuần, số buổi và số phút như hiện tại.

### Bước xác nhận tạo

Bước cuối hiển thị lại cấu hình cùng tóm tắt lịch rảnh. Request tạo chi tiết gửi:

```json
{
  "customerId": "object-id",
  "proposal": {},
  "availabilitySlots": [
    { "dayNumber": 1, "startMinute": 1080, "endMinute": 1200 }
  ],
  "additionalRequest": ""
}
```

Kết quả được mở trong Workout Studio như hiện tại.

### Cảnh báo trong Workout Studio

Bản nháp AI mang theo `availabilitySlots`. Studio tính lại các buổi nằm ngoài lịch rảnh từ `scheduledExercises` hiện tại và hiển thị banner:

- tổng số buổi ngoài lịch rảnh;
- tuần, thứ và khung giờ của từng buổi;
- giải thích rằng PT có thể kéo thả sang khung phù hợp trước khi lưu.

Cảnh báo tự biến mất hoặc thay đổi khi PT kéo, thả, thêm, xóa hoặc đổi thời lượng bài. `availabilitySlots` và cảnh báo không được đưa vào API lưu template.

## Thuật toán xếp lịch backend

### Chuẩn hóa buổi tập

Kết quả AI vẫn dùng `scheduledExercises`. Backend nhóm bài theo cặp `weekNumber + dayNumber` để tạo các buổi logic. Trong mỗi nhóm:

- sắp bài theo `startMinute`;
- tính độ dài buổi từ thời điểm bắt đầu sớm nhất đến thời điểm kết thúc muộn nhất;
- giữ nguyên thứ tự và khoảng cách tương đối giữa các bài khi di chuyển cả buổi.

Một tuần không được có nhiều hơn `sessionsPerWeek` nhóm và không được có hai nhóm sau chuẩn hóa trên cùng một ngày. Dữ liệu AI sai cấu trúc, trùng bài hoặc vượt giới hạn 24 giờ tiếp tục bị từ chối.

### Gán vào lịch rảnh

Với từng tuần:

1. Sắp các buổi theo ngày và giờ AI đề xuất.
2. Sắp các khung rảnh theo `dayNumber`, rồi `startMinute`.
3. Với mỗi buổi, chọn khung chưa sử dụng sớm nhất có độ dài đủ chứa toàn bộ buổi.
4. Mỗi ngày chỉ được dùng cho một buổi, kể cả ngày có nhiều khung.
5. Dời cả nhóm bài tới đầu khung đã chọn và giữ offset tương đối.

### Fallback ngoài lịch rảnh

Nếu không còn khung phù hợp:

1. ưu tiên ngày/giờ AI đề xuất nếu ngày đó chưa có buổi và lịch không trùng;
2. nếu ngày đề xuất đã dùng, chọn ngày chưa dùng sớm nhất trong tuần;
3. giữ giờ bắt đầu AI đề xuất khi hợp lệ, nếu không thì dùng giờ bắt đầu hợp lệ gần nhất theo bước 15 phút;
4. đánh dấu buổi là `OUTSIDE_AVAILABILITY` trong dữ liệu cảnh báo tạm thời.

Vì `sessionsPerWeek` tối đa 7 và mỗi tuần có 7 ngày, thuật toán luôn có thể giữ giới hạn một buổi/ngày khi dữ liệu AI có đúng số buổi. Nếu AI trả nhiều hơn cấu hình hoặc không thể đặt trong khung 24 giờ, backend từ chối kết quả thay vì âm thầm làm mất buổi.

## API và validation

### `POST /api/ai/workout-proposals`

Body bổ sung `availabilitySlots` bắt buộc. Backend validate quyền truy cập khách hàng và toàn bộ quy tắc lịch trước khi gọi provider.

### `POST /api/ai/workout-generations`

Body bổ sung cùng `availabilitySlots` bắt buộc. Service đưa lịch vào prompt, parse kết quả AI, nhóm buổi và chạy bộ xếp lịch quyết định.

Response bổ sung dữ liệu tạm thời:

```ts
{
  ...draft,
  availabilitySlots: WorkoutAvailabilitySlot[],
  scheduleWarnings: Array<{
    type: 'OUTSIDE_AVAILABILITY';
    weekNumber: number;
    dayNumber: number;
    startMinute: number;
    endMinute: number;
  }>;
}
```

Frontend không tin `scheduleWarnings` như nguồn duy nhất; Studio tính lại cảnh báo từ lịch hiện tại để phản ánh thao tác chỉnh sửa của PT.

## Thành phần triển khai

- `frontend/src/types/`: định nghĩa availability và warning dùng chung.
- `frontend/src/services/`: hàm validate, tóm tắt và phát hiện buổi ngoài lịch rảnh.
- `AiWorkoutWizard`: state tạm, editor lịch rảnh, payload proposal/generation và tóm tắt.
- `WorkoutStudioPage` cùng component banner riêng: nhận dữ liệu tạm và hiển thị cảnh báo động.
- `backend/routes/aiWorkout.ts`: Joi schema dùng chung cho hai endpoint.
- `backend/services/aiWorkoutService.ts`: prompt, chuẩn hóa nhóm buổi, xếp lịch và sinh warnings.

UI tiếp tục dùng các class `module-*` và `workout-wizard-*` hiện có; chỉ thêm selector chuyên biệt khi cấu trúc lịch theo ngày không thể biểu đạt bằng class sẵn có. Không dùng inline style hoặc framework CSS mới.

## Xử lý lỗi

- Không có lịch rảnh: chặn ở frontend và trả validation error ở backend.
- Khung sai bước 15 phút, kết thúc không sau bắt đầu hoặc chồng nhau: từ chối trước khi gọi AI.
- Lịch rảnh không đủ: không chặn; dùng fallback và cảnh báo trong Studio.
- AI trả sai số tuần, quá số buổi, ngày/giờ sai hoặc bài chồng nhau: từ chối response với lỗi provider chuẩn hóa.
- Provider timeout/rate limit: giữ nguyên khách, proposal và lịch rảnh trong wizard để PT thử lại.
- Rời Studio khi chưa lưu: tiếp tục dùng cảnh báo dirty-state hiện có.

## Kiểm thử

### Backend

- Hai endpoint bắt buộc có ít nhất một availability slot.
- Validator từ chối ngày, giờ, bước 15 phút và khung chồng nhau không hợp lệ.
- Proposal prompt nhận đúng lịch rảnh.
- Bộ xếp lịch ưu tiên khung đủ dài, tối đa một buổi/ngày và lặp đúng cho từng tuần.
- Nhiều khung trong một ngày vẫn chỉ nhận một buổi.
- Thiếu khung tạo fallback ngoài lịch rảnh và warning chính xác.
- Thứ tự và offset bài trong một buổi được giữ nguyên khi di chuyển.
- Kết quả vượt số buổi hoặc 24 giờ bị từ chối.

### Frontend

- PT thêm/xóa khung theo từng ngày và dữ liệu không mất khi API lỗi.
- Không thể phân tích khi chưa có lịch rảnh hoặc lịch sai.
- Cả proposal và generation request đều mang availability.
- Các bước duyệt và xác nhận hiển thị tóm tắt lịch rảnh.
- Studio liệt kê đúng buổi ngoài lịch rảnh.
- Cảnh báo cập nhật sau thao tác thay đổi lịch.
- Payload lưu template không chứa availability hoặc warnings.
- Test responsive và accessibility cho label, nút thêm/xóa và banner cảnh báo.

## Tiêu chí nghiệm thu

- PT bắt buộc nhập ít nhất một khung rảnh lặp hằng tuần trước khi phân tích AI.
- AI proposal và draft đều nhận lịch rảnh có cấu trúc.
- Mọi buổi có thể đặt vào lịch rảnh đều được backend đặt vào khung phù hợp.
- Không có quá một buổi tập trong cùng ngày.
- Khi không đủ lịch rảnh, giáo án vẫn được tạo và từng buổi ngoài lịch được cảnh báo rõ trong Studio.
- Cảnh báo phản ánh lịch hiện tại sau khi PT chỉnh sửa.
- Không có dữ liệu lịch rảnh nào được lưu vào customer profile, workout template hoặc customer workout plan.
- Test, typecheck, lint và production build liên quan đều đạt trước khi hoàn tất.
