---
name: frontend-development
description: >-
  Hướng dẫn và quy chuẩn phát triển giao diện Frontend trong dự án 3S Gym,
  bao gồm hệ thống design tokens, cấu trúc component tái sử dụng trong components/ui,
  quản lý modal CRUD, tích hợp API và quy tắc tổ chức thư mục kiểm thử.
---

## 0. Tailwind-first styling policy

1. Tailwind CSS v4 is the required styling system for every new or modified frontend UI. The project uses `@tailwindcss/vite`; do not add another CSS framework.
2. Do not add component-level global CSS, CSS modules, styled-components, or `style={{ ... }}` inline styles. Keep untouched legacy global CSS only until it is explicitly migrated.
3. Reuse theme tokens from `frontend/src/index.css` through utilities such as `bg-primary`, `text-primary`, `font-oswald`, and `font-montserrat`. Add a shared token in `@theme` before introducing a new repeated value.
4. Use complete, statically discoverable Tailwind class strings. Conditional classes must resolve to complete strings so Tailwind can scan them.
5. Include responsive, hover, active, disabled, focus-visible, and motion-reduce states in Tailwind classes for interactive UI.
6. Reusable UI primitives still belong in `frontend/src/components/ui/`; their styling follows the same Tailwind-first rule.
# 3S Gym Frontend Development Skill & Best Practices

Tài liệu này định nghĩa cấu trúc chuẩn, quy tắc tái sử dụng UI và phong cách lập trình cho phần Frontend của dự án 3S Gym.

---

## 1. Cấu Trúc Thư Mục Chuẩn (Directory Architecture)

Toàn bộ mã nguồn Frontend tuân thủ cấu trúc phân tầng rõ ràng:

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/                    # TOÀN BỘ UI và FORM CRUD TÁI SỬ DỤNG
│   │   │   ├── FormModal.tsx      # Modal form chuẩn với discard confirm & focus trap
│   │   │   ├── ProfileFormModal.tsx
│   │   │   ├── FormField.tsx      # Field input, select, textarea chuẩn kèm label/error
│   │   │   ├── ConfirmModal.tsx   # Popup xác nhận hành động nguy hiểm (xóa/hủy)
│   │   │   ├── RoleBadge.tsx      # Badge vai trò (ADMIN, PT, CUSTOMER)
│   │   │   ├── StatusBadge.tsx    # Badge trạng thái (ACTIVE, LOCKED, DRAFT,...)
│   │   │   ├── DataList.tsx       # Bảng dữ liệu responsive (desktop table / mobile cards)
│   │   │   ├── FilterBar.tsx      # Thanh tìm kiếm & lọc nhanh
│   │   │   ├── Pagination.tsx     # Phân trang
│   │   │   ├── ToastProvider.tsx  # Hệ thống thông báo nổi Toast
│   │   │   ├── UserFormModal.tsx  # Modal thêm/sửa tài khoản người dùng đa năng
│   │   │   ├── PtFormModal.tsx    # Modal hồ sơ PT & upload avatar Cloudinary
│   │   │   ├── CustomerFormModal.tsx
│   │   │   ├── CustomerAccountModal.tsx
│   │   │   ├── PtPackageManagerModal.tsx
│   │   │   ├── TransferFormModal.tsx
│   │   │   ├── FeatureFlagModal.tsx
│   │   │   └── index.ts           # Barrel export
│   │   ├── admin/                 # Quản trị (Dashboard, Quản lý tài khoản, Feature Flags)
│   │   ├── customers/             # Quản lý khách hàng của PT
│   │   ├── workouts/              # Giáo án & bài tập
│   │   ├── exercises/             # Thư viện bài tập
│   │   ├── nutrition/             # Dinh dưỡng & tính toán AI
│   │   ├── inbody/                # Quét OCR InBody
│   │   ├── roadmap/               # Lộ trình huấn luyện
│   │   ├── care/                  # Chăm sóc khách hàng & cảnh báo
│   │   ├── knowledge/             # Kho tri thức & RAG
│   │   ├── assistant/             # Trợ lý AI PT
│   │   ├── calendar/              # Lịch tập & sự kiện
│   │   ├── notifications/         # Trung tâm thông báo
│   │   ├── progress/              # Biểu đồ & báo cáo tiến độ
│   │   ├── dashboard/             # PT Dashboard
│   │   ├── customer-portal/       # Khách hàng cá nhân
│   │   ├── flags/                 # FeatureGate
│   │   ├── portal/                # View tổng hợp Portal
│   │   ├── AppShell.tsx           # Khung layout ứng dụng (Sidebar, Header, Navigation)
│   │   ├── Navbar.tsx             # Thanh điều hướng công khai
│   │   └── PortalNotFound.tsx
│   ├── pages/                     # Trang entry point (PortalPage, LoginPage, LandingPage, ConsultationTool)
│   ├── services/                  # Gọi API, session, feature flags
│   ├── hooks/                     # Custom React hooks (useAsyncResource,...)
│   ├── types/ & types.ts          # TypeScript interfaces & types
│   └── index.css                  # Toàn bộ CSS tokens & styles
└── tests/                         # THƯ MỤC KIỂM THỬ TẬP TRUNG (TÁCH BIỆT KHỎI SRC)
    ├── components/
    ├── pages/
    ├── services/
    └── hooks/
