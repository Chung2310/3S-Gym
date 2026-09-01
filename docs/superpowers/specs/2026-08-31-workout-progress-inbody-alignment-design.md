# Thiết kế đồng bộ Giáo án và Tiến độ theo InBody

## Trạng thái

Thiết kế đã được duyệt theo ba phần: khung và phân cấp, tương tác và responsive, kiến trúc và phạm vi kỹ thuật.

## Bối cảnh

Giao diện Giáo án và Tiến độ hiện dùng nhiều quy tắc trình bày khác nhau. Giáo án kết hợp Tailwind, CSS legacy và inline style; Tiến độ phụ thuộc vào một khối CSS `progress-*` riêng. Padding, khoảng cách, bo góc, chiều cao card, cách bố trí hành động và responsive vì vậy không đồng nhất với các module còn lại.

Module InBody được chọn làm chuẩn trực tiếp. Mục tiêu là tái sử dụng ngôn ngữ thị giác, mật độ thông tin và cách tổ chức thao tác của InBody, nhưng không sao chép hệ thống inline style hiện tại của module này.

## Mục tiêu

- Đồng bộ toàn bộ luồng Giáo án và Tiến độ với InBody.
- Giảm cảm giác thông tin bị tách xa hoặc bị bo sát trong nhiều lớp card.
- Chuẩn hóa header, toolbar, metric, panel, action group, tabs, form, modal và responsive.
- Giữ nguyên chức năng, API, payload, quyền truy cập và quy tắc nghiệp vụ hiện có.
- Chuyển các phần giao diện được sửa sang Tailwind CSS v4 theo quy chuẩn frontend của dự án.
- Tạo primitive dùng chung khi có ít nhất hai consumer thực tế.

## Ngoài phạm vi

- Không thay đổi backend hoặc schema dữ liệu để phục vụ riêng cho việc làm mới giao diện.
- Không thay đổi cách tính tiến độ, InBody, thành tích, khối lượng tập hoặc báo cáo.
- Không thêm chức năng nghiệp vụ mới ngoài các luồng đang có.
- Không thiết kế lại module InBody trong đợt này.
- Không đổi route hoặc cấu trúc query string hiện tại nếu không bắt buộc để giữ hành vi cũ.

## Module tham chiếu: InBody

Hai module mới sẽ kế thừa các đặc điểm sau của InBody:

- Nhịp dọc cấp trang khoảng 18px.
- Header gọn gồm icon, tiêu đề, mô tả và một action group sát nhau.
- Panel chính dùng padding 16–20px, bán kính 12–14px và viền xanh xám nhẹ.
- Thành phần con dùng padding 10–16px và bán kính 8–12px.
- Nút có chiều cao 40–44px; khoảng cách trong nhóm nút là 8px.
- Desktop ưu tiên bảng hoặc grid đủ mật độ; mobile chuyển sang card.
- Nội dung số liệu có label nhỏ, value rõ và dùng tabular figures khi phù hợp.
- Trạng thái có màu mang ý nghĩa; không dùng màu trang trí tùy ý.

## Hệ thống trình bày chung

### Typography

- Tiêu đề module và tiêu đề card quan trọng dùng Oswald, màu `primary` và phân cấp tương đương InBody.
- Nội dung, nhãn, form và nút dùng Montserrat.
- Tiêu đề cấp trang có quy mô gần với header InBody hiện tại, không dùng cỡ quá lớn làm tăng chiều cao màn hình.
- Label số liệu dùng cỡ nhỏ và tracking vừa phải; value dùng tabular numbers.

### Spacing và bề mặt

- Thang khoảng cách chính: 8, 12, 16, 18 và 20px.
- Không dùng padding 24px cho card thông thường nếu nội dung không cần không gian đó.
- Chỉ dùng một surface chính cho một nhóm thông tin. Dữ liệu con được ngăn bằng divider hoặc nền nhẹ thay vì card lồng card.
- Bán kính giảm dần theo cấp: panel ngoài 12–14px, khối trong 10–12px, button/input 8–10px.
- Shadow nhẹ, cùng sắc xanh thương hiệu; không dùng nhiều cấp shadow cạnh tranh.

