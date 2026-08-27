# Đối chiếu chức năng Backend và Frontend

Ngày kiểm kê: 2026-08-27

## Quy ước đánh dấu

- ✅ **Đã có**: frontend đã có màn hình/luồng chính tương ứng và gọi API backend.
- 🟡 **Một phần**: đã có giao diện cho một phần nghiệp vụ nhưng còn thiếu thao tác quan trọng.
- ❌ **Chưa có**: chưa tìm thấy màn hình hoặc luồng frontend tương ứng.
- ⚙️ **Không cần UI riêng**: chức năng hạ tầng/backend được frontend hưởng lợi gián tiếp; chỉ cần UI nếu muốn xây trang vận hành dành cho Admin.

Việc đánh dấu dựa trên mã nguồn hiện tại trong `frontend/src`, bao gồm route, component, lời gọi API và test UI. “Đã có” không có nghĩa frontend tự triển khai các bảo đảm transaction, concurrency, rate limit hoặc bảo mật nội bộ của backend.

## Ma trận tổng quan

| # | Nhóm chức năng Backend | Trạng thái Frontend | Phần frontend hiện có | Khoảng trống chính |
|---:|---|:---:|---|---|
| 1 | Xác thực và phân quyền | ✅ | Trang đăng nhập, lưu phiên JWT, route bảo vệ, hiển thị menu theo Admin/PT/Customer và feature flag | Không có refresh-token hoặc màn hình quản trị phiên; backend hiện không yêu cầu trong danh sách |
| 2 | Quản lý người dùng | 🟡 | Admin xem/tìm kiếm/phân trang/lọc PT; tạo, sửa, đổi trạng thái và xóa PT | Chưa có danh sách tất cả user theo mọi role; chưa có màn hình chi tiết user riêng |
| 3 | Quản lý khách hàng | 🟡 | PT xem, tìm kiếm, lọc, phân trang, tạo, sửa, xóa khách; cấp tài khoản khách | Chưa có màn hình chi tiết đầy đủ; Admin chưa có UI quản lý khách; chưa có sắp xếp/gán PT trực tiếp từ màn hình khách |
| 4 | Quản lý gói tập | ✅ | Popup danh sách gói theo khách, lọc trạng thái, tạo, sửa, xóa; hiển thị tổng/đã dùng/còn lại/ngày/trạng thái | Việc tự trừ buổi và tự hoàn thành do backend xử lý, không cần thao tác UI riêng |
| 5 | Chuyển giao khách hàng | 🟡 | PT tạo, sửa, xóa/hủy yêu cầu; danh sách, lọc; PT nhận chấp nhận hoặc từ chối | Chưa có UI Admin cưỡng chế chuyển giao; chưa hiển thị audit/lịch sử chuyển giao chi tiết |
| 6 | InBody và OCR | ✅ | Upload ảnh, review/chỉnh chỉ số OCR, confirm; workspace InBody; CRUD và publish/unpublish dữ liệu | Không có màn hình chẩn đoán provider; lỗi được hiển thị qua toast |
| 7 | Quản lý mục tiêu | ✅ | PT xem/lọc/phân trang, tạo, sửa, xóa, publish/unpublish mục tiêu | Version được backend quản lý nhưng UI chưa trình bày lịch sử version |
| 8 | Kế hoạch tập luyện | ✅ | PT xem/lọc/phân trang, tạo, sửa, xóa, publish/unpublish; Customer xem bản đã publish | UI chưa hiển thị lịch sử version |
| 9 | Kế hoạch dinh dưỡng | ✅ | PT xem/lọc/phân trang, tạo, sửa, xóa, publish/unpublish; Customer xem bản đã publish | UI chưa hiển thị lịch sử version |
| 10 | Roadmap sức khỏe | 🟡 | Danh sách, tạo roadmap nhiều phase/week, publish/unpublish, timeline, feature gate | Chưa có sửa và xóa roadmap trong workspace hiện tại; Customer API có roadmap nhưng `CustomerView` chưa render nhóm roadmap |
| 11 | Thư viện bài tập | 🟡 | Danh sách, tìm kiếm/lọc, tạo, sửa, xóa, feature gate | Chưa có trang chi tiết bài tập độc lập; audit chỉ do backend ghi, frontend không xem được |
| 12 | Giáo án mẫu | ✅ | Danh sách/lọc, tạo/sửa builder nhiều buổi và bài tập, archive, xóa | Chưa có màn hình xem audit lifecycle |
| 13 | Quản lý buổi tập | ✅ | Form check-in/tạo buổi với idempotency key và lịch sử buổi tập | Snapshot, transaction, trừ gói và chống đồng thời do backend đảm nhiệm |
| 14 | Chỉ số cơ thể và tiến độ | 🟡 | Tạo số đo, tải lịch sử, biểu đồ cân nặng/mỡ/cơ | Chưa có thao tác sửa và xóa body measurement |
| 15 | Báo cáo tiến độ | 🟡 | Danh sách, tạo draft và publish; Customer xem báo cáo đã publish | Chưa có sửa, xóa và unpublish báo cáo trong UI; chưa trình bày metrics/source version đầy đủ |
| 16 | Tính toán dinh dưỡng | ✅ | Form tính BMR/TDEE/calorie/macro và hiển thị tên/version công thức | Chưa có UI Admin quản lý/kích hoạt phiên bản công thức |
| 17 | Nhật ký dinh dưỡng và hoạt động | 🟡 | Xem tổng hợp log; tạo food/activity log; form ước tính chỉ số hoạt động | Chưa có sửa/xóa log; chưa có UI quản lý danh mục hoạt động và tính calorie theo MET như một luồng riêng |
| 18 | AI tạo nội dung | 🟡 | Tạo nutrition draft, PT review/chỉnh rồi lưu thành kế hoạch nháp | Chưa có UI tạo workout draft bằng AI; chưa có màn hình quota/trạng thái provider |
| 19 | Knowledge Base | 🟡 | Admin xem, tạo, sửa, publish/unpublish và re-index tài liệu | Chưa có xóa tài liệu; chưa trình bày chunk/embedding/audit |
| 20 | Tìm kiếm vector | ✅ | PT tìm kiếm tri thức và xem nội dung cùng score | Chưa có bộ lọc topic/document dù backend hỗ trợ |
| 21 | PT Assistant | 🟡 | Danh sách conversation/suggestion; approve, reject, sửa nội dung và apply suggestion | Chưa có tạo conversation, xem chi tiết, chọn conversation và gửi message; chưa có form tạo suggestion độc lập |
| 22 | Chăm sóc khách hàng | ✅ | Tính lại cảnh báo, xem hàng đợi hôm nay, resolve alert, xem care log | Bộ lọc alert theo khách/trạng thái chưa có màn hình riêng; lịch sử hiển thị còn tối giản |
| 23 | Nhiệm vụ chăm sóc | 🟡 | Xem task hôm nay/quá hạn và hoàn thành task kèm kết quả | Chưa có tạo, xem chi tiết, sửa và xóa care task |
| 24 | Lịch làm việc | ✅ | Danh sách, lọc khoảng ngày, tạo, sửa, xóa; chỉnh trạng thái scheduled/completed/cancelled | Chưa có calendar grid; hiện là danh sách nghiệp vụ |
| 25 | Notification | ✅ | Danh sách phân trang, đếm chưa đọc, đánh dấu đã đọc và điều hướng theo resource | Chưa có “đánh dấu tất cả đã đọc” hoặc bộ lọc loại notification |
| 26 | Dashboard PT | ✅ | Tổng khách, cảnh báo mở, trạng thái dữ liệu, rank/score có điều kiện và breakdown | Không có khoảng trống chức năng chính được nêu |
| 27 | Dashboard Admin | ✅ | Tổng hợp PT/khách/cảnh báo/gói; lọc PT, trạng thái khách và khoảng thời gian | Chưa có biểu đồ/xuất báo cáo, không nằm trong danh sách backend |
| 28 | Customer Portal API | 🟡 | Customer xem InBody, goal, workout plan, nutrition plan và progress report đã publish | `CustomerView` chưa render roadmap dù kiểu dữ liệu/backend có cung cấp; nội dung chi tiết còn tối giản |
| 29 | Feature flags | 🟡 | Frontend tải `/api/features/me`, ẩn menu và chặn route theo role/feature | Chưa có UI Admin bật/tắt feature, cấu hình role hoặc pilot user |
| 30 | Audit log | ❌ | Không có trang xem audit | Cần màn hình Admin tra cứu/lọc audit nếu đây là yêu cầu frontend |
| 31 | Migration và seed dữ liệu | ⚙️ | Không có UI; vận hành qua backend/CLI | Có thể bổ sung trang trạng thái migration chỉ khi có nhu cầu vận hành qua web |
| 32 | Bảo mật API | ⚙️ | Frontend gửi JWT và chuẩn hóa hiển thị lỗi API | Helmet, CORS, rate limit, body/upload limit và production errors là trách nhiệm backend |
| 33 | Logging và telemetry | ⚙️ | Frontend không có trang telemetry | Có thể bổ sung observability dashboard/link Sentry nếu có nhu cầu vận hành |
| 34 | Health check và lifecycle | ⚙️ | Frontend/backend được serve cùng cổng; endpoint health sẵn sàng để giám sát | Không có status page trong frontend, thông thường không bắt buộc |
| 35 | Production build và triển khai | ✅ | Frontend build bằng Vite; backend serve SPA và API cùng server/cổng; dev cũng chạy cùng cổng | Không có UI riêng; đây là năng lực đóng gói/triển khai |
| 36 | Automated tests và CI | ✅ | Có unit/UI/full-journey tests cho frontend; build/typecheck/lint tích hợp trong quy trình dự án | Frontend không trực tiếp hiển thị trạng thái CI; xem trên nền tảng repository |

