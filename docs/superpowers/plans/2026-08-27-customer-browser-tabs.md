# Customer Browser Tabs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chuyển sáu mục chức năng trong khu vực khách hàng PT thành dải tab liền khung giống trình duyệt.

**Architecture:** Giữ nguyên state và data flow của `PtView`; chỉ bổ sung metadata icon, semantic ARIA và hai wrapper trình bày. CSS tạo tab active liền với panel, cuộn ngang trên mobile và không tác động API hoặc route.

**Tech Stack:** React 19, TypeScript, lucide-react, CSS, Vitest, Testing Library.

## Global Constraints

- Không thay đổi API, URL, sidebar hoặc nghiệp vụ hiện tại.
- Có đúng sáu tab cố định: Khách hàng, InBody, Mục tiêu, Giáo án, Dinh dưỡng, Chuyển PT.
- Tab dùng button, có tablist/tabpanel và trạng thái `aria-selected`.
- Mobile cuộn ngang, nhãn không xuống nhiều dòng.
- Không tạo worktree hoặc commit nếu chưa có yêu cầu riêng của người dùng.

---

### Task 1: Browser-style customer feature tabs

**Files:**
- Modify: `frontend/src/features/portal/PortalViews.tsx`
- Modify: `frontend/src/index.css`
- Test: `frontend/src/pages/PortalPage.test.tsx`

**Interfaces:**
- Consumes: state `tab`, `ptTabs`, callback đổi tab và các bộ lọc hiện tại trong `PtView`.
- Produces: tablist `Nội dung khách hàng`, tab IDs `customer-tab-<value>` và panel `customer-tab-panel`.

- [ ] **Step 1: Viết test thất bại cho semantic và hành vi tab**

Thêm test render PT portal, xác nhận sáu tab, `Khách hàng` có `aria-selected="true"`, click `InBody`, sau đó xác nhận `InBody` được chọn và panel tham chiếu đúng tab.

```tsx
const tabs = screen.getAllByRole('tab');
expect(tabs).toHaveLength(6);
expect(screen.getByRole('tab', { name: 'Khách hàng' })).toHaveAttribute('aria-selected', 'true');
await user.click(screen.getByRole('tab', { name: 'InBody' }));
expect(screen.getByRole('tab', { name: 'InBody' })).toHaveAttribute('aria-selected', 'true');
expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'customer-tab-inbody');
```

- [ ] **Step 2: Chạy test và xác nhận RED**

Run:

```bash
npm test -- frontend/src/pages/PortalPage.test.tsx -t "hiển thị nhóm chức năng khách hàng như tab trình duyệt"
```

Expected: FAIL vì chưa có role `tablist`, `tab` và `tabpanel`.

- [ ] **Step 3: Bổ sung metadata icon và semantic tab**

Đổi `ptTabs` thành object chứa `value`, `label`, `icon`. Render:

```tsx
<div className="customer-browser-tabs" role="tablist" aria-label="Nội dung khách hàng">
  {ptTabs.map(({ value, label, icon: Icon }) => (
    <button
      id={`customer-tab-${value}`}
      type="button"
      role="tab"
      aria-selected={tab === value}
      aria-controls="customer-tab-panel"
      className={tab === value ? 'active' : ''}
      onClick={() => selectTab(value)}
    >
      <Icon size={16} aria-hidden="true" />
      <span>{label}</span>
    </button>
  ))}
</div>
<div
  id="customer-tab-panel"
  className="customer-tab-panel"
  role="tabpanel"
  aria-labelledby={`customer-tab-${tab}`}
>
  {/* bộ lọc, danh sách và phân trang hiện tại */}
</div>
```

Modal giữ ngoài `tabpanel`; bộ lọc và danh sách được gom vào panel. Callback `selectTab` giữ toàn bộ reset state hiện tại.

- [ ] **Step 4: Tạo CSS giống tab trình duyệt**

Thay style `.tab-bar` bằng `.customer-browser-tabs` và `.customer-tab-panel`: flex ngang, gap nhỏ, tab bo góc trên, active nền trắng và `margin-bottom: -1px`, panel có border/radius phía dưới. Thêm `overflow-x: auto`, `white-space: nowrap`, `flex-shrink: 0`, focus-visible và responsive mobile.

- [ ] **Step 5: Chạy test mục tiêu và test liên quan**

Run:

```bash
npm test -- frontend/src/pages/PortalPage.test.tsx frontend/src/components/AppShell.test.tsx frontend/src/tests/fullJourney.ui.test.tsx
```

Expected: tất cả test pass.

- [ ] **Step 6: Xác minh toàn dự án**

Run lần lượt:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Expected: test/typecheck/build exit 0; lint không có error (cảnh báo cũ ngoài phạm vi được báo lại).
