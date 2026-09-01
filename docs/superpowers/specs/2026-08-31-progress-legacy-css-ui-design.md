# Thiết kế chuẩn hóa giao diện module Tiến độ bằng CSS legacy

## Mục tiêu

Chuyển toàn bộ giao diện module Tiến độ về hệ CSS legacy dùng chung của dự án, ưu tiên tái sử dụng selector hiện có trong `frontend/src/index.css`. Chỉ bổ sung selector `progress-*` khi chưa có primitive phù hợp, đồng thời giữ nguyên nghiệp vụ, API và luồng thao tác hiện tại.

## Quyết định kỹ thuật

Yêu cầu này chủ động chọn hướng legacy-first thay cho chính sách Tailwind-first mặc định. Trong phạm vi module Tiến độ:

- Không giữ Tailwind utility trong JSX.
- Không giữ `style={{ ... }}`.
- Không thêm CSS module, styled-components hoặc thư viện CSS mới.
- Tái sử dụng class chung trước khi tạo class `progress-*`.
- Selector mới phải được giới hạn trong namespace `progress-*` để không ảnh hưởng module khác.

## Phạm vi file

### Trang

- `frontend/src/pages/pt/ProgressPage.tsx`

### Component

- `ProgressDashboard.tsx`
- `ProgressModal.tsx`
- `ProgressDetailModal.tsx`
- `WorkoutSessionModal.tsx`
- `PtProgressWorkspace.tsx`
- `WorkoutSessionLogger.tsx`
- `WorkoutSessionDetail.tsx`
- `MeasurementForm.tsx`
- `ProgressCharts.tsx`
- `ProgressOverview.tsx`
- `AchievementList.tsx`
- `ProgressReportGenerator.tsx`
- `ProgressReportEditor.tsx`
- `ProgressReportList.tsx`

### CSS và test

- `frontend/src/index.css`
- Các test hiện có trong `frontend/tests/components/progress/` và `frontend/tests/pages/pt/ProgressPage.test.tsx`.

Không thay đổi component portal khách hàng nằm ngoài `components/progress`, backend, API hoặc model dữ liệu.

## Chiến lược tái sử dụng

Thứ tự lựa chọn styling:

1. Dùng class chung đã có: `section-header`, `panel`, `button`, `button-primary`, `button-secondary`, `form-grid`, `field`, `inline-actions`, `empty-state`, `modal-backdrop`, `modal-actions`, `filter-bar` và các primitive tương đương.
2. Nếu class chung gần phù hợp, kết hợp với một class `progress-*` nhỏ thay vì sao chép toàn bộ declaration.
3. Chỉ tạo một component-specific selector khi cấu trúc thật sự đặc thù như KPI, card khách hàng, biểu đồ hoặc session set grid.

Không sao chép các declaration giống nhau sang nhiều selector `progress-*`.

## Hệ class module

### Bố cục trang và dashboard

- `progress-page`: khung trang và khoảng cách dọc.
- `progress-loading`: trạng thái tải trang.
- `progress-dashboard`: bố cục dashboard.
- `progress-metrics`: grid KPI responsive.
- `progress-metric-card`, `progress-metric-label`, `progress-metric-value`, `progress-metric-icon`: cấu trúc KPI nhất quán.
- `progress-search-panel`: vùng tìm kiếm.
- `progress-customer-grid`: grid khách hàng responsive.
- `progress-customer-card`: card khách hàng với trạng thái hover/focus.
- `progress-customer-summary`: grid chỉ số trong card.
- `progress-card-actions`: nhóm hai action cùng kích thước.

### Modal và tabs

- Modal dùng lại `modal-backdrop`; thêm `progress-modal`, `progress-modal-header`, `progress-modal-body`, `progress-modal-close` cho kích thước lớn và scrolling.
- `progress-tabs`, `progress-tab`, `progress-tab-active`: tabs cuộn ngang trên mobile, hiển thị trạng thái focus và selected rõ ràng.

