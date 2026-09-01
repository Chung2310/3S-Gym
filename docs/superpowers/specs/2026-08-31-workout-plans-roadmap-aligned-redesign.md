# Thiết kế làm mới giao diện Giáo án theo ngôn ngữ Roadmap

## Mục tiêu

Làm mới toàn bộ khu vực Giáo án dành cho PT gồm danh sách giáo án, thư viện bài tập và Workout Studio. Giao diện mới sử dụng cùng ngôn ngữ phân cấp, khoảng cách, màu sắc và cách trình bày trạng thái như màn Roadmap, đồng thời giữ nguyên chức năng và API hiện có.

## Phạm vi

### Trong phạm vi

- Trang `/pt/my-workout-plans` và hai tab Giáo án, Thư viện bài tập.
- Trang tạo/sửa giáo án tại `/pt/my-workout-plans/new` và `/pt/my-workout-plans/:templateId/edit`.
- Chế độ sửa giáo án khách hàng trong Workout Studio.
- Trạng thái loading, rỗng, lỗi, lọc và phân trang của các danh sách liên quan.
- Responsive desktop, tablet và mobile.
- Cập nhật test giao diện và selector accessibility liên quan.

### Ngoài phạm vi

- Thay đổi API hoặc cấu trúc dữ liệu backend.
- Thay đổi quy tắc quyền sở hữu bài tập hoặc quyền thao tác giáo án.
- Thêm tính năng nghiệp vụ mới không tồn tại trong luồng hiện tại.
- Thiết kế lại các khu vực ngoài Giáo án.

## Hướng thiết kế

Áp dụng phương án “Đồng bộ Roadmap”: danh sách là điểm vào chính; mỗi giáo án được thể hiện bằng card có phân cấp rõ ràng, trạng thái dễ nhận biết và hành động nhất quán. Workout Studio vẫn là workspace chuyên sâu, chỉ mở khi PT tạo hoặc chỉnh sửa.

### Nguyên tắc thị giác

- Card cấp ngoài có bo góc mềm; nội dung bên trong ưu tiên khoảng trắng và đường phân cách thay vì nhiều card lồng nhau.
- Dùng design tokens hiện có: xanh đậm thương hiệu cho tiêu đề và hành động chính, xanh sáng cho tương tác và focus.
- Tiêu đề dùng Oswald, nội dung dùng Montserrat theo design system dự án.
- Nút chính nổi bật; hành động phụ dùng text/secondary button gọn hơn.
- Trạng thái dùng badge nhất quán, không dùng màu trang trí không mang ý nghĩa.
- Mọi phần tử tương tác có hover, active, disabled và focus-visible.
- Chỉ dùng Tailwind CSS v4 cho phần giao diện được sửa; không thêm thư viện styling hoặc inline style mới.

## Cấu trúc màn hình

### 1. Danh sách Giáo án

- Header gồm tiêu đề, mô tả ngắn và nút “Tạo giáo án”.
- Thanh tab giữ hai mục Giáo án và Thư viện bài tập, đồng bộ trạng thái qua query string như hiện tại.
- Thanh công cụ gồm tìm kiếm theo tên/mục tiêu, lọc trạng thái và thao tác xóa bộ lọc.
- Danh sách đổi từ bảng sang grid card responsive.
- Mỗi card hiển thị: tên, trạng thái, phiên bản, mục tiêu, cấp độ, số ngày/buổi và tổng số bài tập khi dữ liệu sẵn có.
- Các hành động hiện có được giữ nguyên: chỉnh sửa, lưu trữ và xóa khi hợp lệ.
- Lối đi sang gán cho học viên chỉ xuất hiện khi callback/luồng hiện tại hỗ trợ; không tạo API mới.
- Loading dùng skeleton card; empty state phân biệt chưa có dữ liệu và không có kết quả lọc.

### 2. Thư viện bài tập

- Header, bộ lọc và nhịp khoảng cách dùng cùng hệ thống với danh sách Giáo án.
- Bài tập hiển thị bằng card responsive, nhấn mạnh tên, nhóm cơ, cấp độ và thiết bị/thông tin hiện có.
- Giữ nguyên toàn bộ quyền thêm, xem, sửa và xóa theo quyền sở hữu hiện tại.
- Empty state hướng dẫn PT tạo bài tập đầu tiên hoặc xóa bộ lọc.

### 3. Workout Studio

