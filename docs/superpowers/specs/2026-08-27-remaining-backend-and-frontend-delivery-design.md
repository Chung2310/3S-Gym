# Thiết kế triển khai phần Backend còn thiếu và Frontend 3S Wellness

## Mục tiêu

Tạo hai backlog triển khai độc lập, có thể bắt đầu ngay và không gắn với timeline:

1. Hoàn tất các khoảng trống còn lại của backend để đủ điều kiện chạy staging/production.
2. Hoàn tất frontend cho toàn bộ API và quy trình backend đã xây dựng.

Mỗi backlog được sắp theo dependency và mức độ ưu tiên thay vì ngày thực hiện. DEV1, DEV2 và AI agent có thể nhận task song song khi task không dùng chung file hoặc contract chưa ổn định.

## Nguyên tắc triển khai

- P0 là điều kiện chặn tích hợp hoặc production; phải xử lý trước P1 và P2 có phụ thuộc.
- Mỗi task tạo một deliverable có thể test và review độc lập.
- Mọi thay đổi chức năng dùng TDD: test fail trước, implementation tối thiểu, test mục tiêu, sau đó regression suite.
- Backend giữ cấu trúc Route → Controller → Service → Model/Provider.
- Frontend chia theo feature, không mở rộng `PortalPage` hoặc tạo page tổng hợp chứa toàn bộ nghiệp vụ.
- API contract dùng kiểu TypeScript chung; frontend không tự đoán field từ response.
- Feature beta bị khóa ở cả navigation, route frontend và API backend.
- AI/OCR chỉ tạo draft; PT duyệt trước khi publish hoặc đánh dấu sử dụng.
- Không cắt RBAC, ownership, validation, audit, backup/rollback hoặc accessibility cơ bản.
- Không tự động commit/push trong lúc thực thi nếu người dùng không yêu cầu.

## Phương án tổ chức đã chọn

Hai kế hoạch chạy song song theo dependency:

- DEV1 ưu tiên hardening backend, contract và môi trường tích hợp.
- DEV2 ưu tiên frontend shell, API client và các feature đã có contract ổn định.
- AI agent hỗ trợ test case, fixture, contract matrix, review diff và regression; không tự duyệt nghiệp vụ.

Không dùng phương án “xong toàn bộ backend mới bắt đầu frontend” vì tạo hàng đợi không cần thiết. Không chia hoàn toàn theo module full-stack vì các hạng mục production hardening cần một owner backend thống nhất.

## Thiết kế kế hoạch Backend

Kế hoạch backend sẽ được sắp theo thứ tự:

1. P0 runtime và đường chạy Node ESM thực tế.
2. P0 chuẩn hóa các route legacy Nutrition/OCR/AI và loại bỏ contract trùng.
3. P0 transaction/idempotency cho các mutation nhiều collection.
4. P0 security hardening: headers, rate limit, upload policy, provider timeout.
5. P1 phủ audit và notification còn thiếu.
6. P1 production adapter cho AI, OCR và vector search; giữ fallback cục bộ có kiểm soát.
7. P1 migration lock, staging backup/restore và smoke test.
8. P1 performance/index review và load test.
9. P2 observability, release artifact và UAT checklist.

Mỗi task phải ghi rõ endpoint bị ảnh hưởng, file tạo/sửa, test ownership/validation, failure mode và lệnh xác minh.

## Thiết kế kế hoạch Frontend

Kế hoạch frontend sẽ được sắp theo dependency:

1. Nền tảng: API client typed, error mapping, query state, feature flags, route guard và shared UI.
2. App shell theo ba role và navigation theo quyền/flag.
3. Core Admin/PT/Customer: user, CRM, gói PT, transfer, hồ sơ và customer portal.
4. InBody/OCR review và Goal/Roadmap.
5. Exercise Library, Workout Template/Builder, check-in và package usage.
6. Body Measurement, Progress Chart và Progress Report publish/view.
7. Nutrition metrics, activities, logs, calculator và AI draft review.
8. Care Workspace, Today queue, Dashboard PT/Admin.
9. Notification Center và Calendar.
10. Knowledge Base, indexing/search và PT Assistant review workflow.
11. Responsive, accessibility, empty/error/loading state và E2E ba role.

Mỗi feature phải có service typed, component/page riêng, route/nav gate, test tương tác, và acceptance case dựa trên API backend hiện có.

## Contract và luồng tích hợp

- Backend là nguồn sự thật cho authorization, ownership, feature flag và trạng thái publish.
- Frontend dùng response envelope `ApiSuccess<T>`, `ApiList<T>` và `ApiFailure`.
- Lỗi 401 xóa session và chuyển về login; 403 hiển thị thông báo quyền/feature; 409 hiển thị conflict nghiệp vụ; 422 hiển thị lỗi theo field; 5xx có retry có chủ đích.
- Các list screen dùng pagination/filter phía server.
- Sau mutation, frontend refresh đúng resource liên quan, không reload toàn trang.
- Mock chỉ dùng trong test; màn hình tích hợp phải gọi API thật.

## Cổng chất lượng

Một task chỉ hoàn tất khi:

- Test mục tiêu pass và đã quan sát trạng thái RED trước implementation.
- Ownership/RBAC và validation liên quan có test.
- Typecheck và lint pass.
- Không tạo warning/error mới trong test output.
- Contract API hoặc UI state thay đổi được ghi trong plan và test.

Một feature frontend chỉ hoàn tất khi:

- Có loading, empty, error và success state.
- Keyboard navigation và label form cơ bản hoạt động.
- Responsive ở mobile, tablet và desktop.
- Feature flag tắt sẽ ẩn navigation và chặn route.
- Không dùng dữ liệu mock ở runtime.

## Điều kiện hoàn tất tổng thể

- Backend: production hardening, provider thật, transaction, migration/backup/restore và smoke/load test có bằng chứng.
- Frontend: tất cả luồng API đã triển khai có UI sử dụng được cho đúng role, có test và feature gate.
- Toàn hệ thống: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` pass; hành trình Admin → PT → Customer pass trên staging.

## Ngoài phạm vi

- Native mobile app.
- Thanh toán trực tuyến hoặc tích hợp cổng thanh toán mới.
- Gửi Zalo/SMS/email nếu chưa có provider và quyết định nghiệp vụ riêng.
- Chẩn đoán y khoa tự động hoặc AI tự publish nội dung.
- Thiết kế lại thương hiệu ngoài những component cần để hoàn thành chức năng.
