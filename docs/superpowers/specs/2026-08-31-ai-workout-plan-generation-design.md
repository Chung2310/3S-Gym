# Thiết kế tạo giáo án và bài tập bằng AI

Ngày: 2026-08-31

## 1. Mục tiêu

Cho phép PT tạo một giáo án cá nhân hóa theo chu kỳ 4–12 tuần từ dữ liệu của học viên. AI phải đề xuất chu kỳ, tần suất và thời lượng trước; PT được chỉnh các thông số này trước khi AI tạo chi tiết. AI ưu tiên bài tập đang có trong thư viện và chuẩn bị bài tập riêng mới nếu thư viện không đáp ứng. Kết quả được mở trực tiếp trong Workout Studio để PT kiểm tra, chỉnh sửa và lưu.

Tính năng không tự gán hoặc xuất bản giáo án cho học viên. Mọi nội dung AI đều cần PT kiểm tra trước khi lưu.

## 2. Phạm vi

### Trong phạm vi

- Wizard ba bước từ trang Giáo án của tôi.
- Chọn một học viên do PT hiện tại quản lý.
- Tổng hợp mục tiêu, InBody mới nhất, tiền sử sức khỏe, lịch sử tập và giáo án hiện có.
- AI đề xuất chu kỳ 4–12 tuần, số buổi mỗi tuần, số phút mỗi buổi, cấp độ, phương pháp, lịch chia nhóm cơ và giới hạn sức khỏe.
- PT chỉnh đề xuất và nhập yêu cầu bổ sung.
- AI tạo giáo án đầy đủ theo tuần và buổi.
- Tái sử dụng bài tập có sẵn; chuẩn bị bài tập riêng mới với đầy đủ dữ liệu khi cần.
- Nạp bản nháp vào Workout Studio có điều hướng theo tuần và buổi.
- Lưu giáo án và bài tập mới trong cùng transaction khi PT bấm lưu.
- Xử lý lỗi, cảnh báo dữ liệu thiếu và kiểm thử liên quan.

### Ngoài phạm vi

- Tự động gán hoặc xuất bản giáo án cho học viên.
- AI hội thoại trong Workout Studio.
- Tạo video hướng dẫn hoặc tự sinh URL video.
- Cho AI tự quyết định và lưu dữ liệu mà không có bước PT kiểm tra.
- Tạo giáo án mẫu không gắn với học viên.

## 3. Quyết định sản phẩm

- Dùng luồng AI hai giai đoạn thay vì một lần gọi AI.
- PT chọn học viên cụ thể; không có chế độ nhập thủ công hoàn toàn trong phiên bản này.
- AI đề xuất thời gian và tần suất; PT có thể sửa trước bước tạo chi tiết.
- Giáo án là một chu kỳ hoàn chỉnh từ 4 đến 12 tuần, có phân kỳ và tăng tải.
- AI chỉ tạo bài tập mới khi không tìm thấy bài phù hợp trong thư viện.
- Bài tập AI mới thuộc phạm vi riêng của PT.
- Bài tập mới chưa được ghi ngay khi AI trả kết quả. Chúng chỉ được lưu cùng giáo án khi PT bấm lưu trong Studio.
- Bài tập mới chứa: tên, nhóm cơ, cấp độ, thiết bị, mô tả, kỹ thuật, lỗi thường gặp, chống chỉ định, biến thể và thông số tập mặc định.

## 4. Luồng người dùng

### Bước 1 — Chọn học viên

Trang Giáo án của tôi có nút `Tạo bằng AI`. Nút mở `AiWorkoutWizard` ở bước chọn học viên.

PT chỉ thấy học viên mình được phân công quản lý. Sau khi chọn, hệ thống tải và hiển thị tóm tắt:

- Mục tiêu gần nhất.
- Bản InBody mới nhất.
- Tiền sử sức khỏe và chấn thương.
- Lịch sử buổi tập gần đây.
- Giáo án đang hoặc đã sử dụng.

Thiếu InBody hoặc lịch sử tập chỉ tạo cảnh báo và không chặn. Thiếu mục tiêu hoặc tiền sử sức khỏe chưa được xác nhận phải được PT bổ sung hoặc xác nhận trước khi phân tích.

### Bước 2 — Duyệt đề xuất AI

PT bấm `Phân tích bằng AI`. AI trả:

- Số tuần từ 4 đến 12.
- Số buổi mỗi tuần.
- Số phút mỗi buổi.
- Cấp độ và phương pháp tập.
- Cách chia lịch và nhóm cơ ưu tiên.
- Giới hạn, chống chỉ định và cảnh báo.

PT được sửa số tuần, số buổi, số phút và yêu cầu bổ sung. Dữ liệu đã nhập được giữ nguyên khi gọi AI lỗi hoặc khi PT quay lại bước trước.