### Form và dữ liệu tập luyện

- Form dùng lại `field`, `form-grid`, `button` và `inline-actions`.
- `progress-form`, `progress-form-section`, `progress-session-grid`, `progress-set-grid` xử lý bố cục đặc thù.
- Input, select và textarea tiếp tục dùng styling chung từ `.field`; mọi input văn bản vẫn có placeholder rõ ràng.
- `progress-session-card`, `progress-exercise-card`, `progress-set-card` trình bày lịch sử và chi tiết buổi tập.

### Chỉ số, biểu đồ, thành tích và báo cáo

- `progress-chart-grid`, `progress-chart-card`, `progress-chart-empty` cho biểu đồ.
- `progress-overview-grid` dùng chung hình thức KPI.
- `progress-achievement-grid`, `progress-achievement-card` cho thành tích.
- Báo cáo dùng `panel`, `form-grid`, `field`, `inline-actions`; chỉ thêm `progress-report-*` khi cần bố cục riêng.

## Responsive và accessibility

- Mobile: một cột; action đủ chiều cao chạm; tabs cuộn ngang; modal có padding nhỏ và body scroll.
- Tablet: dashboard/card/form chuyển hai cột khi đủ rộng.
- Desktop: KPI bốn cột, danh sách khách hàng tối đa ba cột, biểu đồ hai cột.
- Giữ nguyên role, `aria-label`, `aria-selected`, focus trap và Escape behavior hiện có.
- Tất cả button có `hover`, `active`, `disabled` và `focus-visible` trong CSS.
- Tôn trọng `prefers-reduced-motion` cho transition hoặc transform mới.

## Migration theo lát cắt

1. Tạo các primitive CSS `progress-*` nền tảng và chuyển `ProgressPage`, `ProgressDashboard`.
2. Chuyển `ProgressModal`, modal wrapper và `PtProgressWorkspace`/tabs.
3. Chuyển form và lịch sử buổi tập.
4. Chuyển số đo, biểu đồ, overview và thành tích.
5. Chuyển báo cáo tiến độ.
6. Quét toàn thư mục để bảo đảm không còn Tailwind utility, inline style, class `!` hoặc class không hợp lệ.

Mỗi lát cắt phải chạy test liên quan trước khi chuyển sang lát tiếp theo.

## Kiểm thử

### Hành vi

- Dashboard tiếp tục lọc khách hàng và mở đúng modal.
- Modal chi tiết và modal buổi tập mở/đóng đúng, hỗ trợ Escape và focus.
- Tabs giữ đúng nội dung và trạng thái selected.
- Ghi buổi tập, nhập số đo, tạo/chỉnh sửa/công bố báo cáo vẫn gửi payload như trước.
- Biểu đồ, thành tích, trạng thái trống và loading vẫn hiển thị đúng.

### Styling contract

- Các component trong phạm vi không còn thuộc tính `style`.
- JSX không còn Tailwind utility.
- Class module chỉ dùng class chung hoặc namespace `progress-*`.
- Không còn class ghi đè `!` và `bg-emerald-55`.
- Test kiểm tra các class cấu trúc quan trọng thay vì màu/pixel chi tiết.

### Verification

- Chạy từng file test progress trong quá trình migration.
- Chạy toàn bộ test progress và `ProgressPage.test.tsx`.
- Chạy `npm run typecheck`.
- Chạy lint trên các file thay đổi.
- Chạy build frontend nếu các bước trên đạt.

## Tiêu chí hoàn thành

- Module Tiến độ không còn Tailwind utility hoặc inline style.
- Giao diện dùng lại tối đa CSS legacy hiện có; selector mới nằm trong namespace `progress-*`.
- Desktop, tablet và mobile có bố cục rõ ràng, không tràn nội dung.
- Mọi hành vi hiện tại được bảo toàn bằng test.
- Typecheck, lint và build đạt; mọi lỗi suite ngoài phạm vi được báo riêng, không che giấu.
