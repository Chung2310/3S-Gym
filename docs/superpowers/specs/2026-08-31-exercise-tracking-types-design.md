# Exercise Tracking Types Design

## Mục tiêu

Thay cơ chế ghi nhận buổi tập đang áp một form Strength cho mọi bài bằng hệ thống tracking theo loại bài tập. Loại theo dõi đi xuyên suốt từ thư viện bài tập, giáo án được gán, form ghi nhận, snapshot lịch sử đến analytics Tiến độ.

Hệ thống phải đáp ứng hai yêu cầu đồng thời:

1. Thư viện cung cấp cấu hình mặc định để PT không phải chọn lại ở mọi giáo án.
2. PT có thể override trong từng giáo án vì cùng một bài có thể được kê theo cách khác nhau, ví dụ chạy liên tục hoặc chạy interval.

## Nguyên nhân hiện tại

- `Exercise` không có loại theo dõi hoặc danh sách metric.
- `WorkoutBuilder` tự thêm mọi bài với 3 sets và 10 reps.
- `WorkoutSessionLogger` render cố định Mức tạ, Reps, RPE và RIR cho mọi bài.
- `WorkoutSession` và analytics chỉ mô hình hóa set Strength.
- Cardio, interval và mobility vì vậy phải nhập các trường không có ý nghĩa hoặc không thể ghi dữ liệu phù hợp.

## Phạm vi

Thiết kế bao phủ end-to-end:

- thư viện bài tập;
- giáo án mẫu và giáo án được gán;
- form ghi nhận buổi tập;
- snapshot WorkoutSession;
- lịch sử buổi tập;
- analytics và màn chi tiết Tiến độ;
- migration dữ liệu cũ;
- validation backend và kiểm thử.

Không thay đổi nghiệp vụ điểm danh, trừ buổi gói tập, phân quyền PT hoặc cơ chế chống ghi trùng.

## Loại theo dõi

```ts
type ExerciseTrackingType =
  | 'UNCLASSIFIED'
  | 'STRENGTH'
  | 'BODYWEIGHT'
  | 'CARDIO'
  | 'INTERVAL'
  | 'MOBILITY';
```

### Metric theo loại

| Tracking type | Thông số kê đơn và ghi nhận |
| --- | --- |
| `STRENGTH` | Sets, mức tạ, reps, RPE, RIR, thời gian nghỉ |
| `BODYWEIGHT` | Sets, reps, mức tạ bổ sung tùy chọn, RPE, RIR, thời gian nghỉ |
| `CARDIO` | Thời gian, quãng đường, pace, nhịp tim trung bình, độ dốc, calories, RPE |
| `INTERVAL` | Số vòng, thời gian vận động, thời gian nghỉ, quãng đường hoặc reps mỗi vòng, RPE |
| `MOBILITY` | Thời gian, số lần, bên thực hiện, mức khó chịu |
| `UNCLASSIFIED` | Không cho ghi nhận hoặc publish/gán cho đến khi PT chọn loại |

Metric không thuộc tracking type không được render và backend không chấp nhận trong payload.

## Nơi lưu dữ liệu

### Exercise library

`Exercise` có trường bắt buộc `defaultTrackingType`. Bản ghi mới phải chọn một loại khác `UNCLASSIFIED`; `UNCLASSIFIED` chỉ dành cho dữ liệu cũ cần phân loại.

Thư viện chỉ cung cấp loại mặc định, không chứa toàn bộ prescription của giáo án.

### Workout template và assigned workout plan

Mỗi bài trong `sessions`, `scheduledExercises` và `unscheduledExercises` lưu:

```ts
{
  exerciseId?: ObjectId;
  name: string;
  trackingType: ExerciseTrackingType;
  prescription: TrackingPrescription;
}
```

Khi thêm bài từ thư viện:

1. Copy `defaultTrackingType` thành `trackingType`.
2. Tạo prescription rỗng hoặc mặc định đúng với loại đó.
3. Cho phép PT override `trackingType` và prescription trong giáo án.
4. Không ghi ngược override vào Exercise gốc.

Khi gán template cho khách, `WorkoutPlan` snapshot cả `trackingType` và `prescription`. Thay đổi template hoặc Exercise sau đó không tác động đến bản đã gán.

### Workout session

Mỗi exercise log lưu discriminated snapshot:

```ts
{
  exerciseId?: ObjectId;
  name: string;
  trackingType: ExerciseTrackingType;
  prescribedSnapshot: TrackingPrescription;
  result: TrackingResult;
  notes?: string;
}
```

`TrackingPrescription` và `TrackingResult` là discriminated union theo `trackingType`. Backend tạo `prescribedSnapshot` từ `WorkoutPlan` đang gán, không lấy lại từ WorkoutTemplate gốc.

## Luồng giao diện

### Thư viện bài tập