### Bước 3 — Tạo giáo án

PT bấm `Tạo giáo án`. AI tạo chu kỳ đầy đủ theo từng tuần và từng buổi. Mỗi bài tập phải có thông số dự kiến và tham chiếu bài trong thư viện nếu tìm được.

Frontend chuyển kết quả thành trạng thái Workout Studio và điều hướng đến Studio. Studio hiển thị một bộ chọn tuần và các buổi của tuần đang chọn, tránh dồn 28–84 buổi vào một dải ngày duy nhất. Giáo án cùng bài tập mới vẫn là bản nháp ở phía client cho đến khi PT bấm `Lưu giáo án`.

## 5. Kiến trúc backend

### 5.1 API đề xuất

`POST /api/ai/workout-proposals`

Yêu cầu:

```json
{
  "customerId": "object-id"
}
```

Phản hồi chứa đề xuất, cảnh báo dữ liệu và bản tóm tắt nguồn dữ liệu đã dùng. API không ghi database.

### 5.2 API tạo chi tiết

`POST /api/ai/workout-generations`

Yêu cầu:

```json
{
  "customerId": "object-id",
  "proposal": {
    "durationWeeks": 8,
    "sessionsPerWeek": 4,
    "minutesPerSession": 60,
    "level": "INTERMEDIATE",
    "trainingMethod": "Progressive overload",
    "trainingSplit": "Upper/Lower",
    "priorityMuscleGroups": ["BACK", "LEGS"],
    "restrictions": ["Hạn chế gập gối sâu"]
  },
  "additionalRequest": "Ưu tiên máy tập trong phòng gym"
}
```

Phản hồi chứa giáo án có cấu trúc và danh sách bài tập mới chưa lưu. API không ghi database.

### 5.3 API lưu Studio

API `POST /api/workout-templates` hiện tại nhận thêm cấu trúc chu kỳ nhiều tuần và `generatedExercises`. Kết quả được lưu thành giáo án mẫu riêng trong `Giáo án của tôi`, không tạo `WorkoutPlan` và không tự gán cho học viên đã dùng làm ngữ cảnh. Khi PT lưu, backend chạy một transaction:

1. Xác thực PT và quyền quản lý học viên.
2. Kiểm tra payload giáo án và bài tập mới.
3. Tìm bài tập trùng theo tên đã chuẩn hóa trong thư viện global và thư viện riêng của PT.
4. Tái sử dụng bài phù hợp thay vì tạo bản sao.
5. Tạo các bài tập riêng còn thiếu.
6. Thay tham chiếu tạm bằng `exerciseId` thật.
7. Lưu giáo án.
8. Commit transaction; nếu bất kỳ bước nào lỗi thì rollback toàn bộ.

### 5.4 Các đơn vị dịch vụ

- `aiWorkoutContextService`: lấy dữ liệu nguồn, kiểm tra quyền và chuẩn hóa ngữ cảnh học viên.
- `aiWorkoutProposalService`: xây prompt và tạo đề xuất ngắn.
- `aiWorkoutGenerationService`: xây prompt và tạo chu kỳ đầy đủ.
- `aiWorkoutSchema`: kiểm tra nghiêm ngặt dữ liệu do AI trả về.
- `aiWorkoutMapper`: chuyển kết quả AI sang cấu trúc Workout Studio.
- Workout template service: chịu trách nhiệm transaction lưu bài tập và giáo án.

OpenRouter hiện có tiếp tục được sử dụng qua backend. Khóa API không được gửi xuống frontend hoặc ghi log.

## 6. Quy tắc dữ liệu AI

- Không tin trực tiếp JSON từ mô hình; mọi phản hồi phải được parse và validate.
- Giáo án phải có đủ số tuần và số buổi theo cấu hình PT đã duyệt.
- Thứ tự tuần phải liên tục và nằm trong khoảng 4–12.
- Tần suất và thời lượng phải nằm trong giới hạn validator của hệ thống.
- Không cho phép lịch tập trùng thời gian trong cùng ngày.
- Bài tập xung đột với chống chỉ định phải bị loại và trả thành cảnh báo.
- Bài tập mới phải có toàn bộ trường bắt buộc đã nêu trong phạm vi.
- Không tạo hoặc bịa URL video.
- Bài tập AI mới luôn có `scope: PRIVATE` và `ownerPtId` là PT hiện tại.
- Nội dung AI mang nhãn `AI tạo · PT cần kiểm tra` trong wizard và Studio.

## 7. Kiến trúc frontend

