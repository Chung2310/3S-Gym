# Thiết kế làm lại giao diện Tiến độ

## Bối cảnh

Hai màn hình thuộc phạm vi là trang PT `/pt/progress` và trang khách hàng `/me/progress`. Cả hai đang dùng cùng dữ liệu `CustomerJourneyDto`, nhưng cách trình bày chưa nhất quán:

- Trang PT ưu tiên thanh tab và các form nghiệp vụ, chưa có một snapshot đủ rõ sau khi chọn học viên.
- Trang khách hàng trộn báo cáo, ảnh và thành tích trong một component lớn với nhiều inline style.
- Các component Tiến độ dùng lẫn Tailwind utility và class CSS legacy như `button`, `panel`, `field`.
- Module InBody có phân cấp nội dung và responsive mobile rõ hơn, nhưng vẫn chứa nhiều inline style. Thiết kế mới chỉ lấy InBody làm tham chiếu về hierarchy và responsive, không sao chép cách styling legacy.

## Mục tiêu

Làm lại giao diện Tiến độ cho cả PT và khách hàng để:

1. Đưa snapshot KPI và trạng thái dữ liệu lên đầu trải nghiệm.
2. Đồng nhất visual giữa hai vai trò mà không trộn quyền chỉnh sửa của PT với giao diện chỉ đọc của khách hàng.
3. Dùng Tailwind CSS v4 và các token trong `frontend/src/index.css`.
4. Cải thiện responsive, accessibility, loading, empty và error states.
5. Giữ nguyên API, DTO, payload và nghiệp vụ hiện tại.

## Ngoài phạm vi

- Không thay đổi backend, endpoint, quyền truy cập hoặc schema dữ liệu.
- Không bổ sung tính năng nghiệp vụ chưa tồn tại.
- Không sửa các component Progress legacy không được hai route mục tiêu sử dụng.
- Không tái cấu trúc module InBody.
- Không thêm thư viện UI, chart hoặc animation mới.
- Không tạo class `.progress-*` trong global CSS nếu các token Tailwind hiện tại đã đáp ứng yêu cầu.

## Quyết định thiết kế

### Hướng kiến trúc

Dùng shared visual primitives kết hợp với hai workspace riêng theo vai trò.

- Component dùng chung chỉ nhận dữ liệu trình bày và callback trung tính.
- Workspace PT giữ các thao tác ghi buổi tập, nhập số đo và tạo báo cáo.
- Workspace khách hàng chỉ đọc dữ liệu đã được backend cho phép.
- Không tạo một component dashboard chung có nhiều nhánh điều kiện theo role.

### Styling

- Tailwind CSS v4 là phương thức styling duy nhất cho code mới hoặc code được sửa.
- Dùng `primary`, `secondary`, `gym-bg`, `gym-dark`, `gym-gray`, `font-oswald` và `font-montserrat` từ `@theme` trong `frontend/src/index.css`.
- Không thêm inline style, CSS module, styled-components hoặc CSS theo component vào `index.css`.
- Không đưa thêm màu hardcode lặp lại nếu token hiện tại đã biểu đạt đúng ý nghĩa.
- Màu amber và red chỉ dùng cho warning/error thực tế; `secondary` dùng cho tương tác và active state.
- Bề mặt chính dùng nền trắng, viền slate nhẹ và shadow tiết chế.

## Kiến trúc component

### Shared progress primitives

Các component mới nằm trong `frontend/src/components/progress/`:

#### `ProgressMetricCard`

Hiển thị một KPI gồm nhãn, giá trị, mô tả ngắn và trạng thái visual. Component không đọc API và không tự suy diễn nghiệp vụ.

#### `ProgressSnapshot`

Nhận analytics đã có trong `CustomerJourneyDto`, dựng bốn KPI:

- tỷ lệ tham gia;
- tổng volume;
- RPE trung bình;
- chuỗi tập theo tuần.

KPI đầu tiên dùng bề mặt `primary`; ba KPI còn lại dùng bề mặt trung tính. Khi giá trị không tồn tại, component hiển thị dấu gạch ngang và lý do từ `dataQuality` thay vì số `0`.

#### `ProgressSection`

Chuẩn hóa section title, mô tả, số lượng, action tùy chọn và khoảng cách nội dung. Component dùng semantic `<section>` cùng heading level do caller cung cấp.

#### `ProgressEmptyState`

Hiển thị trạng thái trống theo ngữ cảnh, hỗ trợ icon, tiêu đề, mô tả và CTA tùy chọn. CTA PT có thể chuyển tab; giao diện khách hàng không hiển thị thao tác quản trị.

#### `ProgressSkeleton`

Hiển thị skeleton theo đúng hình dạng snapshot và vùng nội dung trong lúc tải journey. Animation phải tắt khi người dùng bật reduced motion.

### PT-specific components

`ProgressPage` tiếp tục chịu trách nhiệm:

- giữ `customerId`, `journey`, loading và error state;
- gọi `GET /api/customers/:customerId/journey`;
- xử lý chọn, đổi và xóa học viên;
- truyền dữ liệu xuống `PtProgressWorkspace`.