- Header thông tin giáo án được gom thành một surface rõ ràng: tên, mục tiêu, cấp độ, số ngày, trạng thái chưa lưu và nút lưu.
- Day navigator có trạng thái ngày đang chọn rõ ràng và giữ khả năng đổi ngày hiện tại.
- Desktop giữ ba vùng: thư viện bài tập, timeline, thuộc tính giáo án/bài tập.
- Timeline là vùng ưu tiên thị giác, rộng hơn hai panel bên.
- Tablet/mobile hiển thị timeline trước; thư viện và thuộc tính mở thành panel theo nhu cầu để không ép ba cột hẹp.
- Giữ nguyên kéo thả, thêm nhanh, xếp lịch, resize, chỉnh thông số, bài chưa xếp lịch, gợi ý bài tập, chế độ chỉ đọc và cảnh báo rời trang khi chưa lưu.
- Không thay đổi payload lưu hoặc cách gọi API.

## Kiến trúc component

- Page tiếp tục giữ state và API calls theo cấu trúc hiện tại.
- Component feature chỉ nhận dữ liệu và callback qua props; không đưa business logic vào UI primitive.
- `WorkoutTemplateList` chịu trách nhiệm tải/lọc/phân trang và render trạng thái danh sách; card giáo án được tách thành component chuyên biệt nếu việc tách giúp test độc lập và giữ file gọn.
- `ExerciseLibraryPage` giữ logic hiện tại, còn card/filter/header được tổ chức lại thành các khối có ranh giới rõ.
- `WorkoutStudioPage` giữ state và orchestration; các component `StudioHeader`, `StudioDayNavigator`, `ExercisePalette`, `DayTimeline` và `StudioSidebar` được làm mới có mục tiêu, không viết lại nghiệp vụ.
- Chỉ tạo primitive dùng chung trong `components/ui` khi có ít nhất hai consumer thực tế.

## Luồng dữ liệu và lỗi

- API endpoints, request payload và response mapping không đổi.
- Loading hiển thị skeleton theo hình dạng nội dung thay vì spinner chung.
- Lỗi API tiếp tục dùng ToastProvider với thông điệp từ `errorMessage`.
- Xóa/lưu trữ và hành động có nguy cơ mất dữ liệu tiếp tục yêu cầu xác nhận.
- Bộ lọc không có kết quả hiển thị empty state riêng và cho phép reset ngay.
- Form và filter có label/aria-label, placeholder rõ ràng và focus ring bàn phím.

## Responsive

- Desktop: grid card 2–3 cột tùy chiều rộng; Studio ba vùng với timeline chiếm phần lớn không gian.
- Tablet: danh sách 2 cột khi đủ rộng; Studio ưu tiên timeline và thu gọn panel phụ.
- Mobile: danh sách 1 cột; action được bọc hàng hợp lý; Studio dùng panel mở theo nhu cầu, không có cuộn ngang bắt buộc cho nội dung chính.

## Kiểm thử và tiêu chí hoàn thành

- Cập nhật test cho điều hướng tab, tạo mới, chỉnh sửa, lưu trữ, xóa, lọc và phân trang.
- Sửa sáu test Workout Studio đang truy vấn selector giao diện cũ; dùng accessible role/name của nút thêm bài mới.
- Kiểm tra thêm bài, chọn ngày, sửa thuộc tính, lưu và cảnh báo dữ liệu chưa lưu.
- Kiểm tra loading, empty, API error và responsive states.
- Chạy các test frontend liên quan, TypeScript typecheck và production build.
- Smoke test trực tiếp trên trình duyệt bằng tài khoản PT demo cho danh sách, thư viện và Studio.
- Không thay đổi dữ liệu thật ngoài bản ghi kiểm thử dùng một lần; phải dọn bản ghi kiểm thử sau khi hoàn tất nếu có tạo.

## Tiêu chí nghiệm thu

- Ba màn Giáo án có cùng ngôn ngữ thị giác với Roadmap nhưng phù hợp nhiệm vụ riêng.
- Không còn cảm giác card lồng card hoặc thông tin bị bo sát gây rối mắt.
- Mọi chức năng đang có vẫn truy cập và hoạt động được.
- Không có lỗi TypeScript, build hoặc lỗi console/network trong smoke test.
- Các test liên quan vượt qua, bao gồm sáu test Workout Studio hiện đang lỗi do selector cũ.