```

---

## 2. Quy Tắc UI & Form Tái Sử Dụng (`components/ui/`)

### Nguyên tắc bắt buộc:
1. **BẮT BUỘC thêm `placeholder` cho TẤT CẢ các trường nhập liệu (Inputs / Textareas)**:
   - **Tất cả** thẻ `<input>`, `<textarea>`, component `FormField`, thanh tìm kiếm (`Search Input`), ô lọc dữ liệu, ô nhập số liệu **PHẢI** có thuộc tính `placeholder="..."` đầy đủ và rõ ràng.
   - **Nội dung placeholder phải mang tính hướng dẫn trực quan (Actionable & Informative)**:
     - Với ô tìm kiếm: `placeholder="Tìm theo tên học viên, SĐT, mã..."`
     - Với trường thông tin: `placeholder="Nhập họ và tên đầy đủ..."`, `placeholder="Nhập số điện thoại (10 số)..."`
     - Với trường số đo / chỉ số: `placeholder="Ví dụ: 72.5 (kg)"`, `placeholder="Ví dụ: 18.5 (%)"`
     - Với ghi chú / mô tả: `placeholder="Nhập ghi chú chi tiết hoặc phác đồ..."`
   - **Tuyệt đối KHÔNG** để input thiếu `placeholder` hoặc để placeholder rỗng/chung chung vô nghĩa.

2. **Mọi thành phần UI dùng chung** (Badges, Buttons, Cards, Inputs, Tables, Modals) **PHẢI** nằm trong `frontend/src/components/ui/`.
3. **Form Thêm mới / Chỉnh sửa**:
   - Xây dựng trên nền `ProfileFormModal` (hoặc `FormModal`) kết hợp với `FormField`.
   - Luôn có cơ chế phát hiện form bẩn (`dirty` state) để hỏi xác nhận khi người dùng vô tình đóng modal lúc đang nhập liệu dang dở.
   - Hỗ trợ phím tắt `Escape`, khóa cuộn trang nền và quản lý focus accessibility.
4. **Upload ảnh / Avatar**:
   - Sử dụng endpoint chuẩn `api.upload('/api/upload/image', formData)` gửi lên Cloudinary.
   - Có preview ảnh đại diện hình tròn, nút xóa ảnh và trạng thái loading khi tải lên.

---

## 3. Hệ Thống Design Tokens & Thẩm Mỹ UI

- **Màu sắc thương hiệu**:
  - `--primary-color: #003b70` (Xanh đậm thương hiệu)
  - `--secondary-color: #00a4e4` (Xanh sáng tương tác)
  - `--accent-color: #ff3366` (Hồng cam điểm nhấn)
  - `--bg-color: #f4f8fb` (Nền xám sáng êm dịu)
- **Typography**:
  - Tiêu đề, số liệu KPI: font `'Oswald', sans-serif`, viết hoa, đậm nét và sắc sảo.
  - Nội dung, nhãn form: font `'Montserrat', sans-serif`, rõ ràng, dễ đọc.
- **Hiệu ứng & Micro-interactions**:
  - Stat cards có hiệu ứng hover nâng nhẹ (`transform: translateY(-2px)` + đổ bóng mềm).
  - Status badges và Role badges có màu sắc chuẩn nghĩa ngữ nghĩa (Xanh lá: Active/Published, Đỏ: Locked/Rejected, Vàng: Pending/Draft).

---

## 4. Tích Hợp API & Quản Lý Lỗi

- Sử dụng `api` client từ `frontend/src/services/api.ts`.
- Luôn hiển thị thông báo lỗi thân thiện qua `useToast()` bằng hàm chuẩn hóa `errorMessage(error)`:
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

---

## 5. Quy Tắc Bỏ Qua Kiểm Thử (Test Bypass Policy)

> [!IMPORTANT]
> **BỎ QUA TOÀN BỘ VIỆC CHẠY TEST TỰ ĐỘNG**:
> - **TUYỆT ĐỐI KHÔNG tự động chạy test (`npm test`, `vitest`, `npx vitest`)** sau các bước code/sửa code trừ khi người dùng yêu cầu cụ thể bằng lời.
> - Ưu tiên kiểm tra nhanh cú pháp / kiểu dữ liệu bằng `npm run typecheck` nếu cần xác thực tính hợp lệ TypeScript.
> - **Chỉ viết thêm file test mới khi người dùng yêu cầu trực tiếp.**
> - Khi viết test:
>   - **KHÔNG** đặt file `.test.ts` / `.test.tsx` chung thư mục với mã nguồn `src/`.
>   - **TẤT CẢ** file test phải đặt trong thư mục `frontend/tests/` theo đúng cấu trúc phân cấp tương ứng.
>   - Khai báo môi trường `// @vitest-environment jsdom` và `import '@testing-library/jest-dom/vitest';` ở đầu file test.

---

## 6. Quy Chuẩn Chọn & Hiển Thị Học Viên (Customer Selection & Display)

1. **Hiển thị học viên trong bảng / danh sách dữ liệu**:
   - **BẮT BUỘC hiển thị Họ tên và Số điện thoại (SĐT)** của học viên (ví dụ: `Nguyễn Văn A` kèm SĐT `0901 234 567`).
   - **TUYỆT ĐỐI KHÔNG hiển thị chuỗi mã ID thô** (như `6a90fa9a406b88dacfa89f8d`) ở các cột bảng cho người dùng nhìn thấy.
2. **Form / Modal chọn học viên**:
   - Sử dụng component `CustomerSelect` từ `components/ui/CustomerSelect` để người dùng tìm kiếm và chọn theo Tên hoặc Số điện thoại.
   - Không bắt người dùng phải nhớ hay gõ mã Customer ID bằng tay.