## Tổng hợp mức độ phủ

| Trạng thái | Số nhóm | Nhóm |
|---|---:|---|
| ✅ Đã có | 17 | 1, 4, 6, 7, 8, 9, 12, 13, 16, 20, 22, 24, 25, 26, 27, 35, 36 |
| 🟡 Một phần | 14 | 2, 3, 5, 10, 11, 14, 15, 17, 18, 19, 21, 23, 28, 29 |
| ❌ Chưa có | 1 | 30 |
| ⚙️ Không cần UI riêng | 4 | 31, 32, 33, 34 |

## Các khoảng trống nên ưu tiên

### Ưu tiên 1 — Hoàn thiện luồng nghiệp vụ đang dang dở

1. **PT Assistant:** tạo/chọn conversation, xem message và gửi message.
2. **Care task:** tạo, sửa, xóa và xem chi tiết task.
3. **Workout AI draft:** bổ sung luồng tương đương nutrition AI draft.
4. **Customer Portal:** hiển thị roadmap đã publish.
5. **Feature flags Admin:** bật/tắt feature, cấu hình role và pilot user.

### Ưu tiên 2 — Hoàn thiện CRUD và khả năng tra cứu

1. Sửa/xóa body measurement.
2. Sửa/xóa/unpublish progress report.
3. Sửa/xóa roadmap.
4. Sửa/xóa nutrition/activity log.
5. Xóa Knowledge Base document.
6. Bộ lọc topic/document cho vector search.
7. UI Admin cưỡng chế chuyển khách và quản lý khách hàng.

