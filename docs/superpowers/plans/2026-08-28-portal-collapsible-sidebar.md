# Portal Collapsible Sidebar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm sidebar portal có thể thu về thanh icon 72px trên desktop và ghi nhớ lựa chọn của người dùng.

**Architecture:** `AppShell` giữ riêng trạng thái drawer mobile và trạng thái sidebar desktop, khởi tạo trạng thái desktop an toàn từ `localStorage`. CSS dùng class trạng thái trên `portal-shell` và `portal-sidebar` để đổi grid, ẩn nhãn, căn icon và giữ nguyên breakpoint mobile.

**Tech Stack:** React, TypeScript, React Router, Lucide React, CSS, Web Storage API, Vite.

## Global Constraints

- Sidebar mở rộng rộng 240px; trạng thái thu gọn rộng 72px.
- Chức năng thu gọn chỉ áp dụng trên desktop lớn hơn 800px.
- Drawer mobile, overlay và nút Menu giữ nguyên hành vi hiện tại.
- Trạng thái được ghi nhớ trong trình duyệt; lỗi Web Storage không được làm hỏng render.
- Không thay đổi API, cấu hình điều hướng hay luồng đăng xuất.
- Không thêm test mới khi người dùng chưa yêu cầu theo quy chuẩn frontend của dự án.
- Không tạo commit, worktree hoặc subagent khi người dùng chưa cho phép.

---

### Task 1: Trạng thái và điều khiển sidebar trong AppShell

**Files:**
- Modify: `frontend/src/components/AppShell.tsx`

**Interfaces:**
- Consumes: `window.localStorage`, khóa `3s-portal-sidebar-collapsed`.
- Produces: state `collapsed: boolean`, class `sidebar-collapsed`, nút `.portal-sidebar-toggle` và tên truy cập cho các control chỉ còn icon.

- [ ] **Step 1: Thêm khởi tạo trạng thái an toàn**

Thêm hằng khóa và lazy initializer chỉ chấp nhận chuỗi `"true"`; bọc thao tác storage trong `try/catch` để mặc định `false` khi storage không khả dụng.

- [ ] **Step 2: Đồng bộ lựa chọn**

Thêm handler đảo `collapsed`, cập nhật state ngay và cố ghi giá trị mới vào `localStorage`; lỗi ghi được bỏ qua vì state trong phiên vẫn hoạt động.

- [ ] **Step 3: Gắn trạng thái và nút điều khiển**

Gắn `sidebar-collapsed` lên shell và sidebar, dùng `PanelLeftClose`/`PanelLeftOpen` cho nút có `type="button"`, `aria-label`, `title`, `aria-expanded` và `aria-controls="portal-navigation"`.

- [ ] **Step 4: Giữ tên truy cập khi chỉ còn icon**

Thêm `id="portal-navigation"`, `aria-label` và `title` theo tên mục cho từng link; bọc chữ đăng xuất trong span và đặt nhãn/title cho nút đăng xuất.

### Task 2: Layout và kiểu hiển thị thu gọn

**Files:**
- Modify: `frontend/src/index.css`

**Interfaces:**
- Consumes: `.portal-shell.sidebar-collapsed`, `.portal-sidebar.sidebar-collapsed`, `.portal-sidebar-toggle` từ Task 1.
- Produces: sidebar 72px chỉ còn icon trên desktop và quy tắc vô hiệu hóa biến thể thu gọn trên mobile.

- [ ] **Step 1: Thêm chuyển động layout desktop**

Thêm transition cho `grid-template-columns` của shell và chiều rộng/padding liên quan của sidebar; biến thể thu gọn đổi cột đầu thành `72px`.

- [ ] **Step 2: Tạo nút mũi tên**

Đặt nút tròn sát cạnh phải phía trên sidebar, có màu tương phản, hover/focus rõ ràng và `z-index` đủ để không bị cắt.

- [ ] **Step 3: Thu gọn nội dung sidebar**

Ẩn phần chữ thương hiệu, heading nhóm, nhãn link và chữ trong user card; căn giữa logo/icon/link/logout, giữ active state và vùng bấm tối thiểu 40px.

- [ ] **Step 4: Bảo toàn mobile**

Trong `@media (max-width: 800px)`, buộc shell về `display: block`, sidebar dùng chiều rộng drawer hiện tại, ẩn `.portal-sidebar-toggle`, và bỏ mọi ẩn nhãn/căn icon do trạng thái thu gọn desktop.

### Task 3: Xác minh hồi quy

**Files:**
- Verify: `frontend/src/components/AppShell.tsx`
- Verify: `frontend/src/index.css`

**Interfaces:**
- Consumes: thay đổi từ Task 1 và Task 2.
- Produces: bằng chứng typecheck/build thành công và danh sách kiểm tra giao diện.

- [ ] **Step 1: Chạy kiểm tra tĩnh**

Run: `npm run typecheck`

Expected: exit code 0, không có lỗi TypeScript.

- [ ] **Step 2: Chạy build**

Run: `npm run build`

Expected: exit code 0 và Vite tạo bundle thành công.

- [ ] **Step 3: Rà soát diff giới hạn phạm vi**

Run: `git -c safe.directory='D:/Igen Tech/3S Gym' diff -- frontend/src/components/AppShell.tsx frontend/src/index.css docs/superpowers/specs/2026-08-28-portal-collapsible-sidebar-design.md docs/superpowers/plans/2026-08-28-portal-collapsible-sidebar.md`

Expected: chỉ có thay đổi sidebar portal và hai tài liệu liên quan.

- [ ] **Step 4: Kiểm tra thủ công**

Ở desktop, xác nhận mở/thu, active state, tooltip, điều hướng, đăng xuất và tải lại trang. Ở chiều rộng 800px trở xuống, xác nhận drawer, overlay, nút Menu và nút đóng vẫn hoạt động, không hiển thị nút thu gọn desktop.