### Hành động

- Primary: tạo, lưu, hoàn tất hoặc ghi nhận.
- Secondary: tạo bằng AI, làm mới, xem chi tiết và chỉnh sửa.
- Destructive/tertiary: xóa, lưu trữ hoặc thu hồi; luôn có xác nhận khi có nguy cơ mất dữ liệu.
- Một khu vực không hiển thị quá hai nút nổi bật cạnh nhau. Thao tác phụ được đặt ở cuối card, inline action hoặc menu phù hợp.
- Mọi trạng thái hover, pressed, disabled và focus-visible dùng chung quy tắc.

## Shared UI primitives

Các primitive dự kiến được thêm hoặc chuẩn hóa trong `frontend/src/components/ui/`:

- `ModuleHeader`: icon, title, description và action group.
- `SegmentedTabs`: tab cấp module và tab nội dung chi tiết.
- `MetricStrip` và `MetricCard`: dải số liệu gọn theo tỷ lệ InBody.
- `ModuleToolbar`: tìm kiếm, lọc, làm mới và reset.
- `ActionGroup`: căn và wrap primary, secondary, tertiary action.
- `ModuleFeedback`: trạng thái rỗng hoặc lỗi có mô tả và hành động thử lại/khởi tạo.
- `Button`: primary, secondary, tertiary và danger variants dùng Tailwind thống nhất.
- Tiếp tục dùng `FormModal`, `FormField`, `DataList`, `Pagination`, `CustomerSelect`, `ConfirmModal` và `ToastProvider` hiện có.

Chỉ tạo primitive nếu có ít nhất hai consumer. Nếu một pattern chỉ xuất hiện trong một feature, nó ở lại thư mục feature tương ứng.

## Thiết kế module Giáo án

### Trang và điều hướng

- Header module dùng `ModuleHeader` và hiển thị “Tạo thủ công” cùng “Tạo bằng AI” trong một action group, gap 8px.
- Hai tab Giáo án của tôi và Thư viện bài tập tại `/pt/my-workout-plans` dùng cùng kiểu segmented tab.
- Giáo án khách hàng tiếp tục nằm trong luồng hồ sơ khách hàng hiện có; không tạo tab hoặc route cấp module mới.
- Giữ nguyên route, query string và cơ chế chuyển tab hiện có.

### Giáo án mẫu

- Bộ lọc nằm trong một `ModuleToolbar` duy nhất.
- Card giáo án vẫn được giữ vì cần trình bày mục tiêu, cấp độ, số buổi và số bài tập cùng hành động.
- Card giảm padding, khoảng cách và chiều cao; dùng divider cho nhóm chỉ số thay vì nhiều khối bo góc.
- Header card gồm loại/phiên bản, tên, mục tiêu và trạng thái.
- Footer card gom chỉnh sửa, gán khách hàng và thao tác lưu trữ/xóa; các nút không bị đẩy xa khỏi nội dung.
- Grid dùng một cột trên mobile, hai cột trên tablet và tối đa ba cột khi đủ rộng.

### Giáo án khách hàng

- Desktop dùng bảng mật độ tương đương InBody với tên, điện thoại, tiêu đề, thời gian, trạng thái và thao tác.
- Mobile chuyển từng bản ghi thành card, không ép cuộn bảng ngang.
- Giữ nguyên lọc theo khách hàng, trạng thái, phân trang, công bố, thu hồi, chỉnh sửa và xóa.

### Thư viện bài tập

- Dùng cùng header, toolbar, filter controls, card density và empty state với phần Giáo án mẫu.
- Giữ nguyên quyền tạo, sửa và xóa theo ownership hiện có.
- Nội dung card ưu tiên tên bài tập, nhóm cơ, cấp độ, thiết bị và mô tả; action nằm sát cuối nội dung.

### Tạo và sửa thủ công

- `WorkoutBuilder` dùng cấu trúc form giống InBody: header, mô tả, nhóm thông tin chung, nhóm buổi tập và footer action.
- Mỗi buổi tập là một section có divider và khoảng cách rõ, không tạo nhiều lớp panel.
- Thư viện chọn bài tập có tìm kiếm/lọc và trạng thái đã chọn rõ ràng.