`PtProgressWorkspace` tiếp tục quản lý tab hiện tại và được bổ sung:

- thông tin học viên đang theo dõi;
- `ProgressSnapshot`;
- warning chất lượng dữ liệu;
- quick actions chuyển đến tab Buổi tập, Chỉ số cơ thể và Báo cáo.

Bảy tab hiện tại được giữ nguyên:

1. Tổng quan.
2. Buổi tập.
3. Chỉ số cơ thể.
4. Thành tích.
5. Ảnh tiến độ.
6. Giáo án.
7. Báo cáo.

Các component nghiệp vụ hiện tại tiếp tục xử lý API và form như trước. Việc làm lại chỉ chuẩn hóa hierarchy, spacing, state và Tailwind classes.

### Customer-specific components

`CustomerPortalPage` tiếp tục fetch `GET /api/me/journey` và chọn nội dung theo route. Nhánh `/me/progress` render workspace khách hàng gồm:

1. `ProgressSnapshot`.
2. Báo cáo PT mới nhất ở vị trí nổi bật.
3. Filter Tất cả, Ảnh, Báo cáo và Thành tích.
4. Danh sách báo cáo cũ.
5. Gallery ảnh tiến độ.
6. Danh sách kỷ lục cá nhân.

`CustomerReportsPhotos` được tách thành các component trình bày nhỏ:

- report highlight/list;
- progress photo gallery;
- achievement grid;
- accessible photo lightbox.

Các component này chỉ nhận props từ `CustomerReportsPhotos`; không tự gọi API.

## Bố cục trang PT

### Chưa chọn học viên

Trang hiển thị:

- page header;
- khối tìm học viên;
- empty state giải thích rằng PT cần chọn học viên để xem journey.

Không render tab rỗng hoặc vùng trắng lớn.

### Đã chọn học viên

Thứ tự nội dung:

1. Dải thông tin học viên và action chính "Ghi nhận buổi tập".
2. Snapshot bốn KPI.
3. Warning chất lượng dữ liệu nếu có.
4. Quick actions cho Buổi tập, Chỉ số cơ thể và Báo cáo.
5. Thanh bảy tab.
6. Nội dung tab đang chọn.

Quick action chỉ đổi tab, không tự thực hiện mutation.

## Bố cục trang khách hàng

Thứ tự nội dung:

1. Header hiện tại và nút làm mới dữ liệu.
2. Snapshot bốn KPI.
3. Báo cáo PT đã công bố mới nhất.
4. Filter nội dung.
5. Các section báo cáo, ảnh và thành tích theo filter.

Nếu chưa có báo cáo, ảnh hoặc thành tích, mỗi section có empty state riêng với copy hướng dẫn phù hợp khách hàng. Draft report không được hiển thị nếu backend không trả về.

## Responsive

### Desktop

- Snapshot hiển thị bốn cột với KPI đầu tiên nổi bật.
- Nội dung tab tối đa hai cột khi phù hợp.
- Form và lịch sử buổi tập có đủ không gian đọc mà không kéo tràn trang.

### Tablet

- Snapshot chuyển thành lưới 2x2.
- Quick actions và section actions tự xuống dòng.
- Gallery giảm số cột theo chiều rộng.

### Mobile

- Nội dung xếp một cột; gallery dùng một hoặc hai cột tùy chiều rộng ảnh.
- Button tương tác có chiều cao tối thiểu 44px.
- Thanh tab cuộn ngang, không làm tràn viewport.
- Form, fieldset buổi tập và session detail xếp dọc.
- Biểu đồ giữ đúng tỷ lệ và không tạo horizontal overflow.
- Bottom spacing tôn trọng safe area của thiết bị.

## Trạng thái UX

### Loading

- Khi tải journey lần đầu, hiển thị `ProgressSkeleton`.
- Khi refresh dữ liệu đã có, giữ nội dung cũ và thể hiện trạng thái loading trên action để tránh layout jump.

### Error

- Giữ toast hiện tại để báo lỗi tức thời.
- Đồng thời hiển thị error state inline với nút thử lại.
- Khi refresh thất bại nhưng đã có dữ liệu, giữ dữ liệu cũ và chỉ báo lỗi; không xóa workspace.

### Empty và insufficient data

- Chưa chọn học viên, chưa có giáo án, chưa có session, chưa có measurement, chưa có ảnh, chưa có báo cáo và chưa có thành tích là các trạng thái riêng.
- Chart có ít hơn hai điểm giữ thông điệp "Không đủ dữ liệu".
- KPI thiếu dữ liệu dùng dấu gạch ngang và lý do `dataQuality`.
- Không chuyển giá trị thiếu thành `0`.

## Accessibility và interaction