- Form thêm/sửa có trường “Loại theo dõi”.
- Card hiển thị badge Sức mạnh, Bodyweight, Cardio, Interval hoặc Mobility.
- Dữ liệu cũ `UNCLASSIFIED` có badge cảnh báo “Cần phân loại”.
- Bộ lọc có thể lọc theo tracking type.

### Workout Studio và giáo án khách hàng

- Bài mới lấy tracking type mặc định từ thư viện.
- PT có thể đổi loại riêng trên bài trong giáo án.
- Form prescription thay đổi theo loại.
- Khi đổi loại, các field không còn phù hợp bị loại khỏi draft sau một xác nhận rõ ràng nếu đã có dữ liệu.
- Không cho save/publish/gán giáo án nếu còn bài `UNCLASSIFIED`.
- Validation lỗi chỉ rõ tên bài chưa phân loại.

### Ghi nhận buổi tập

`WorkoutSessionLogger` không còn danh sách field hardcode. Nó chọn editor theo tracking type:

- Strength editor.
- Bodyweight editor.
- Cardio editor.
- Interval editor.
- Mobility editor.

Strength và Bodyweight hiển thị nhãn `Set 1`, `Set 2` rõ ràng, đồng thời cho thêm hoặc bỏ set thực tế. Cardio không render Mức tạ, Reps hoặc RIR. Prescription từ giáo án là mục tiêu/gợi ý; PT nhập kết quả thực tế.

Bài `UNCLASSIFIED` hiển thị cảnh báo và chặn hoàn tất buổi tập. Điểm danh `ABSENT` giữ luồng hiện tại và không yêu cầu result cho từng bài.

### Lịch sử buổi tập

`WorkoutSessionDetail` chọn renderer theo snapshot `trackingType`. Lịch sử không đọc cấu hình mới nhất từ thư viện hoặc giáo án, nên vẫn hiển thị ổn định sau khi dữ liệu nguồn thay đổi.

## Analytics Tiến độ

### KPI chung

Snapshot chung dùng các KPI áp dụng cho mọi loại:

- tỷ lệ tham gia;
- tổng số buổi;
- RPE trung bình trên các result có RPE;
- chuỗi tuần duy trì.

### KPI chuyên biệt

- Strength: tổng volume, mức tạ cao nhất, reps cao nhất, estimated 1RM.
- Bodyweight: tổng reps, reps cao nhất, mức tạ bổ sung.
- Cardio: tổng thời gian, tổng quãng đường, pace tốt nhất, nhịp tim trung bình.
- Interval: tổng số vòng, tổng thời gian vận động, tỷ lệ work/rest.
- Mobility: tổng thời gian, số lần hoàn thành, thay đổi mức khó chịu khi có đủ dữ liệu.

Chi tiết Tiến độ có section “Hiệu suất theo loại” và chỉ render nhóm đã có dữ liệu. Thành tích phải mang tracking type để renderer chọn đơn vị và copy phù hợp.

## Validation

### Library và plan

- `defaultTrackingType` và `trackingType` chỉ nhận enum hợp lệ.
- Bản ghi Exercise mới không được dùng `UNCLASSIFIED`.
- Plan có bất kỳ bài `UNCLASSIFIED` không được save/publish/gán.
- Prescription phải đúng schema của tracking type; field thừa bị từ chối thay vì âm thầm bỏ qua.

### Session

- Result phải đúng schema của tracking type đã snapshot trong WorkoutPlan.
- Client không được tự đổi tracking type khi ghi nhận.
- Backend lấy tracking type và prescription từ assigned plan theo `sessionIndex` và exercise identity.
- Không tin `prescribedSnapshot` do client gửi.
- Result Strength/Bodyweight cho phép số set thực tế khác prescription nhưng phải có ít nhất một set khi điểm danh PRESENT hoặc LATE.
- Cardio/Interval/Mobility kiểm tra giá trị không âm và giới hạn RPE từ 0 đến 10.

## Migration và tương thích ngược

### Exercise và plan chưa ghi nhận

- Exercise cũ được migrate thành `defaultTrackingType: 'UNCLASSIFIED'`.
- Bài trong WorkoutTemplate và WorkoutPlan cũ chưa có tracking type được đánh dấu `UNCLASSIFIED`.
- Không suy luận từ tên, nhóm cơ hoặc equipment.
- PT phải phân loại trước lần save/publish/gán/ghi nhận tiếp theo.

### WorkoutSession lịch sử

- Session log cũ không có tracking type được đọc như `LEGACY_STRENGTH` ở compatibility layer.
- Không rewrite hoặc xóa `exerciseLogs.sets` lịch sử.
- Analytics cũ về volume, max weight, max reps và estimated 1RM giữ nguyên kết quả.
- API response chuẩn hóa legacy log thành view model Strength để frontend không cần hai renderer riêng.

