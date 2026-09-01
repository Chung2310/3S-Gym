# Header Notification Dropdown Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thay mục thông báo ở sidebar bằng icon chuông trên header, mở dropdown xem nhanh và giữ trang xem tất cả.

**Architecture:** Tạo `NotificationBell` độc lập để tải và thao tác thông báo; `AppShell` chỉ đặt component vào header. Tách kiểu dữ liệu và mapping đích đến sang module dùng chung để dropdown và trang đầy đủ có cùng hành vi.

**Tech Stack:** React, TypeScript, React Router, Lucide React, Tailwind CSS v4, API client hiện có.

## Global Constraints

- Giữ route `/portal/notifications` và `NotificationCenter` hiện tại.
- Không bổ sung realtime, polling hoặc thay đổi backend.
- UI mới chỉ dùng Tailwind CSS v4 với class tĩnh và token hiện có.
- Không thêm file test mới vì quy chuẩn frontend chỉ cho phép khi người dùng yêu cầu cụ thể.
- Không commit, push hoặc tạo PR nếu chưa được người dùng cấp quyền.

---

### Task 1: Dùng chung mô hình và điều hướng thông báo

**Files:**
- Create: `frontend/src/components/notifications/notificationModel.ts`
- Modify: `frontend/src/components/notifications/NotificationCenter.tsx`

**Interfaces:**
- Produces: `NotificationItem`, `notificationDestinations`, `notificationDestination(resourceType: string): string | undefined`.
- Consumes: React Router navigation và API hiện có.

- [ ] **Step 1: Tạo module dùng chung**

```ts
export interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  resourceType: string;
  resourceId: string;
  readAt: string | null;
}

export const notificationDestinations: Record<string, string> = {
  calendarEvents: '/portal/calendar',
  progressReports: '/portal/me',
  careTask: '/portal/pt/care',
  careAlert: '/portal/pt/care',
};

export function notificationDestination(resourceType: string) {
  return notificationDestinations[resourceType];
}
```

- [ ] **Step 2: Chuyển `NotificationCenter` sang interface và helper dùng chung**

Thay interface/mapping nội bộ bằng import từ `notificationModel.ts`, giữ nguyên API và hành vi trang.

- [ ] **Step 3: Chạy typecheck/build**

Run: `npm run build`
Expected: exit code 0.

### Task 2: Tạo dropdown thông báo trên header

**Files:**
- Create: `frontend/src/components/notifications/NotificationBell.tsx`

**Interfaces:**
- Consumes: `NotificationItem`, `notificationDestination`, `api`, `useToast`, `errorMessage`, `useNavigate`.
- Produces: React component `NotificationBell` không cần props.

- [ ] **Step 1: Xây dựng tải dữ liệu và badge**

Component gọi `GET /api/notifications?page=1&limit=10` khi mount, tính unread và hiển thị `99+` khi vượt 99.

- [ ] **Step 2: Xây dựng điều khiển dropdown**

Dùng `useRef` và effect để đóng khi click ngoài hoặc nhấn `Escape`; trả focus về nút chuông khi đóng bằng Escape.

- [ ] **Step 3: Xây dựng danh sách và thao tác đọc**

Hiển thị loading/rỗng/lỗi/thử lại. Khi chọn item chưa đọc, gọi `PATCH /api/notifications/:id/read`, cập nhật local state, đóng menu và điều hướng; lỗi dùng toast và giữ menu mở.

- [ ] **Step 4: Thêm nút xem tất cả**

`Link` tới `/portal/notifications`, đóng dropdown khi bấm.

- [ ] **Step 5: Chạy typecheck/build**

Run: `npm run build`
Expected: exit code 0.

### Task 3: Gắn chuông vào header và bỏ sidebar item

**Files:**
- Modify: `frontend/src/components/AppShell.tsx`
- Modify: `frontend/src/config/portalNavigation.ts`

**Interfaces:**
- Consumes: default export `NotificationBell`.
- Produces: Header có nút thông báo; sidebar không còn link thông báo.

- [ ] **Step 1: Render chuông trước thông tin người dùng**

Import và đặt `<NotificationBell />` trong nhóm hành động bên phải header, trước `.portal-header-user`.

- [ ] **Step 2: Bỏ mục thông báo khỏi cấu hình sidebar**

Xóa entry `/portal/notifications` và import `Bell` không còn dùng; route vẫn được giữ trong `PortalPage.tsx`.

- [ ] **Step 3: Kiểm tra responsive và accessibility trong code**

Xác nhận class Tailwind giữ dropdown trong viewport, nút có `aria-haspopup`, `aria-expanded`, nhãn động và focus-visible.

- [ ] **Step 4: Chạy kiểm chứng đầy đủ**

Run: `npm run build`
Expected: exit code 0.

Run: `npm test -- frontend/tests/components/AppShell.test.tsx frontend/tests/components/notifications/NotificationCenter.test.tsx`
Expected: các test liên quan pass.

- [ ] **Step 5: Rà soát diff**

Run: `git diff -- frontend/src/components/AppShell.tsx frontend/src/config/portalNavigation.ts frontend/src/components/notifications`
Expected: chỉ có thay đổi đúng phạm vi thông báo/header, không có thay đổi backend hay realtime.