- Dùng semantic heading theo thứ tự và `<section>` có accessible name.
- Tab có `role="tablist"`, `role="tab"`, `aria-selected` và focus-visible rõ ràng.
- Button có accessible name, disabled state và pressed feedback.
- Interactive transition dùng transform/opacity và hỗ trợ `motion-reduce`.
- Photo lightbox dùng `role="dialog"`, `aria-modal="true"`, nút đóng có nhãn, đóng bằng Escape và trả focus về ảnh đã mở.
- Ảnh giữ alt text mô tả stage tiến độ.
- Không dùng hover-only interaction cho chức năng bắt buộc.

## Data flow

### PT

```text
/pt/progress
  -> ProgressPage fetch customer journey
  -> PtProgressWorkspace nhận CustomerJourneyDto
  -> ProgressSnapshot nhận JourneyAnalytics
  -> tab component nhận phần dữ liệu tương ứng
  -> mutation hiện tại gọi onRefresh
  -> ProgressPage tải lại journey
```

### Khách hàng

```text
/me/progress
  -> CustomerPortalPage fetch /api/me/journey
  -> CustomerReportsPhotos nhận CustomerJourneyDto
  -> ProgressSnapshot + report/photo/achievement components
  -> filter chỉ thay đổi nội dung hiển thị cục bộ
```

Không có data flow ngược từ component trình bày sang service hoặc API ngoài các callback hiện có.

## Ranh giới file dự kiến

### Tạo mới

- `frontend/src/components/progress/ProgressMetricCard.tsx`
- `frontend/src/components/progress/ProgressSnapshot.tsx`
- `frontend/src/components/progress/ProgressSection.tsx`
- `frontend/src/components/progress/ProgressEmptyState.tsx`
- `frontend/src/components/progress/ProgressSkeleton.tsx`
- `frontend/src/components/customer-portal/CustomerProgressReportSection.tsx`
- `frontend/src/components/customer-portal/CustomerProgressPhotoGallery.tsx`
- `frontend/src/components/customer-portal/CustomerProgressAchievements.tsx`
- `frontend/src/components/customer-portal/ProgressPhotoLightbox.tsx`

### Sửa

- `frontend/src/pages/pt/ProgressPage.tsx`
- `frontend/src/components/progress/PtProgressWorkspace.tsx`
- `frontend/src/components/progress/ProgressOverview.tsx`
- `frontend/src/components/progress/WorkoutSessionLogger.tsx`
- `frontend/src/components/progress/WorkoutSessionDetail.tsx`
- `frontend/src/components/progress/MeasurementForm.tsx`
- `frontend/src/components/progress/ProgressCharts.tsx`
- `frontend/src/components/progress/AchievementList.tsx`
- `frontend/src/components/progress/ProgressReportGenerator.tsx`
- `frontend/src/components/customer-portal/CustomerReportsPhotos.tsx`

`frontend/src/index.css` không cần sửa nếu các token hiện tại đủ dùng. Nếu implementation phát hiện một giá trị lặp lại thực sự là design token dùng chung, token đó phải được thêm vào `@theme` trước khi sử dụng; không thêm selector `.progress-*`.

## Kiểm thử

### Shared components

- Snapshot render đủ bốn KPI.
- Giá trị thiếu render dấu gạch ngang và data-quality reason.
- Empty state có hoặc không có CTA theo props.
- Skeleton có accessible loading state và reduced-motion classes.

### PT

- Chọn học viên gọi đúng endpoint và render workspace.
- Loading render skeleton; error render retry; retry gọi lại endpoint.
- Không chọn học viên render empty state hướng dẫn.
- Bảy tab vẫn tồn tại và giữ accessible roles.
- Ba quick action chuyển đúng tab.
- Các test nghiệp vụ hiện có cho workout logger, measurement, chart và report tiếp tục pass.

### Khách hàng

- Snapshot render dữ liệu journey.
- Báo cáo mới nhất xuất hiện trước danh sách cũ.
- Filter hiển thị đúng ảnh, báo cáo hoặc thành tích.
- Mỗi collection rỗng có empty state riêng.
- Lightbox mở từ ảnh, đóng bằng nút và Escape, rồi trả focus.
- Không render thao tác mutation của PT.

### Verification

Chạy theo thứ tự:

1. Focused Vitest cho component đang sửa.
2. Toàn bộ test thuộc `frontend/tests/components/progress` và customer progress.
3. `npm run typecheck`.
4. `npm run lint`.
5. `npm run build`.

## Tiêu chí chấp nhận

- Hai route `/pt/progress` và `/me/progress` có snapshot KPI thống nhất.
- PT vẫn dùng đủ bảy khu vực và toàn bộ mutation hiện tại.
- Khách hàng chỉ thấy dữ liệu read-only và báo cáo backend trả về.
- Không có inline style trong các file được sửa.
- Không có CSS module, styled-components hoặc selector global `.progress-*` mới.
- Màu và font lấy từ token `index.css` qua Tailwind utilities.
- Loading, error, empty và insufficient-data states đều có giao diện rõ ràng.
- Tab, button và lightbox dùng được bằng bàn phím.
- Layout không tràn ngang ở mobile.
- Focused tests, typecheck, lint và production build đều pass.
