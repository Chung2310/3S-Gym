---
name: frontend-development
description: >-
  Hướng dẫn và quy chuẩn phát triển giao diện Frontend trong dự án 3S Gym,
  bao gồm hệ thống design tokens, cấu trúc component tái sử dụng trong components/ui,
  quản lý modal CRUD, tích hợp API và quy tắc tổ chức thư mục kiểm thử.
---

# 3S Gym Frontend — Quy Chuẩn Kiến Trúc & Phát Triển

## 0. Tailwind-first styling policy

1. Tailwind CSS v4 is the required styling system for every new or modified frontend UI. The project uses `@tailwindcss/vite`; do not add another CSS framework.
2. Do not add component-level global CSS, CSS modules, styled-components, or `style={{ ... }}` inline styles. Keep untouched legacy global CSS only until it is explicitly migrated.
3. Reuse theme tokens from `frontend/src/index.css` through utilities such as `bg-primary`, `text-primary`, `font-oswald`, and `font-montserrat`. Add a shared token in `@theme` before introducing a new repeated value.
4. Use complete, statically discoverable Tailwind class strings. Conditional classes must resolve to complete strings so Tailwind can scan them.
5. Include responsive, hover, active, disabled, focus-visible, and motion-reduce states in Tailwind classes for interactive UI.
6. Reusable UI primitives still belong in `frontend/src/components/ui/`; their styling follows the same Tailwind-first rule.

---

## 1. Cấu Trúc Thư Mục — Tổng Quan

```
frontend/
├── src/
│   ├── types/           # Kiểu dữ liệu & Interfaces
│   ├── services/        # Business logic & API (TS thuần, KHÔNG JSX)
│   ├── hooks/           # Custom React Hooks
│   ├── routes/          # Cấu hình Router & Navigation (Route config)
│   ├── pages/           # Trang URL — chứa STATE + DATA FETCHING + LAYOUT
│   │   ├── pt/          # Trang PT: /pt/*
│   │   ├── admin/       # Trang Admin: /admin/*
│   │   ├── customer/    # Trang Customer: /me/*
│   │   └── common/      # Trang dùng chung: /calendar, /notifications
│   ├── components/      # UI Components thuần (KHÔNG state nghiệp vụ)
│   │   ├── ui/          # Primitives dùng chung (Modal, DataList, Pagination...)
│   │   ├── inbody/      # Sub-components InBody (Modal, Form, Chart)
│   │   ├── admin/       # Sub-components Admin (Dashboard, Management Views)
│   │   ├── exercises/   # Sub-components Exercises
│   │   ├── workouts/    # Sub-components Workout Plans
│   │   ├── nutrition/   # Sub-components Nutrition
│   │   ├── roadmap/     # Sub-components Roadmap
│   │   ├── care/        # Sub-components Care & Alerts
│   │   ├── progress/    # Sub-components Progress
│   │   ├── dashboard/   # Sub-components KPI Dashboard
│   │   ├── knowledge/   # Sub-components Knowledge Base
│   │   ├── assistant/   # Sub-components PT Assistant
│   │   ├── calendar/    # Sub-components Calendar
│   │   ├── notifications/  # Sub-components Notifications
│   │   ├── portal/      # Sub-components Portal Views
│   │   ├── customer-portal/ # Sub-components Customer Portal
│   │   └── customers/   # Sub-components Customer Management
│   ├── config/          # Config files (environment, constants)
│   ├── index.css        # Design tokens & global styles
│   ├── App.tsx          # Root component (chỉ wrap Router + Providers)
│   └── main.tsx         # Entry point
└── tests/               # Kiểm thử (TÁCH BIỆT khỏi src/)
    ├── services/        # Unit tests cho services
    ├── components/      # Component tests
    ├── pages/           # Page integration tests
    └── hooks/           # Hook tests
```

---

## 2. QUY TẮC TỪNG THƯ MỤC (BẮT BUỘC)

### 📁 `types/` — Kiểu Dữ Liệu & Interfaces

**Trách nhiệm**: Tập trung toàn bộ định nghĩa TypeScript: Data Models, API Interfaces, Enums, Type aliases.

| ✅ ĐƯỢC PHÉP | ❌ CẤM |
|---|---|
| `interface`, `type`, `enum` | Import React / JSX |
| Export types cho các layer khác | Logic tính toán |
| Re-export qua `types.ts` root | State management |

**Quy tắc cụ thể**:
- Mỗi domain 1 file: `types/inbody.ts`, `types/workout.ts`, `types/api.ts`
- Re-export tập trung qua `src/types.ts`
- **KHÔNG** định nghĩa types/interfaces phức tạp rải rác trong component hay service