### AI Wizard

- Trình bày ba trạng thái rõ: chọn học viên, duyệt đề xuất thời gian/tần suất, tạo giáo án và chuyển sang Studio.
- PT tiếp tục sửa được số tuần, số buổi mỗi tuần và số phút mỗi buổi trước khi tạo.
- Dùng cùng modal shell, form grid, loading, inline error và footer action với các form khác.
- Không thay đổi API phân tích hoặc payload tạo giáo án.

### Workout Studio

- Header hiển thị tên, mục tiêu, cấp độ, trạng thái chưa lưu và hành động quay lại/lưu.
- Tuần và ngày dùng segmented controls có active state rõ.
- Desktop giữ ba vùng: thư viện bài tập, timeline và inspector; timeline là vùng ưu tiên.
- Các panel dùng cùng surface, padding, radius và header hierarchy với InBody.
- Tablet/mobile ưu tiên timeline; thư viện và inspector mở theo panel/drawer thay vì ép ba cột.
- Giữ nguyên kéo thả, thêm nhanh, resize, overlap validation, bài chưa xếp lịch, gợi ý bài tập, chỉnh thông số và cảnh báo rời trang.

## Thiết kế module Tiến độ

### Tổng quan

- Header dùng `ModuleHeader` với tiêu đề và mô tả gọn.
- Dải metric dùng `MetricStrip`; bỏ chiều cao tối thiểu 116px và các card tách rời quá lớn.
- Mỗi metric có label, value và icon trong cùng một surface, phân tách bằng divider responsive.

### Danh sách khách hàng

- Tìm kiếm và các bộ lọc nằm trong `ModuleToolbar`.
- Desktop dùng bảng theo mẫu InBody; mobile dùng customer card.
- Các cột chính: học viên, số buổi, tỷ lệ tham gia, cân nặng/thay đổi, buổi gần nhất, trạng thái và hành động.
- Hai thao tác “Xem chi tiết” và “Ghi buổi tập” nằm trong một action group gọn.

### Chi tiết khách hàng

- Modal hoặc detail surface có header, tên khách hàng, mô tả và nút đóng theo cùng modal shell.
- Snapshot tổng quan ở đầu dùng dải metric phẳng.
- Tabs gồm Tổng quan, Buổi tập, Chỉ số cơ thể, Thành tích, Ảnh tiến độ, Giáo án và Báo cáo.
- Nội dung mỗi tab dùng một cấp panel chính; card con chỉ xuất hiện khi cần phân tách dữ liệu độc lập.

### Buổi tập

- Form ghi buổi tập dùng form grid và section rõ ràng.
- Danh sách set dùng hàng dữ liệu gọn, responsive về một cột trên màn rất hẹp.
- Session history hiển thị tiêu đề, ngày, volume/RPE và bài tập theo cùng hierarchy; tránh mỗi set thành một card bo góc riêng.

### Chỉ số cơ thể, biểu đồ và thành tích

- Form đo cơ thể dùng chung `FormField` và grid theo InBody.
- Overview values và chart sections dùng divider/nền nhẹ thay vì card lồng card.
- Thành tích có icon/status vừa đủ; tên bài tập và kết quả là trọng tâm.

### Ảnh, giáo án và báo cáo

- Ảnh dùng grid responsive, tỷ lệ ảnh nhất quán và empty state riêng.
- Giáo án đang áp dụng và lịch sử dùng cùng kiểu record summary với Giáo án khách hàng.
- Báo cáo gồm bộ chọn kỳ, hành động tạo tự động, editor và danh sách báo cáo; action lưu/công bố đặt cạnh nhau.

## Responsive

- Trên 768px: dùng bảng/grid đầy đủ và action nằm ngang.
- Từ 768px trở xuống: header và toolbar xếp dọc; nút chính chia đều hoặc chiếm toàn chiều rộng khi cần.
- Bảng Giáo án khách hàng và Tiến độ chuyển thành card mobile.
- Form nhiều cột chuyển dần về hai rồi một cột.
- Studio chuyển panel phụ thành drawer/panel theo nhu cầu và không tạo cuộn ngang bắt buộc cho vùng chính.
- Touch target duy trì tối thiểu 40–44px.

