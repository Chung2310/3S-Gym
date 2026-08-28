# Quy Tắc Cấu Trúc Code Frontend (Bắt Buộc)

## 1. Phân tầng thư mục — KHÔNG được vi phạm

| Thư mục | Chứa | KHÔNG ĐƯỢC chứa |
|---|---|---|
| `types/` | `interface`, `type`, `enum` | React, JSX, logic |
| `services/` | TS thuần, API calls, thuật toán | JSX, React hooks, DOM |
| `hooks/` | Custom React hooks | JSX rendering, business logic nặng |
| `routes/` | `<Routes>`, `<Route>`, `<Navigate>`, tab routing | Business logic, data fetching, UI rendering |
| `pages/` | State + data fetch + LẮP RÁP components | `<Routes>`, rendering code phức tạp |
| `components/` | Mảnh UI nhỏ, nhận data qua props | API calls trực tiếp, routing |
| `components/ui/` | Primitives dùng chung toàn app | Business logic |
| `tests/` | Tất cả test files | — (KHÔNG đặt test trong `src/`) |

## 2. Routing PHẢI ở `routes/`, KHÔNG ở `pages/`

- `<Routes>`, `<Route>`, `<Navigate>` → `routes/PortalRoutes.tsx`, `routes/AdminRoutes.tsx`
- `App.tsx` import từ `routes/`, KHÔNG import routing từ `pages/`

## 3. Page = BỘ NÃO + LẮP RÁP

- Page quản lý **state + data fetching** rồi **truyền data qua props** cho components
- Page KHÔNG chứa rendering code phức tạp (tables, forms, cards)
- Page chỉ `import` components rồi compose chúng thành trang hoàn chỉnh
- Component = mảnh ghép nhỏ (table, button, modal, filter...)
- Page = bức tranh hoàn chỉnh ghép từ các mảnh

```tsx
// ✅ Page lắp ráp components
export default function CalendarPage({ role }) {
  const [items, setItems] = useState([]);
  const load = useCallback(async () => { ... }, []);
  useEffect(() => { void load(); }, [load]);
  
  return (
    <section>
      <SectionHeader title="Lịch" />
      <CalendarFilter dates={dates} onChange={setDates} />
      <CalendarList items={items} onEdit={setEditing} />
      <Pagination ... />
      <CalendarEventModal ... />
    </section>
  );
}

// ❌ Page chứa rendering code (nhét cả table/form vào page)
export default function CalendarPage({ role }) {
  return (
    <section>
      <div className="filter-bar">        {/* ← tách ra component */}
        <input type="date" ... />
      </div>
      <ul>                                 {/* ← tách ra component */}
        {items.map(item => <li>...</li>)}
      </ul>
    </section>
  );
}
```

## 4. Admin tab views là components, KHÔNG phải pages

- `AdminDashboardPage`, `PtManagementView`, `UserManagementView`... → `components/admin/`
- Chúng render qua `?tab=xxx`, KHÔNG có URL riêng
- `routes/AdminRoutes.tsx` import trực tiếp từ `components/admin/`

## 5. Kiểm Thử Nhanh & Tối Ưu (Targeted Testing)

- **Chỉ test file thay đổi / liên quan**: Khi sửa component hay page nào, chỉ chạy test file tương ứng (ví dụ: `npx vitest run frontend/tests/components/xxx.test.tsx`) để phản hồi ngay lập tức (< 2-3s), **KHÔNG** chạy toàn bộ bộ test mỗi lần thay đổi nhỏ.
- **Typecheck nhanh**: `npx tsc --noEmit` trong thư mục `frontend` để bắt lỗi type nhanh chóng.
- **Toàn bộ test (`npm test`)**: Chỉ chạy khi hoàn thành toàn bộ tính năng lớn hoặc khi được yêu cầu.
- **Vị trí file test**: Tất cả test files phải nằm trong `frontend/tests/` (KHÔNG đặt trong `src/`).

## 6. Chuẩn hóa hiển thị & chọn Học viên

- Hiển thị **Họ tên + SĐT**, KHÔNG hiển thị ObjectId thô
- Dùng `CustomerSelect` cho form chọn học viên

## 7. Placeholder bắt buộc

- Tất cả `<input>`, `<textarea>`, `FormField`, search, filter **PHẢI** có `placeholder` rõ ràng

## 8. Icon Mắt cho Mật khẩu

- Tất cả input password **PHẢI** có nút `Eye`/`EyeOff` toggle