**Files hiện tại**: `inbody.ts`, `workout.ts`, `api.ts`

---

### 📁 `services/` — Business Logic & API

**Trách nhiệm**: Logic nghiệp vụ thuần, thuật toán tính toán, API client, session/token management.

| ✅ ĐƯỢC PHÉP | ❌ CẤM |
|---|---|
| TypeScript/JavaScript thuần | JSX (`<div>`, `<span>`...) |
| Import từ `types/` | React Hooks (`useState`, `useEffect`) |
| Hàm thuần (pure functions) | DOM manipulation |
| API calls (`api.get`, `api.post`) | Import từ `components/` |

**Quy tắc cụ thể**:
- Code phải unit-testable mà không cần React
- Không depend vào UI layer
- Import types từ `types/`, KHÔNG tự định nghĩa

**Files hiện tại**: `api.ts`, `session.ts`, `features.ts`, `inbodyAnalytics.ts`, `workoutPlanMapper.ts`

---

### 📁 `hooks/` — Custom React Hooks

**Trách nhiệm**: Hooks tái sử dụng, đóng gói logic React phức tạp.

| ✅ ĐƯỢC PHÉP | ❌ CẤM |
|---|---|
| React Hooks (`useState`, `useEffect`, `useCallback`) | JSX / Rendering |
| Import từ `services/` và `types/` | Import từ `components/` |
| Return state + handlers | Business logic phức tạp (nên để `services/`) |

**Files hiện tại**: `useAsyncResource.ts`

---

### 📁 `routes/` — Cấu Hình Router & Navigation

**Trách nhiệm**: Định nghĩa cấu trúc URL routing — map URL paths → Pages. Chứa `<Routes>`, `<Route>`, `<Navigate>`, tab-based routing.

| ✅ ĐƯỢC PHÉP | ❌ CẤM |
|---|---|
| `<Routes>`, `<Route>`, `<Navigate>` | Business logic, API calls |
| Import Pages từ `pages/` | `useState`, data fetching |
| Import Components layout (AppShell, FeatureRoute) | Render UI trực tiếp (forms, tables, cards) |
| Tab navigation (`useSearchParams`) | Định nghĩa types/interfaces |

**Quy tắc cụ thể**:
- Route file chỉ **MÁP URL → Page**, không xử lý data
- Layout wrappers (AppShell, FeatureRoute) chỉ dùng để bọc Pages
- **KHÔNG** render nội dung UI trực tiếp trong route files
- **KHÔNG** đặt files routing trong `pages/` — routing config PHẢI ở `routes/`

**Files hiện tại**: `PortalRoutes.tsx`, `AdminRoutes.tsx`

**Ví dụ đúng**:
```tsx
// routes/PortalRoutes.tsx — CHỈ map URL → Page
<Route path="pt/inbody" element={
  <FeatureRoute user={user} roles={['PT']} feature="OCR_INBODY">
    <InBodyPage />
  </FeatureRoute>
} />
```

**Ví dụ sai**:
```tsx
// ❌ KHÔNG nhét routing config vào pages/
// ❌ pages/PortalPage.tsx với <Routes><Route>...</Routes>
```

---

### 📁 `pages/` — Trang URL (Lắp ráp Components thành trang hoàn chỉnh)

**Trách nhiệm**: Mỗi file = MỘT TRANG ở MỘT URL. Page là **bộ não** điều phối: quản lý state, fetch data, rồi **LẮP RÁP** các components con thành một trang hoàn chỉnh.

> **QUAN TRỌNG**: Page KHÔNG chứa rendering code (JSX phức tạp) — page chỉ import components rồi compose chúng lại. Toàn bộ rendering UI phải nằm trong `components/`.

| ✅ ĐƯỢC PHÉP | ❌ CẤM |
|---|---|
| `useState`, `useEffect`, `useCallback` | `<Routes>`, `<Route>` (→ `routes/`) |
| API calls (`api.get`, `api.post`...) | Export nhiều components từ 1 file |
| Import + lắp ráp components từ `components/` | Viết rendering code (tables, cards, forms) trực tiếp — phải tách ra component |
| Truyền data xuống components qua props | Cục code >50-80 dòng JSX — signal cần tách component |
| Import logic từ `services/` | — |

**Quy tắc cụ thể**:

