# Thiết kế tab trình duyệt cho khu vực quản lý khách hàng

Ngày: 2026-08-27

## Mục tiêu

Thay thanh lựa chọn dạng pill hiện tại trong khu vực quản lý khách hàng của PT bằng dải tab có hình thức và hành vi trực quan giống tab trình duyệt. Thay đổi chỉ tác động cách trình bày; dữ liệu, API và luồng nghiệp vụ hiện tại được giữ nguyên.

## Phạm vi

Dải tab áp dụng cho sáu mục trong `PtView`:

1. Khách hàng.
2. InBody.
3. Mục tiêu.
4. Giáo án.
5. Dinh dưỡng.
6. Chuyển PT.

Không thay đổi sidebar portal, route URL, API hoặc nội dung bảng/form của từng mục.

## Giao diện

- Dải tab nằm ngay phía trên vùng nội dung và liền trực quan với khung nội dung bên dưới.
- Mỗi tab có góc bo phía trên; cạnh dưới vuông hoặc được che để tab đang chọn hòa vào khung nội dung.
- Tab đang chọn dùng nền trắng, chữ xanh đậm, viền nổi bật và nằm trên đường viền của khung nội dung.
- Tab chưa chọn dùng nền xám xanh nhạt, chữ trung tính và có trạng thái hover rõ ràng.
- Các tab có icon phù hợp để dễ nhận diện nhưng nhãn chữ vẫn là nguồn thông tin chính.
- Không dùng nút đóng tab vì đây là nhóm chức năng cố định, không phải tài liệu có thể đóng.
- Trên màn hình hẹp, dải tab cuộn ngang và không ép nhãn xuống nhiều dòng.

## Cấu trúc component

- Giữ state `tab` và danh sách `ptTabs` trong `PortalViews.tsx`.
- Mở rộng metadata của mỗi tab để chứa icon.
- Dùng một wrapper dành riêng cho dải tab, ví dụ `customer-browser-tabs`.
- Dùng một wrapper chung cho phần bộ lọc, danh sách và phân trang bên dưới, ví dụ `customer-tab-panel`, để tạo cảm giác tab gắn với nội dung.
- Khi đổi tab, tiếp tục reset bộ lọc và đóng modal theo hành vi hiện tại.

## Khả năng truy cập

- Wrapper dùng `role="tablist"` và có `aria-label="Nội dung khách hàng"`.
- Mỗi nút dùng `role="tab"`, `aria-selected`, `aria-controls` và ID ổn định.
- Vùng nội dung dùng `role="tabpanel"`, `aria-labelledby` và ID tương ứng.
- Nút tab vẫn sử dụng phần tử `<button type="button">` để hỗ trợ bàn phím và tránh submit ngoài ý muốn.
- Focus ring phải nhìn thấy rõ; màu sắc không phải dấu hiệu duy nhất của tab đang chọn.

## Responsive

- Desktop: dải tab nằm ngang và liền khung nội dung.
- Tablet/mobile: `overflow-x: auto`, tab giữ chiều rộng theo nội dung, hỗ trợ cuộn chạm.
- Không làm thay đổi chiều rộng bảng; bảng tiếp tục dùng hành vi responsive hiện tại.

## Kiểm thử

- Cập nhật test `PortalPage` để xác nhận có `tablist` và sáu tab.
- Xác nhận tab Khách hàng được chọn mặc định.
- Click một tab khác phải cập nhật `aria-selected` và hiển thị đúng nội dung/bộ lọc tương ứng.
- Xác nhận các thao tác popup hiện tại vẫn hoạt động sau khi đổi cấu trúc wrapper.
- Chạy toàn bộ test, typecheck, lint và production build trước khi hoàn tất.

## Ngoài phạm vi

- Mỗi khách hàng thành một tab riêng.
- Ghi nhớ tab qua URL hoặc sau khi tải lại trang.
- Kéo thả để sắp xếp tab.
- Đóng, ghim hoặc mở nhiều tab đồng thời.
