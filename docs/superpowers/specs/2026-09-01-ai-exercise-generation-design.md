# Thiết kế tạo bài tập bằng AI

## Mục tiêu

Bổ sung chức năng tạo bài tập bằng AI ngay trong Thư viện bài tập cho ADMIN và PT. Người dùng có thể tạo một bài hoặc tối đa 10 bài trong một lần, xem và chỉnh sửa toàn bộ bản nháp trước khi quyết định lưu vào thư viện.

Tính năng không thay đổi luồng tạo bài tập thủ công hiện có và không tự sinh liên kết video.

## Phạm vi

### Bao gồm

- Nút `Tạo bằng AI` trên trang Thư viện bài tập.
- Wizard tạo một bài hoặc nhiều bài.
- Form yêu cầu có cấu trúc gồm:
  - chế độ tạo một bài hoặc nhiều bài;
  - nhóm cơ;
  - cấp độ;
  - thiết bị;
  - cách ghi nhận;
  - số lượng, chỉ hiển thị ở chế độ nhiều bài và giới hạn từ 2 đến 10;
  - yêu cầu bổ sung dạng văn bản.
- AI trả về danh sách bản nháp có cấu trúc.
- Người dùng có thể sửa, chọn hoặc bỏ chọn từng bản nháp trước khi lưu.
- Lưu nhiều bài trong một yêu cầu, kiểm tra hợp lệ và kiểm tra trùng tên.
- Tác vụ AI sử dụng billing task `TEXT_WORKOUT` hiện có.
- Phản hồi lỗi, loading state, chống gửi lặp và kiểm thử frontend/backend.

### Không bao gồm

- Tự tạo hoặc tìm video hướng dẫn.
- Tự động lưu kết quả AI khi chưa có xác nhận của người dùng.
- Tạo quá 10 bài trong một lần.
- Sinh ảnh minh họa.
- Thay đổi cơ chế phân quyền hoặc phạm vi dùng chung đang được chỉnh sửa trong working tree.
- Thêm loại billing task mới.

## Trải nghiệm người dùng

Trang Thư viện bài tập hiển thị `Tạo bằng AI` cạnh nút `Tạo bài tập`. Nút mở wizard ba bước:

1. **Cấu hình**: người dùng chọn chế độ, nhập các trường có cấu trúc và yêu cầu thêm.
2. **Đang tạo**: wizard khóa thao tác gửi lặp, hiển thị trạng thái AI đang xử lý và chuyển sang bước duyệt khi có kết quả hợp lệ.
3. **Duyệt và lưu**: mỗi bài là một bản nháp có checkbox. Người dùng có thể mở/chỉnh các trường, chọn tất cả hoặc bỏ chọn từng bài. Nút lưu hiển thị số bài đã chọn và bị vô hiệu hóa nếu không có bài nào hợp lệ được chọn.

Ở chế độ một bài, số lượng luôn là 1 và giao diện duyệt vẫn dùng cùng cấu trúc để tránh hai luồng xử lý khác nhau. Khi lưu thành công, wizard đóng và danh sách bài tập tải lại trang hiện tại.

Nếu người dùng đóng wizard sau khi đã có nội dung hoặc bản nháp, giao diện dùng cơ chế cảnh báo thay đổi chưa lưu nhất quán với modal hiện có.

## Dữ liệu bản nháp

Mỗi bản nháp gồm:

- `name`;
- `muscleGroup`;
- `level`: `BEGINNER`, `INTERMEDIATE` hoặc `ADVANCED`;
- `defaultTrackingType`: `STRENGTH`, `BODYWEIGHT`, `CARDIO`, `INTERVAL` hoặc `MOBILITY`;
- `equipment`: mảng chuỗi;
- `description`;
- `technique`;
- `commonMistakes`: mảng chuỗi;
- `contraindications`: mảng chuỗi;
- `variants`: mảng chuỗi.

`videos`, `videoUrl`, `scope`, `ownerPtId` và các trường hệ thống không được AI sinh hoặc nhận từ phản hồi AI.

## Kiến trúc backend

### API tạo bản nháp

Thêm endpoint có xác thực và feature flag giống Thư viện bài tập:

`POST /api/ai/exercise-generations`

Request gồm `mode`, `muscleGroup`, `level`, `defaultTrackingType`, `equipment`, `quantity` và `additionalRequest`. Validator chuẩn hóa số lượng: chế độ đơn chỉ nhận 1; chế độ nhiều nhận từ 2 đến 10.

Service mới trong miền bài tập xây dựng prompt tiếng Việt, yêu cầu AI chỉ trả JSON và gọi provider qua billing context `TEXT_WORKOUT`. Prompt yêu cầu:

- đúng số lượng đã chọn;
- không lặp tên trong cùng kết quả;
- nội dung an toàn, rõ kỹ thuật và phù hợp các trường cấu hình;
- chỉ dùng enum tracking type hợp lệ;
- không trả video, ID, owner hoặc scope.

Service trích xuất JSON, loại trường dư, chuẩn hóa chuỗi/mảng, kiểm tra schema và trả lỗi external-service nếu AI không cung cấp ít nhất một bản nháp hợp lệ. Backend không ghi Exercise ở bước này.

### API lưu hàng loạt

Thêm endpoint:

`POST /api/exercises/bulk`

Request chứa từ 1 đến 10 bài theo cùng schema tạo bài hiện có nhưng cấm trường hệ thống và video do AI tạo. Endpoint thực hiện:

