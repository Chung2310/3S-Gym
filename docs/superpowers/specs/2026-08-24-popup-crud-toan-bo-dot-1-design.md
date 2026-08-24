# Thiết kế popup CRUD toàn bộ Đợt 1

## Mục tiêu

Chuẩn hóa toàn bộ thao tác CRUD trong các màn hình danh sách của Đợt 1: thêm và sửa luôn mở form trong popup; xóa luôn mở popup xác nhận; không còn form CRUD hiển thị trực tiếp trong nội dung trang. Các module có đầy đủ API sửa/xóa, validate route, phân quyền, response chuẩn và message tiếng Việt.

Các form đăng nhập và công cụ tính toán độc lập trong `ConsultationTool` không phải CRUD danh sách nên không thuộc phạm vi này.

## Kiến trúc frontend

Dùng một khung `FormModal` tổng quát cho lifecycle popup: accessible dialog, header, nội dung cuộn, footer, loading, đóng bằng backdrop/nút đóng và `ConfirmModal` khi có dữ liệu chưa lưu. `ProfileFormModal` tiếp tục phục vụ hồ sơ PT/khách và có thể được xây trên `FormModal` để không lặp lifecycle.

Mỗi nghiệp vụ có component riêng để giữ payload và validation rõ ràng:

- `PtFormModal`: thêm/sửa PT.
- `CustomerFormModal`: thêm/sửa hồ sơ khách.
- `CustomerAccountModal`: cấp tài khoản khách.
- `TransferFormModal`: thêm/sửa yêu cầu chuyển PT.
- `ContentFormModal`: dispatcher theo resource; dùng các form riêng cho InBody, mục tiêu, giáo án và dinh dưỡng.
- `PtPackageFormModal`: thêm/sửa gói PT.

Trang danh sách chỉ quản lý resource/tab, tải dữ liệu và state bản ghi đang thao tác. Không chứa implementation chi tiết của form. Thành công đóng popup, tải lại đúng trang danh sách và hiển thị Toast; lỗi giữ popup mở và hiển thị Toast tiếng Việt.

## Quy tắc giao diện chung

- Nút “Tạo mới” mở popup tạo phù hợp với tab hiện tại.
- Nút “Sửa” mở cùng popup với dữ liệu điền sẵn.
- Nút “Xóa” mở `ConfirmModal` dạng nguy hiểm, mô tả rõ dữ liệu bị mất và khóa nút trong lúc xử lý.
- Không render bất kỳ form CRUD nào giữa thanh tab và bảng/card danh sách.
- Desktop ưu tiên hai cột khi phù hợp; điện thoại một cột, popup gần toàn màn hình, không tràn ngang và vùng hành động dễ tiếp cận.
- Popup có accessible name, input có label, focus hiển thị rõ và nút có nhãn tiếng Việt.
- Các yêu cầu xác nhận khác như công bố, thu hồi, nhận/từ chối chuyển PT tiếp tục dùng popup.

## PT

Thêm/sửa tiếp tục dùng `PtFormModal`. Danh sách bổ sung thao tác Xóa.

`DELETE /api/users/:id` chỉ dành cho Admin, validate ObjectId và chỉ xóa user vai trò PT. Nếu PT còn bất kỳ `CustomerProfile` đang được phân công, API trả 409 với message yêu cầu chuyển hết khách sang PT khác trước. Không tự xóa khách khi xóa PT.

Khi PT không còn phụ trách khách, service xử lý trong transaction trước khi xóa tài khoản:

1. Với từng nội dung InBody, mục tiêu, giáo án và dinh dưỡng có `ptId` là PT bị xóa, tìm khách tương ứng và đổi `ptId` sang `assignedPtId` hiện tại của khách. Nội dung, trạng thái công bố và version được giữ nguyên.
2. Lịch sử chuyển PT được giữ lại. `TransferRequest` lưu snapshot tên PT gửi, PT nhận và người xử lý tại thời điểm thao tác; UI ưu tiên snapshot nếu tài khoản gốc đã bị xóa.
3. Xóa tài khoản PT sau khi các tham chiếu nội dung đã được chuyển giao thành công.