- `AiWorkoutWizard`: quản lý bước hiện tại và UI wizard.
- Page chứa wizard: quản lý gọi API, loading, lỗi và điều hướng.
- Kiểu dữ liệu AI workout nằm trong `frontend/src/types/`.
- API và mapper thuần nằm trong `frontend/src/services/`.
- `WorkoutStudioPage` nhận bản nháp tạo từ AI qua cơ chế state tạm có khả năng tồn tại qua điều hướng trong cùng phiên.
- Studio bổ sung bộ chọn tuần; bộ chọn ngày/buổi hiện tại chỉ hiển thị các buổi thuộc tuần đang chọn.
- Dữ liệu lịch bổ sung `weekNumber` và giữ `dayNumber` trong phạm vi tuần. Các giáo án cũ không có `weekNumber` được đọc như tuần 1 để bảo toàn tương thích.
- Nếu tải lại trang khi bản nháp chưa lưu, hệ thống thông báo bản nháp không còn thay vì tạo dữ liệu không hoàn chỉnh.
- Cảnh báo rời Studio khi có thay đổi chưa lưu tiếp tục dùng cơ chế hiện có.

## 8. Giao diện legacy CSS

Các component mới của chức năng AI dùng CSS legacy trong `frontend/src/index.css`, không dùng Tailwind, CSS module hoặc inline style.

Class được tái sử dụng:

- Wizard: `modal-backdrop`, `modal-content`, `modal-header`, `modal-actions`.
- Khối nội dung: `panel`.
- Form: `form-grid`, `form-group`, `form-heading`, `form-actions`.
- Nút: `button`, `button-primary`, `button-secondary`.
- Nhãn bước và nhãn AI: `badge-tag`.
- Trạng thái thiếu dữ liệu: `empty-state`.
- Studio: `workout-studio`, `studio-header`, `studio-days`, `studio-grid`, `studio-palette`, `studio-timeline-wrap`, `studio-inspector`.

Chỉ bổ sung selector trong `index.css` khi class hiện tại không thể biểu đạt bước đang hoạt động, cảnh báo AI hoặc trạng thái tải. Selector mới phải dùng lại các biến màu hiện có. Khung wizard và panel giữ padding tối thiểu 20px. Giao diện phải không tràn ngang ở desktop và mobile.

## 9. Trạng thái và lỗi

- Khóa nút gửi trong lúc request đang chạy để tránh gọi lặp.
- Timeout, rate limit và lỗi provider được chuẩn hóa thành thông báo có thể thử lại.
- Lỗi AI không làm mất dữ liệu wizard.
- JSON sai cấu trúc bị từ chối và không được đưa vào Studio.
- Dữ liệu thiếu được phân biệt giữa cảnh báo không chặn và lỗi cần PT bổ sung.
- Lỗi lưu transaction không để lại bài tập hoặc giáo án dở dang.
- Không lộ prompt nội bộ, khóa API hoặc phản hồi provider thô cho người dùng.

## 10. Kiểm thử

### Backend

- PT chỉ phân tích và tạo giáo án cho học viên mình quản lý.
- Ngữ cảnh học viên được tổng hợp đúng.
- Mock provider cho bước đề xuất và tạo chi tiết.
- Validator từ chối dữ liệu thiếu, sai kiểu hoặc lịch không hợp lệ.
- Tái sử dụng bài tập phù hợp và không tạo trùng.
- Loại bài tập xung đột với chống chỉ định.
- Transaction rollback khi tạo bài tập hoặc giáo án lỗi.
- Timeout và lỗi provider được chuẩn hóa.

### Frontend

- Wizard chuyển đúng ba bước.
- PT chỉnh được số tuần, số buổi và số phút.
- Không gửi request lặp trong trạng thái loading.
- Lỗi không làm mất cấu hình.
- Kết quả AI được chuyển đầy đủ vào Workout Studio.
- Bài tập AI hiển thị đủ thông tin.
- Cảnh báo rời Studio khi chưa lưu vẫn hoạt động.
- Class legacy được sử dụng và panel có khoảng đệm theo thiết kế.
- Không tràn ngang trên desktop và mobile.

## 11. Tiêu chí hoàn thành

- PT chọn được một học viên thuộc quyền quản lý.
- AI đề xuất chu kỳ, tần suất và thời lượng trước khi tạo chi tiết.
- PT chỉnh đề xuất được.
- AI tạo được giáo án liên tục 4–12 tuần.
- AI tái sử dụng bài tập có sẵn và chuẩn bị bài mới khi cần.
- Kết quả mở trực tiếp trong Workout Studio.
- Chỉ khi PT lưu, giáo án mẫu riêng của PT và bài tập mới mới được ghi đồng bộ.
- Học viên dùng làm ngữ cảnh không tự nhận giáo án; PT vẫn dùng luồng `Gán học viên` hiện có sau khi duyệt.
- Giáo án không tự gán hoặc xuất bản.
- Test liên quan, typecheck frontend/backend và production build đều đạt.
