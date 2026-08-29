# Separate PT Workout Plan Menus Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tách giáo án mẫu của PT và giáo án khách hàng thành hai module menu độc lập, đồng thời giữ luồng gán template qua `templateId` trên URL.

**Architecture:** Hai entry component độc lập thay thế `WorkoutWorkspace`: `MyWorkoutPlans` quản lý builder/template và `CustomerWorkoutPlans` tiếp nhận query string rồi điều phối panel khách hàng. `PortalPage` và `portalNavigation` đăng ký hai route/menu mới, còn route cũ redirect để giữ tương thích.

**Tech Stack:** React 19, React Router 7, TypeScript, Tailwind CSS v4, Vitest, Testing Library.

## Global Constraints

- Chỉ vai trò `PT` và feature `EXERCISE_LIBRARY` được truy cập hai module.
- Không thay đổi API hoặc model backend.
- UI mới hoặc được sửa dùng Tailwind CSS v4 và token trong `frontend/src/index.css`.
- Mọi input/textarea được sửa phải có placeholder hướng dẫn rõ ràng.
- Test frontend đặt trong cấu trúc hiện có; không tạo thêm test backend.
- Không commit nếu người dùng không yêu cầu.

---

### Task 1: Tách module Giáo án của tôi và điều hướng gán

**Files:**
- Create: `frontend/src/components/workouts/MyWorkoutPlans.tsx`
- Create: `frontend/src/components/workouts/MyWorkoutPlans.test.tsx`
- Modify: `frontend/src/components/workouts/WorkoutBuilder.tsx`
- Modify: `frontend/src/components/workouts/WorkoutTemplateList.tsx`

**Interfaces:**
- Consumes: `WorkoutBuilder`, `WorkoutTemplateList`, `WorkoutTemplate._id`, React Router `useNavigate()`.
- Produces: default component `MyWorkoutPlans`; điều hướng `/pt/customer-workout-plans?templateId=<encoded-id>`.

- [ ] **Step 1: Viết test thất bại cho module và thao tác gán**

```tsx
render(
  <MemoryRouter initialEntries={['/pt/my-workout-plans']}>
    <ToastProvider><Routes><Route path="/pt/my-workout-plans" element={<MyWorkoutPlans />} /><Route path="/pt/customer-workout-plans" element={<Location />} /></Routes></ToastProvider>
  </MemoryRouter>,
);
expect(screen.getByRole('heading', { name: 'Giáo án của tôi' })).toBeVisible();
await user.click(await screen.findByRole('button', { name: 'Gán cho khách hàng' }));
expect(screen.getByTestId('location')).toHaveTextContent('/pt/customer-workout-plans?templateId=template-1');
```

- [ ] **Step 2: Chạy test để xác nhận thất bại**

Run: `npx vitest run --config vitest.config.ts frontend/src/components/workouts/MyWorkoutPlans.test.tsx`

Expected: FAIL vì `MyWorkoutPlans.tsx` chưa tồn tại.

- [ ] **Step 3: Cài đặt module tối thiểu và chuẩn hóa các input bị chạm tới**

```tsx
export default function MyWorkoutPlans() {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const [editing, setEditing] = useState<WorkoutTemplate | null>(null);
  const assign = (template: WorkoutTemplate) => navigate(`/pt/customer-workout-plans?templateId=${encodeURIComponent(template._id)}`);
  return <section><header><h1>Giáo án của tôi</h1><p>Xây dựng và tái sử dụng thư viện giáo án riêng của bạn.</p></header><WorkoutBuilder template={editing} onSaved={() => { setEditing(null); setRefreshKey((value) => value + 1); }} /><WorkoutTemplateList refreshKey={refreshKey} onEdit={setEditing} onAssign={assign} /></section>;
}
```

Đổi nhãn action thành `Gán cho khách hàng`; thêm placeholder cụ thể cho tên giáo án, mục tiêu và tên buổi trong `WorkoutBuilder`. Loại bỏ các thuộc tính `style` trong phần header/filter của `WorkoutTemplateList` và thay bằng utility Tailwind tĩnh.

- [ ] **Step 4: Chạy test module**

Run: `npx vitest run --config vitest.config.ts frontend/src/components/workouts/MyWorkoutPlans.test.tsx`

Expected: PASS.

### Task 2: Tách module Giáo án khách hàng và tiếp nhận templateId

**Files:**
- Create: `frontend/src/components/workouts/CustomerWorkoutPlans.tsx`
- Create: `frontend/src/components/workouts/CustomerWorkoutPlans.test.tsx`
- Modify: `frontend/src/components/workouts/CustomerWorkoutPlanPanel.tsx`

**Interfaces:**
- Consumes: `api.get<WorkoutTemplate>(path)`, `workoutTemplateToDraft(template)`, `CustomerWorkoutPlanPanel.initialDraft`, `useSearchParams()`.
- Produces: default component `CustomerWorkoutPlans`; query `templateId` được xóa bằng replace sau cả thành công lẫn lỗi.

- [ ] **Step 1: Viết test thất bại cho tiếp nhận template**

```tsx
vi.mocked(api.get).mockImplementation(async (path) => path === '/api/workout-templates/template-1'
  ? { data: template, message: '' }
  : { data: [], meta: { page: 1, totalPages: 0 }, message: '' });
render(<MemoryRouter initialEntries={['/pt/customer-workout-plans?templateId=template-1']}><ToastProvider><Routes><Route path="/pt/customer-workout-plans" element={<><CustomerWorkoutPlans /><Location /></>} /></Routes></ToastProvider></MemoryRouter>);
expect(await screen.findByLabelText('Tên giáo án')).toHaveValue(template.title);
await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/pt/customer-workout-plans'));
```