1. **Mỗi page = 1 URL**: `InBodyPage.tsx` → `/pt/inbody`, `CalendarPage.tsx` → `/calendar`
2. **Page = BỘ NÃO**: Chứa state management + data fetching + error handling
3. **Page = LẮP RÁP**: Import components nhỏ rồi ghép lại, truyền data qua props
4. **Page KHÔNG export** — Không ai import page ngoại trừ `routes/`
5. **KHÔNG nhét routing** (`<Routes>`, `<Route>`) vào pages — routing thuộc về `routes/`
6. **Admin tab views** dùng `?tab=` → KHÔNG phải pages, là components trong `components/admin/`

**Cấu trúc thư mục**:
```
pages/
├── LandingPage.tsx        # /
├── LoginPage.tsx          # /login
├── ConsultationTool.tsx   # /consultation
├── pt/                    # Trang PT (mỗi file = 1 URL /pt/*)
│   ├── InBodyPage.tsx         # /pt/inbody
│   ├── PtCustomersPage.tsx    # /pt/customers
│   ├── PtDashboardPage.tsx    # /pt/dashboard
│   ├── WorkoutPlansPage.tsx   # /pt/workout-plans
│   ├── ExerciseLibraryPage.tsx# /pt/exercises
│   ├── RoadmapPage.tsx        # /pt/roadmaps
│   ├── ProgressPage.tsx       # /pt/progress
│   ├── NutritionPage.tsx      # /pt/nutrition
│   ├── CarePage.tsx           # /pt/care
│   ├── PtAssistantPage.tsx    # /pt/assistant
│   └── KnowledgeSearchPage.tsx# /pt/knowledge-search
├── admin/                 # Trang Admin
│   └── AdminKnowledgePage.tsx # /admin/knowledge
├── customer/              # Trang Customer
│   └── CustomerPortalPage.tsx # /me/*
└── common/                # Trang dùng chung
    ├── CalendarPage.tsx       # /calendar
    └── NotificationsPage.tsx  # /notifications
```

**Ví dụ đúng** — Page lắp ráp components:
```tsx
// pages/pt/ExerciseLibraryPage.tsx
export default function ExerciseLibraryPage() {
  // === BỘ NÃO: state + data ===
  const [items, setItems] = useState<Exercise[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({...});
  const load = useCallback(async (page = 1) => {
    const result = await api.get<Exercise[]>(`/api/exercises?${query}`);
    setItems(result.data);
  }, [...]);
  useEffect(() => { void load(); }, [load]);

  // === LẮP RÁP: compose components ===
  return (
    <section>
      <SectionHeader title="Thư viện bài tập" />
      <ExerciseFilter muscleGroup={muscleGroup} onFilter={setMuscleGroup} />
      <DataList items={items} columns={columns} />
      <Pagination page={meta.page} onPageChange={load} />
      <ExerciseFormModal open={showForm} onSaved={load} />
    </section>
  );
}
```

**Ví dụ sai** — Page chứa rendering code trực tiếp:
```tsx
// ❌ SAI — nhét rendering logic vào page
export default function ExerciseLibraryPage() {
  return (
    <section>
      <div className="filter-bar">          {/* ← rendering code */}
        <input value={muscleGroup} ... />   {/* ← nên tách ra <ExerciseFilter /> */}
        <select ...>                        {/* ← nên tách ra component */}
          <option>Cơ bản</option>
        </select>
      </div>
      <table>                               {/* ← nên dùng <DataList /> */}
        <tr>...</tr>
      </table>
    </section>
  );
}
```

---

### 📁 `components/` — Mảnh UI Tái Sử Dụng (Ghép vào Page)

**Trách nhiệm**: Các mảnh UI nhỏ, tái sử dụng. Giống như **table, button, modal, filter, form, card, list, chart**. Nhận data qua props, render ra giao diện.

> **NGUYÊN TẮC**: Component = mảnh ghép. Page = bức tranh hoàn chỉnh ghép từ các mảnh.

| ✅ ĐƯỢC PHÉP | ❌ CẤM |
|---|---|
| JSX rendering | Routing (`<Routes>`, `<Route>`) |
| Nhận data qua props | Định nghĩa types phức tạp (→ `types/`) |
| UI state riêng (`open`, `activeTab`, `loading`) | Business logic tính toán (→ `services/`) |
| Event handlers → gọi callback props | — |
| Import từ `components/ui/` | — |

#### `components/ui/` — UI Primitives (dùng chung toàn app)

Các component tái sử dụng ở MỌI nơi:
- `FormModal.tsx`, `ProfileFormModal.tsx` — Modal form chuẩn
- `FormField.tsx` — Input/Select/Textarea chuẩn
- `ConfirmModal.tsx` — Popup xác nhận
- `DataList.tsx` — Bảng responsive
- `FilterBar.tsx` — Thanh lọc
- `Pagination.tsx` — Phân trang
- `StatusBadge.tsx`, `RoleBadge.tsx` — Badge
- `ToastProvider.tsx` — Thông báo Toast
- `CustomerSelect.tsx` — Chọn học viên