## Loading, empty và error states

- Loading dùng skeleton theo hình dạng nội dung: metric, toolbar, table row hoặc card.
- Empty state phân biệt chưa có dữ liệu và không có kết quả lọc; mỗi trạng thái có CTA hợp lý.
- API error tiếp tục dùng `ToastProvider` và `errorMessage`.
- Vùng dữ liệu tải thất bại có thông báo inline và thao tác thử lại khi phù hợp.
- Disabled state không chỉ dựa vào màu; loading button giữ nguyên kích thước để tránh layout shift.

## Accessibility

- Tab dùng đúng `role="tablist"`, `role="tab"`, `aria-selected` và liên kết tab panel.
- Icon-only button có tên truy cập rõ.
- Form có label hoặc `aria-label`, placeholder cụ thể và lỗi gắn với trường.
- Focus-visible dùng màu secondary và không bị shadow/border che khuất.
- Modal giữ focus trap, Escape handling và dirty-state confirmation theo primitive hiện có.
- Màu trạng thái không phải tín hiệu duy nhất; luôn có text hoặc icon đi kèm.

## Luồng dữ liệu và tương thích

- Page tiếp tục chịu trách nhiệm state, data fetching và orchestration.
- Feature component nhận data/callback qua props; shared primitive không chứa business logic.
- Không thay đổi endpoint, request payload, response mapping hoặc quyền thao tác.
- Query string, phân trang và filter behavior hiện có được giữ nguyên.
- Việc chuyển CSS thực hiện theo từng vùng; CSS legacy chỉ được xóa sau khi không còn consumer.

## Chiến lược kiểm thử

- Giữ và cập nhật toàn bộ test hành vi hiện có của Giáo án, AI Wizard, Studio và Tiến độ.
- Thêm test cho shared primitives ở những hành vi có ý nghĩa: tab semantics, action layout, loading/empty state và responsive rendering mode.
- Không viết test phụ thuộc vào class string dài hoặc chi tiết trang trí.
- Chạy test theo từng nhóm feature sau mỗi lát cắt triển khai.
- Chạy TypeScript typecheck và production build khi hoàn tất.
- Smoke test trên `localhost:3008` ở desktop khoảng 1440px, tablet khoảng 1024px và mobile khoảng 390px.
- Kiểm tra console/network, keyboard navigation và không phát sinh cuộn ngang ngoài ý muốn.

## Rủi ro và biện pháp giảm thiểu

- Phạm vi lớn có thể làm hỏng selector test cũ: chuyển test sang role/name và giữ thay đổi theo từng lát cắt.
- Studio có tương tác kéo thả phức tạp: chỉ đổi presentation, không đổi model hoặc event logic.
- CSS legacy có thể còn consumer ẩn: dùng tìm kiếm toàn repo trước khi xóa từng selector.
- InBody dùng nhiều inline style: chỉ lấy tỷ lệ thị giác làm chuẩn, không sao chép cách triển khai.
- Hai module có nhiều trạng thái dữ liệu: kiểm tra bằng fixture cho đủ loading, empty, populated, error và permission variants.

## Tiêu chí nghiệm thu

- Giáo án và Tiến độ có cùng mật độ, spacing, radius, typography, surface và action hierarchy với InBody.
- Hai nút tạo giáo án thủ công và AI nằm cạnh nhau, không bị kéo xa.
- Card giáo án và các vùng thông tin Tiến độ không còn khoảng trống quá lớn hoặc nhiều lớp bo góc gây rối.
- Desktop và mobile dùng cách trình bày phù hợp, không chỉ thu nhỏ cùng một layout.
- Toàn bộ chức năng hiện có của Giáo án, AI, Studio và Tiến độ vẫn hoạt động.
- Không có lỗi TypeScript, production build, console hoặc network do thay đổi giao diện.
- Test liên quan vượt qua và smoke test trình duyệt hoàn tất ở ba kích thước mục tiêu.