Thêm test lỗi với `api.get('/api/workout-templates/missing')` reject; xác nhận toast hiển thị, query được xóa và heading module vẫn còn.

- [ ] **Step 2: Chạy test để xác nhận thất bại**

Run: `npx vitest run --config vitest.config.ts frontend/src/components/workouts/CustomerWorkoutPlans.test.tsx`

Expected: FAIL vì component chưa tồn tại.

- [ ] **Step 3: Cài đặt loader và làm sạch URL**

```tsx
export default function CustomerWorkoutPlans() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [draft, setDraft] = useState<CustomerWorkoutPlanDraft | null>(null);
  const toast = useToast();
  const templateId = searchParams.get('templateId');
  useEffect(() => {
    if (!templateId) return;
    let active = true;
    api.get<WorkoutTemplate>(`/api/workout-templates/${encodeURIComponent(templateId)}`)
      .then(({ data }) => { if (active) setDraft(workoutTemplateToDraft(data)); })
      .catch((error) => { if (active) toast.error(errorMessage(error)); })
      .finally(() => { if (active) setSearchParams({}, { replace: true }); });
    return () => { active = false; };
  }, [templateId, setSearchParams, toast]);
  return <section><header><h1>Giáo án khách hàng</h1><p>Cá nhân hóa và công bố kế hoạch tập cho từng khách hàng.</p></header><CustomerWorkoutPlanPanel initialDraft={draft} onDraftConsumed={() => setDraft(null)} /></section>;
}
```

Thêm placeholder `Nhập mã khách hàng để lọc...` cho filter trong `CustomerWorkoutPlanPanel`.

- [ ] **Step 4: Chạy test module**

Run: `npx vitest run --config vitest.config.ts frontend/src/components/workouts/CustomerWorkoutPlans.test.tsx frontend/src/components/workouts/CustomerWorkoutPlanPanel.test.tsx`

Expected: PASS.

### Task 3: Đăng ký menu, route mới và redirect tương thích

**Files:**
- Modify: `frontend/src/config/portalNavigation.ts`
- Modify: `frontend/src/config/portalNavigation.test.ts`
- Modify: `frontend/src/pages/PortalPage.tsx`
- Modify: `frontend/tests/pages/PortalPage.test.tsx`
- Delete: `frontend/src/components/workouts/WorkoutWorkspace.tsx`
- Delete: `frontend/src/components/workouts/WorkoutWorkspace.test.tsx`

**Interfaces:**
- Consumes: `MyWorkoutPlans`, `CustomerWorkoutPlans`, `FeatureRoute`, `Navigate`.
- Produces: menu paths `/pt/my-workout-plans`, `/pt/customer-workout-plans`; redirects `/pt/workout-plans/*` và `/pt/workouts`.

- [ ] **Step 1: Cập nhật test navigation và route trước**

```ts
expect(items).toEqual(expect.arrayContaining([
  expect.objectContaining({ path: '/pt/my-workout-plans', label: 'Giáo án của tôi', feature: 'EXERCISE_LIBRARY' }),
  expect.objectContaining({ path: '/pt/customer-workout-plans', label: 'Giáo án khách hàng', feature: 'EXERCISE_LIBRARY' }),
]));
expect(items).not.toEqual(expect.arrayContaining([expect.objectContaining({ path: '/pt/workout-plans' })]));
```

Trong `PortalPage.test.tsx`, thêm các case mở hai route mới và case route cũ có `Location` để xác nhận pathname cuối là `/pt/my-workout-plans`.

- [ ] **Step 2: Chạy test để xác nhận thất bại**

Run: `npx vitest run --config vitest.config.ts frontend/src/config/portalNavigation.test.ts frontend/tests/pages/PortalPage.test.tsx`

Expected: FAIL vì menu và route mới chưa được đăng ký.

- [ ] **Step 3: Cài đặt navigation và routes**

```tsx
<Route path="pt/my-workout-plans/*" element={<FeatureRoute user={user} roles={['PT']} feature="EXERCISE_LIBRARY"><MyWorkoutPlans /></FeatureRoute>} />
<Route path="pt/customer-workout-plans/*" element={<FeatureRoute user={user} roles={['PT']} feature="EXERCISE_LIBRARY"><CustomerWorkoutPlans /></FeatureRoute>} />
<Route path="pt/workout-plans/*" element={<Navigate to="/pt/my-workout-plans" replace />} />
<Route path="pt/workouts" element={<Navigate to="/pt/my-workout-plans" replace />} />
```

Thay item menu cũ bằng hai item mới dùng icon phù hợp, cùng section `Vận hành`, role `PT`, feature `EXERCISE_LIBRARY` và `matchChildren: true`. Xóa `WorkoutWorkspace` và test cũ sau khi không còn import.

- [ ] **Step 4: Chạy test route/navigation và toàn bộ test workout liên quan**

Run: `npx vitest run --config vitest.config.ts frontend/src/config/portalNavigation.test.ts frontend/tests/pages/PortalPage.test.tsx frontend/src/components/workouts`

Expected: PASS.

- [ ] **Step 5: Xác minh toàn cục**

Run: `npm run typecheck`

Expected: exit code 0.

Run: `npm run build`

Expected: exit code 0.

Run: `npm test -- --run`

Expected: toàn bộ test pass.