- validation toàn bộ danh sách trước khi ghi;
- chuẩn hóa tên để so sánh không phân biệt hoa thường và khoảng trắng thừa;
- phát hiện tên trùng trong request;
- phát hiện tên đã tồn tại trong thư viện;
- ghi toàn bộ trong transaction để tránh trạng thái lưu một phần;
- áp dụng cùng scope/owner policy với hàm tạo bài hiện tại;
- ghi audit cho từng bài được tạo.

Nếu có tên trùng, toàn bộ request bị từ chối với lỗi validation và danh sách tên bị trùng để người dùng sửa hoặc bỏ chọn rồi gửi lại.

Logic chuẩn hóa response và chính sách tạo Exercise phải được dùng chung giữa create đơn và bulk create, không nhân đôi quy tắc quyền sở hữu.

## Kiến trúc frontend

Tạo component wizard độc lập trong nhóm `components/exercises`. Trang `ExerciseLibraryPage` chỉ quản lý trạng thái mở/đóng, xử lý callback lưu thành công và reload danh sách.

Wizard tách các trách nhiệm:

- state cấu hình yêu cầu AI;
- gọi API sinh bản nháp;
- state danh sách bản nháp và lựa chọn;
- editor cho từng bản nháp;
- gọi API bulk save;
- hiển thị lỗi và trạng thái tải.

Các select cấp độ và cách ghi nhận dùng cùng enum/nhãn đang có trong form thủ công. Editor bản nháp hỗ trợ đầy đủ các trường AI trả về; dữ liệu mảng được chỉnh bằng ô văn bản phân tách theo dòng để tránh UI lồng phức tạp.

## Luồng dữ liệu

1. Người dùng mở wizard và nhập cấu hình.
2. Frontend validate yêu cầu cơ bản rồi gọi API generation với một request duy nhất.
3. Backend validate, gọi AI có tính credit, chuẩn hóa kết quả và trả bản nháp; chưa ghi thư viện.
4. Frontend cho phép chỉnh sửa và lựa chọn bản nháp.
5. Frontend validate các bài được chọn rồi gửi API bulk.
6. Backend validate toàn bộ, kiểm tra trùng, ghi transaction và audit.
7. Frontend thông báo số bài đã lưu, đóng wizard và tải lại danh sách.

## Xử lý lỗi

- Thiếu trường bắt buộc hoặc số lượng ngoài giới hạn: hiển thị lỗi validation, không gọi AI.
- Không đủ credit, AI bị tắt hoặc provider chưa cấu hình: giữ nguyên cấu hình trong wizard và hiển thị thông báo từ API.
- AI trả JSON sai hoặc không có bản nháp hợp lệ: không chuyển sang bước lưu; người dùng có thể thử lại.
- Một số item AI không hợp lệ: backend bỏ item không hợp lệ; nếu còn item hợp lệ thì trả chúng kèm cảnh báo số item bị loại. Nếu không còn item nào thì trả lỗi.
- Tên trùng khi lưu: không lưu bài nào; đánh dấu lỗi để người dùng sửa hoặc bỏ chọn.
- Lỗi transaction hoặc mạng khi lưu: giữ nguyên bản nháp và lựa chọn để thử lại.
- Nút tạo và lưu bị khóa trong lúc request đang chạy để hạn chế gửi lặp.

## An toàn và phân quyền

- Endpoint generation và bulk create yêu cầu `ADMIN` hoặc `PT` và feature `EXERCISE_LIBRARY`, nhất quán với route bài tập hiện có.
- Dữ liệu AI luôn là bản nháp và phải được con người xác nhận.
- Prompt yêu cầu cảnh báo chống chỉ định nhưng không đưa ra chẩn đoán y khoa.
- Backend loại bỏ mọi trường hệ thống hoặc URL ngoài schema cho phép.
- Request key hiện có được dùng để đảm bảo billing AI có tính idempotent.

## Kiểm thử

### Backend

- Validator chấp nhận chế độ đơn và batch hợp lệ.
- Validator từ chối batch dưới 2, trên 10 và enum không hợp lệ.
- Generation gọi billing với `TEXT_WORKOUT`, không ghi Exercise.
- Parser chuẩn hóa JSON hợp lệ, loại trường dư và xử lý output sai.
- Bulk create lưu đủ bài, áp dụng owner/scope policy và ghi audit.
- Bulk create từ chối tên trùng trong request hoặc trong database mà không lưu một phần.
- Route từ chối người dùng không đúng vai trò hoặc feature bị tắt.

### Frontend

- Nút mở wizard từ Thư viện bài tập.
- Chế độ đơn ẩn số lượng và gửi quantity bằng 1.
- Chế độ nhiều giới hạn số lượng từ 2 đến 10.
- Kết quả generation hiển thị đúng và có thể chỉnh sửa/chọn bỏ.
- Không thể lưu khi không chọn bài hoặc bài được chọn không hợp lệ.
- Lưu thành công đóng wizard và reload thư viện.
- Lỗi generation hoặc bulk save giữ nguyên dữ liệu để thử lại.
- Form tạo thủ công tiếp tục hoạt động.

## Tiêu chí hoàn thành

- ADMIN và PT có thể tạo một hoặc tối đa 10 bài từ form AI có cấu trúc.
- Không bài nào được lưu trước bước duyệt và xác nhận.
- Người dùng sửa và lựa chọn được từng bản nháp.
- Lưu hàng loạt là atomic, có validation, chống trùng tên và audit.
- AI generation được tính credit bằng `TEXT_WORKOUT`.
- Video không được tự sinh.
- Các test liên quan pass và thay đổi hiện có của người dùng trong working tree được giữ nguyên.