Migration phải idempotent, có dry-run/count report và kiểm thử trên dữ liệu hỗn hợp trước/sau migration.

## Ranh giới component và service

### Frontend types và pure services

- Tracking type, prescription và result union nằm trong `frontend/src/types/`.
- Pure service ánh xạ tracking type sang label, allowed metrics, default prescription và display formatting.
- Component editor/renderer chỉ nhận typed props; không tự suy diễn loại bài từ tên.

### Frontend components

- Exercise form/card bổ sung field và badge tracking type.
- Workout Studio dùng prescription editor theo loại.
- `WorkoutSessionLogger` điều phối các result editor nhỏ.
- `WorkoutSessionDetail` điều phối các result renderer nhỏ.
- Progress analytics UI render KPI chuyên biệt từ DTO backend.

Toàn bộ UI mới dùng Tailwind CSS v4 và token hiện có trong `index.css`; không thêm inline style, CSS module hoặc global selector theo feature.

### Backend

- Models và Joi validators dùng cùng enum/schema metric.
- Workout plan assignment snapshot tracking configuration.
- Workout session service resolve assigned plan và tạo trusted snapshot.
- Analytics service tách phần chung và analyzer theo tracking type.
- Compatibility adapter chuẩn hóa session legacy.

## Data flow

```text
Exercise.defaultTrackingType
  -> thêm vào WorkoutTemplate exercise.trackingType
  -> PT override + nhập prescription
  -> gán cho khách thành WorkoutPlan snapshot
  -> WorkoutSessionLogger render editor đúng loại
  -> backend resolve WorkoutPlan và lưu prescribedSnapshot + result
  -> analytics dispatch theo trackingType
  -> Progress detail render KPI/result đúng đơn vị
```

## Error handling

- Bài chưa phân loại: cảnh báo inline tại library/plan/logger và API validation error có tên bài.
- Prescription/result sai schema: giữ dữ liệu form, focus field lỗi và toast message từ API.
- Assigned plan thay đổi trong lúc modal đang mở: backend từ chối snapshot cũ bằng plan/version mismatch; frontend đóng hoặc reload journey trước khi ghi lại.
- Migration lỗi: transaction/batch checkpoint bảo đảm chạy lại an toàn, không để bản ghi nửa migrated.

## Kiểm thử

### Backend

- Model và validator cho từng tracking type.
- Exercise mới bắt buộc chọn loại; legacy Exercise được phép UNCLASSIFIED sau migration.
- Assign plan snapshot tracking type và prescription.
- Session service không tin tracking type/prescription từ client.
- Result sai loại bị từ chối.
- Analytics từng loại và analytics hỗn hợp.
- Legacy session giữ nguyên analytics Strength.
- Migration idempotent và không mất dữ liệu.

### Frontend

- Exercise form/card/filter theo tracking type.
- Workout Studio copy default, override và đổi prescription editor.
- Không save/gán plan còn UNCLASSIFIED.
- Logger render đúng field cho Strength, Bodyweight, Cardio, Interval và Mobility.
- Strength set có nhãn và hỗ trợ thêm/xóa.
- ABSENT không yêu cầu result.
- Session detail và Progress detail hiển thị đúng metric/đơn vị.
- Accessibility: label, error association, keyboard, focus-visible và touch target.
- Responsive mobile, Tailwind contract, typecheck, lint và production build.

## Thứ tự rollout

1. Thêm enum/types, model fields và compatibility adapter nhưng chưa bật chặn.
2. Chạy migration đưa Exercise/plan cũ về UNCLASSIFIED và xuất count report.
3. Cập nhật library và Workout Studio để PT phân loại dữ liệu.
4. Bật validation chặn save/publish/gán/ghi nhận UNCLASSIFIED.
5. Bật logger/detail động và session trusted snapshot.
6. Bật analytics chuyên biệt và UI Hiệu suất theo loại.
7. Theo dõi số bản ghi UNCLASSIFIED còn lại và lỗi validation sau rollout.

## Tiêu chí chấp nhận

- Chạy bộ không hiển thị Mức tạ, Reps hoặc RIR.
- Strength vẫn ghi được từng set, có nhãn Set và hỗ trợ thêm/xóa set.
- Loại mặc định xuất phát từ thư viện nhưng override giáo án không sửa bài gốc.
- Không thể ghi nhận bài chưa phân loại.
- Backend lưu snapshot từ assigned WorkoutPlan, không tin cấu hình do client gửi.
- Lịch sử và analytics Strength cũ không đổi kết quả.
- Analytics mới hỗ trợ dữ liệu hỗn hợp và hiển thị đúng đơn vị.
- Migration chạy lại không tạo thay đổi hoặc mất dữ liệu.
- Focused tests, full test suite, typecheck, lint và production build đều pass.