#### `components/<feature>/` — Sub-components chuyên biệt

Mảnh UI chuyên biệt cho từng tính năng, được IMPORT bởi pages:
- `components/inbody/` → InBody Modals, Forms, Charts, Review
- `components/admin/` → Admin tab panel views (Dashboard, PT/User Management)
- `components/exercises/` → ExerciseFormModal, ExerciseFilter
- `components/workouts/` → Workout plan sub-components
- `components/calendar/` → CalendarEventModal, CalendarList, CalendarFilter
- `components/assistant/` → ConversationList, SuggestionReview
- `components/knowledge/` → KnowledgeEditor, KnowledgeDocList
- `components/portal/` → Customer/PT tab views
- `components/notifications/` → NotificationList, NotificationItem
- ...

**Lưu ý**: Components trong `components/admin/` (AdminDashboardPage, PtManagementView, UserManagementView...) là **tab panel views** — render qua `?tab=xxx`, không có URL riêng. Import bởi `routes/AdminRoutes.tsx`.



### 📁 `tests/` — Kiểm Thử

**Trách nhiệm**: Chứa toàn bộ test files, phân chia theo layer.

| Thư mục | Test cho |
|---|---|
| `tests/services/` | Unit test services (inbodyAnalytics, workoutPlanMapper) |
| `tests/components/` | Component/Modal tests |
| `tests/pages/` | Page integration tests |
| `tests/hooks/` | Hook tests |

**Quy tắc**:
- **Chỉ test file liên quan/thay đổi**: Khi sửa component hay page nào, chỉ chạy test tương ứng (ví dụ: `npx vitest run frontend/tests/components/xxx.test.tsx`) để phản hồi tức thì (< 2-3s).
- **Typecheck nhanh**: `npx tsc --noEmit` để bắt lỗi type nhanh chóng.
- **TUYỆT ĐỐI KHÔNG** đặt `.test.ts` / `.test.tsx` trong `src/` (tất cả đặt trong `frontend/tests/`).
- Khai báo `// @vitest-environment jsdom` + `import '@testing-library/jest-dom/vitest'` ở đầu file test React.

---

## 3. Quy Tắc UI & Form

### 3.1. Placeholder bắt buộc
- **TẤT CẢ** `<input>`, `<textarea>`, `FormField`, search, filter **PHẢI** có `placeholder` rõ ràng
- Ví dụ: `placeholder="Nhập họ và tên đầy đủ..."`, `placeholder="Ví dụ: 72.5 (kg)"`

### 3.2. Icon Mắt cho Mật khẩu
- **TẤT CẢ** input password **PHẢI** có nút `Eye`/`EyeOff` toggle

### 3.3. Form Thêm/Sửa
- Xây trên `ProfileFormModal` + `FormField`
- Dirty state detection + Escape key + focus trap

### 3.4. Customer Display
- Hiển thị Họ tên + SĐT, **KHÔNG** hiển thị ObjectId thô
- Dùng `CustomerSelect` cho form chọn học viên

---

## 4. Design Tokens

- `--primary-color: #003b70` (Xanh đậm thương hiệu)
- `--secondary-color: #00a4e4` (Xanh sáng tương tác)
- `--accent-color: #ff3366` (Hồng cam điểm nhấn)
- `--bg-color: #f4f8fb` (Nền xám sáng)
- Tiêu đề: `'Oswald', sans-serif` — viết hoa, đậm
- Nội dung: `'Montserrat', sans-serif` — rõ ràng

---

## 5. API Integration

```tsx
const toast = useToast();
try {
  const result = await api.patch(`/api/users/${id}`, payload);
  toast.success(result.message);
  onSaved(result.data);
} catch (error) {
  toast.error(errorMessage(error));
}
```

---

## 6. Luồng Dữ Liệu Chuẩn (Data Flow)

```
URL Request
    ↓
routes/ (PortalRoutes.tsx) — map URL → Page
    ↓
pages/ (InBodyPage.tsx) — useState + useEffect + api.get()
    ↓
services/ (inbodyAnalytics.ts) — tính toán, transform data
    ↓
components/ (InBodyDetailModal.tsx) — render UI từ props
    ↓
components/ui/ (DataList, Pagination) — UI primitives
```

Không bao giờ đi ngược: `components/` KHÔNG gọi `services/` trực tiếp cho business logic — nhận qua props từ `pages/`.