Nếu có nội dung thuộc khách không còn tồn tại hoặc khách chưa có PT hiện tại hợp lệ, API chặn xóa PT và trả 409 thay vì tạo tham chiếu mồ côi.

## Khách hàng và tài khoản khách

Thêm/sửa tiếp tục dùng `CustomerFormModal`. Danh sách bổ sung Xóa. `CustomerAccountForm` nội tuyến được thay bằng `CustomerAccountModal`; cấp tài khoản vẫn là thao tác riêng và chỉ hiển thị khi khách chưa có `userId`.

`DELETE /api/customers/:id` cho Admin hoặc PT đang phụ trách khách, validate ID và xóa cứng theo thứ tự an toàn:

1. Gói PT theo `customerId`.
2. InBody, mục tiêu, giáo án và dinh dưỡng theo `customerId`.
3. Yêu cầu chuyển PT theo `customerId`.
4. Hồ sơ `CustomerProfile`.
5. Tài khoản `User` được liên kết bằng `userId`, nếu có và có vai trò `CUSTOMER`.

Service dùng MongoDB transaction để tránh trạng thái xóa dở dang. Nếu transaction thất bại, toàn bộ thao tác rollback và middleware lỗi trả response chuẩn. Popup cảnh báo rõ đây là xóa vĩnh viễn toàn bộ dữ liệu khách.

## Yêu cầu chuyển PT

Tạo/sửa yêu cầu dùng `TransferFormModal`; không còn `TransferForm` nội tuyến.

- `PATCH /api/transfers/:id` chỉ cho PT gửi (`fromPtId`) sửa yêu cầu còn `PENDING`.
- Chỉ được sửa `toPtId` và `reason`; phải kiểm tra PT nhận tồn tại, hoạt động, khác PT gửi và không trùng yêu cầu chờ khác.
- `DELETE /api/transfers/:id` chỉ cho PT gửi xóa yêu cầu còn `PENDING`.
- Yêu cầu `ACCEPTED`, `REJECTED`, `CANCELLED` hoặc `ADMIN_FORCED` không được sửa/xóa.
- Nhận, từ chối và Admin chuyển bắt buộc giữ luồng hiện tại.
- Model lưu snapshot tên PT gửi/nhận/người xử lý để lịch sử vẫn đọc được sau khi tài khoản PT bị xóa.

## InBody, mục tiêu, giáo án và dinh dưỡng

Bốn resource dùng route factory và service chung nhưng mỗi resource giữ validator body riêng.

Mỗi router bổ sung:

- `PATCH /api/<resource>/:id`: sửa nội dung thuộc khách mà PT có quyền quản lý.
- `DELETE /api/<resource>/:id`: xóa cứng nội dung thuộc khách mà PT có quyền quản lý.

Khi sửa bản ghi đã `PUBLISHED`, service tăng `version`, chuyển `status` về `DRAFT` và đặt `publishedAt = null`. Khách không còn thấy phiên bản vừa bị sửa cho đến khi PT công bố lại. Không cho client sửa trực tiếp `ptId`, `status`, `publishedAt` hoặc `version`.

Form chi tiết:

- InBody: khách, ngày đo, cân nặng, BMI, % mỡ, khối lượng mỡ, khối lượng cơ, BMR, mỡ nội tạng, điểm InBody, điểm mạnh, ưu tiên, khuyến nghị và nguồn dữ liệu.
- Mục tiêu: khách, loại, tiêu đề, giá trị/đơn vị mục tiêu, hạn, số buổi mỗi tuần, cardio và ghi chú đánh giá.
- Giáo án: khách, tiêu đề, ngày bắt đầu/kết thúc và danh sách buổi/bài tập. UI phải cho thêm/xóa dòng buổi và bài tập trong popup.
- Dinh dưỡng: khách, tiêu đề, BMR, TDEE, calories mục tiêu, protein/carb/fat, ghi chú và menu cơ bản. Payload giữ đúng cấu trúc `macros` và `menu` của model.