### Ưu tiên 3 — Công cụ quản trị/vận hành

1. Trang tra cứu audit log.
2. Trang quản lý phiên bản công thức dinh dưỡng.
3. Status/health/telemetry dashboard nếu đội vận hành cần dùng trên web.

## Bằng chứng mã nguồn chính

- Route và feature gate: `frontend/src/pages/PortalPage.tsx`, `frontend/src/components/FeatureRoute.tsx`.
- Điều hướng theo role/feature: `frontend/src/config/portalNavigation.ts`, `frontend/src/components/AppShell.tsx`.
- User, customer, package, transfer, goal và plan: `frontend/src/components/portal/PortalViews.tsx` và các modal trong `frontend/src/components/ui`.
- InBody, roadmap, exercise, workout, progress, nutrition, care, calendar, notification, knowledge và assistant: các thư mục tương ứng trong `frontend/src/components`.
- Customer portal: `frontend/src/components/customer-portal/CustomerRoutes.tsx`, `frontend/src/components/portal/PortalViews.tsx`.
- Login/session/API: `frontend/src/pages/LoginPage.tsx`, `frontend/src/services/session.ts`, `frontend/src/services/api.ts`.
- Kiểm thử hành trình: `frontend/tests/fullJourney.ui.test.tsx` và các file `*.test.tsx` trong `frontend/tests/components/`.