Danh sách từng tab có các thao tác Sửa, Xóa và Công bố/Thu hồi. Danh sách tiếp tục dùng phân trang và bộ lọc hiện có.

## Gói PT

Gói PT được quản lý từ ngữ cảnh khách hàng, dùng danh sách có phân trang và bộ lọc trạng thái.

- `POST /api/customers/:id/packages`: tạo gói bằng popup.
- `PATCH /api/customers/:id/packages/:packageId`: sửa tên, tổng số buổi, ngày bắt đầu/kết thúc và trạng thái; không cho `usedSessions` âm hoặc vượt tổng số buổi; tính lại `remainingSessions`.
- `DELETE /api/customers/:id/packages/:packageId`: xóa cứng gói sau xác nhận.
- Route validate cả `id`, `packageId` và body; service kiểm tra quyền quản lý khách trước khi sửa/xóa.

## Backend và response

Tất cả endpoint mới giữ bốn tầng Route → Controller → Service → Model. Mọi route có validation. Service thực thi quyền sở hữu và business rule; controller chỉ điều phối và trả response chuẩn.

Response thành công tiếp tục theo mẫu chung. DELETE trả HTTP 200 với `data: null` và message tiếng Việt như “Xóa mục tiêu thành công.” để phù hợp client hiện tại. Lỗi không tìm thấy trả 404, vi phạm trạng thái/quy tắc nghiệp vụ trả 409, validation trả 400 và lỗi quyền trả 403.

## Xóa cứng và an toàn thao tác

Xóa cứng là quyết định sản phẩm đã được duyệt và không có chức năng khôi phục. Popup xóa phải hiển thị tên bản ghi; riêng khách hàng phải nêu toàn bộ hồ sơ, tài khoản và nội dung liên quan sẽ mất vĩnh viễn. Nút xác nhận dùng nhãn cụ thể như “Xóa vĩnh viễn”, style nguy hiểm và chống gửi trùng.

Backend không dựa vào xác nhận frontend. Mỗi DELETE vẫn xác thực, phân quyền, validate ID, kiểm tra phạm vi sở hữu và trạng thái cho phép.

## Kiểm thử

- Contract component: `FormModal` render/đóng/submit/loading/dirty confirmation/responsive class.
- Portal: không còn form CRUD inline; mỗi tab mở đúng popup tạo/sửa; các thao tác Sửa, Xóa, Công bố/Thu hồi tồn tại đúng điều kiện; cấp tài khoản là popup riêng.
- Backend content: update chuyển published về draft, tăng version; delete kiểm tra ownership; validate body/ID; response tiếng Việt.
- Transfer: chỉ người gửi sửa/xóa yêu cầu PENDING; chặn trạng thái đã xử lý.
- Customer cascade: xóa đầy đủ mọi collection liên quan và tài khoản CUSTOMER; rollback khi một bước thất bại.
- PT: chặn xóa khi còn khách; xóa khi không còn khách.
- PT: chuyển `ptId` của nội dung lịch sử sang PT hiện tại, giữ snapshot lịch sử chuyển giao và chặn dữ liệu mồ côi.
- Package: create/update/delete, tính remaining sessions và kiểm tra ownership.
- Hồi quy: toàn bộ test, lint và production build.

## Ngoài phạm vi

- Form đăng nhập, quên mật khẩu và các công cụ tính BMI/TDEE/BFP/nước/1RM không phải CRUD danh sách.
- Khôi phục dữ liệu đã xóa hoặc thùng rác.
- Xóa hàng loạt.
- Tự động xóa khách khi xóa PT.
- Thay đổi quy tắc khách Đợt 1 chỉ được xem nội dung đã công bố.
