# Frontend Feature Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hoàn tất UI React cho toàn bộ chức năng backend 3S Wellness đã có, theo đúng role, ownership, feature flag và trạng thái draft/publish.

**Architecture:** Tách `PortalPage` thành feature routes/components; mỗi feature có types, service hook và UI riêng, dùng API client/envelope chung. Không dùng runtime mock; server là nguồn sự thật cho quyền và trạng thái, frontend chịu trách nhiệm route/nav gate cùng loading/empty/error/success state.

**Tech Stack:** React 19, React Router 7, TypeScript strict, Vite 8, Testing Library, Vitest, CSS hiện có, Lucide React.

## Global Constraints

- Làm trong worktree riêng: branch `feature/frontend-wellness-modules`; không sửa `backend/**`, `scripts/**`, `package.json` hoặc lockfile.
- Tiêu thụ API contract hiện tại; nếu phát hiện contract thiếu, ghi issue/contract test cho agent backend, không tự sửa backend trong worktree này.
- Mỗi feature có loading, empty, error, success; form có field error; mutation không reload toàn trang.
- Feature flag tắt phải ẩn navigation và chặn route.
- UI tiếng Việt có dấu; không dùng browser `alert`/`confirm`.
- Responsive mobile/tablet/desktop và keyboard/label cơ bản là điều kiện Done.
- Dùng TDD; commit riêng sau mỗi task.

## Backend Contract Dependencies

Agent frontend vẫn triển khai ngay các contract đã ổn định. Với các mục dưới đây, tạo UI shell/type/test fixture nhưng đánh dấu `BLOCKED_BY_BACKEND`, không dùng mock ở runtime và không tự đoán response:

- Admin feature configuration cần `GET /api/features` trả đủ `enabled`, `roles`, `pilotUserIds`; `/api/features/me` chỉ đủ cho effective gate.
- Customer roadmap cần published roadmap trong `/api/me/content` hoặc endpoint `/api/me/roadmaps`.
- Customer raw progress chart cần `/api/me/progress`; hiện customer chỉ đọc được published `progressReports` qua `/api/me/content`.
- Forgot/reset/first-login/change-password chưa có backend contract; không dựng form gửi API giả.
- Progress photo và consultation/care note CRUD chưa có model/API hoàn chỉnh.
- Nutrition formula edit/history cần endpoint GET current/history; POST hiện tại chỉ đủ tạo version mới.
- Nutrition/OCR mới phải dùng canonical `/api/nutrition/metrics`, `/api/content-drafts/*`, `/api/inbody/ocr`; không mở rộng `/api/nutrition/calculate` hoặc `/api/nutrition/scan-inbody`.

Khi backend chốt một dependency, thêm contract test frontend trước rồi gỡ trạng thái blocked. Các lane Core, Exercise/Workout staff, Progress staff, Care/Dashboard, Notifications/Calendar, Knowledge/Assistant không phải chờ các dependency này.

---

### Task 1: Typed API client, error policy và feature registry

**Priority:** P0

**Files:**
- Modify: `frontend/src/services/api.ts`, `frontend/src/types.ts`
- Create: `frontend/src/types/api.ts`, `frontend/src/services/features.ts`, `frontend/src/hooks/useAsyncResource.ts`, `frontend/src/features/flags/FeatureGate.tsx`
- Test: `frontend/src/services/api.test.ts`, `frontend/src/features/flags/FeatureGate.test.tsx`, `frontend/src/hooks/useAsyncResource.test.tsx`

**Interfaces:**
- Produces: `ApiSuccess<T>`, `ApiList<T>`, `ApiFailure`, `FeatureKey`, `useAsyncResource<T>()`.
- Error policy: 401 clear session/redirect; 403 preserve page and show message; 409 conflict; 422 field errors; 5xx retry action.

- [ ] **Step 1: Viết test RED cho response và lỗi**

```ts
expect(await api.get<Customer[]>('/api/customers')).toMatchObject({ data: [], meta: { page: 1 } });
await expect(api.get('/api/private')).rejects.toMatchObject({ status: 401, code: 'AUTHENTICATION_ERROR' });
```

- [ ] **Step 2: Chạy RED**

Run: `npm test -- frontend/src/services/api.test.ts frontend/src/features/flags/FeatureGate.test.tsx`

Expected: thiếu `code`, feature registry và route gate.

- [ ] **Step 3: Implement contract chung**

```ts
export interface ApiFailure { success: false; message: string; code: string; requestId: string; errors?: FieldError[] }
export type FeatureKey = 'OCR_INBODY' | 'ROADMAP' | 'EXERCISE_LIBRARY' | 'PROGRESS' | 'CARE' | 'DASHBOARD' | 'NUTRITION_AI' | 'KNOWLEDGE_BASE' | 'PT_ASSISTANT';
```

`features.ts` gọi `GET /api/features/me` một lần sau login và cache trong provider/session scope.

- [ ] **Step 4: Xác minh và commit**

Run: `npm test -- frontend/src/services/api.test.ts frontend/src/features/flags/FeatureGate.test.tsx frontend/src/hooks/useAsyncResource.test.tsx && npm run typecheck`

Commit: `feat: add typed api and feature gates`

---

### Task 2: Tách Portal và AppShell theo role/route

**Priority:** P0

**Files:**
- Modify: `frontend/src/App.tsx`, `frontend/src/pages/PortalPage.tsx`, `frontend/src/components/AppShell.tsx`
- Create: `frontend/src/features/admin/AdminRoutes.tsx`, `frontend/src/features/customers/PtRoutes.tsx`, `frontend/src/features/customer-portal/CustomerRoutes.tsx`, `frontend/src/components/FeatureRoute.tsx`
- Test: `frontend/src/pages/PortalPage.test.tsx`, `frontend/src/components/AppShell.test.tsx`, `frontend/src/components/FeatureRoute.test.tsx`

**Interfaces:**
- Routes: `/portal/admin/*`, `/portal/pt/*`, `/portal/me/*`.
- Produces navigation config `{ path, label, roles, feature? }`.

- [ ] **Step 1: Viết route matrix test RED**

```ts
it.each([['ADMIN', '/portal/admin'], ['PT', '/portal/pt/customers'], ['CUSTOMER', '/portal/me']])('routes %s', ...);
expect(screen.queryByText('PT Assistant')).not.toBeInTheDocument();
```

- [ ] **Step 2: Chạy RED**

Run: `npm test -- frontend/src/pages/PortalPage.test.tsx frontend/src/components/FeatureRoute.test.tsx`

- [ ] **Step 3: Tách monolith không đổi hành vi Core**

`PortalPage` chỉ lấy session và chọn role routes; chuyển Admin/PT/Customer view ra feature files. Duy trì tab `/consultation` hiện có bằng route riêng, không copy component.

- [ ] **Step 4: Xác minh và commit**

Run: `npm test -- frontend/src/pages/PortalPage.test.tsx frontend/src/components/AppShell.test.tsx frontend/src/components/FeatureRoute.test.tsx`

Commit: `refactor: split portal into role feature routes`

---

### Task 3: Hoàn thiện Core Admin, CRM, package và transfer

**Priority:** P0

**Files:**
- Create: `frontend/src/features/admin/PtManagementPage.tsx`, `frontend/src/features/admin/AdminDashboardPage.tsx`
- Create: `frontend/src/features/customers/CustomerListPage.tsx`, `frontend/src/features/customers/CustomerDetailPage.tsx`, `frontend/src/features/customers/PackagePanel.tsx`, `frontend/src/features/transfers/TransferWorkspace.tsx`
- Reuse/Modify: `frontend/src/components/PtFormModal.tsx`, `CustomerFormModal.tsx`, `CustomerAccountModal.tsx`, `PtPackageManagerModal.tsx`, `TransferFormModal.tsx`
- Test: `frontend/src/features/customers/CustomerWorkspace.test.tsx`, `frontend/src/features/transfers/TransferWorkspace.test.tsx`, `frontend/src/features/admin/AdminDashboardPage.test.tsx`

**Interfaces:**
- API: `/api/users`, `/api/customers`, `/api/customers/:id/packages`, `/api/transfers`, `/api/dashboard/admin`.

- [ ] **Step 1: Viết interaction tests RED**

```ts
await user.type(screen.getByLabelText('Tìm khách hàng'), 'An');
expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('keyword=An'), expect.anything());
await user.click(screen.getByRole('button', { name: 'Xác nhận nhận khách' }));
expect(screen.getByText('Chuyển PT thành công')).toBeVisible();
```

- [ ] **Step 2: Chạy RED**

Run: `npm test -- frontend/src/features/customers/CustomerWorkspace.test.tsx frontend/src/features/transfers/TransferWorkspace.test.tsx`

- [ ] **Step 3: Implement list/detail/filter/pagination/mutation states**

Admin dashboard truyền `ptId`, `customerStatus`, `fromDate`, `toDate`; hiển thị `sourcePaths` trong vùng “Nguồn dữ liệu”. PT khác không có action trên khách ngoài ownership vì API trả 403 và UI giữ nguyên dữ liệu hiện tại.

- [ ] **Step 4: Xác minh và commit**

Run: `npm test -- frontend/src/features/customers frontend/src/features/transfers frontend/src/features/admin`

Commit: `feat: complete core crm workspaces`

---

### Task 4: InBody, OCR review, Goal và Roadmap

**Priority:** P1

**Files:**
- Create: `frontend/src/features/inbody/InBodyWorkspace.tsx`, `InBodyScanModal.tsx`, `InBodyReviewForm.tsx`
- Create: `frontend/src/features/goals/GoalWorkspace.tsx`
- Create: `frontend/src/features/roadmap/RoadmapWorkspace.tsx`, `RoadmapForm.tsx`, `RoadmapTimeline.tsx`
- Test: `frontend/src/features/inbody/InBodyReviewForm.test.tsx`, `frontend/src/features/roadmap/RoadmapWorkspace.test.tsx`

**Interfaces:**
- API: `/api/inbody`, `/api/inbody/ocr`, `/api/inbody/:id/confirm-ocr`, `/api/goals`, `/api/roadmaps` và publish/unpublish. Customer roadmap phụ thuộc contract nêu ở trên.
- Flags: `OCR_INBODY`, `ROADMAP`.

- [ ] **Step 1: Viết OCR safety test RED**

```ts
await user.upload(fileInput, inBodyImage);
expect(screen.getByText('Cần PT kiểm tra')).toBeVisible();
expect(screen.queryByText('Đã công bố')).not.toBeInTheDocument();
```

Roadmap test phase order, add/remove week, validation trùng order và publish confirmation.

- [ ] **Step 2: Chạy RED**

Run: `npm test -- frontend/src/features/inbody/InBodyReviewForm.test.tsx frontend/src/features/roadmap/RoadmapWorkspace.test.tsx`

- [ ] **Step 3: Implement typed forms và timeline**

Ảnh OCR chỉ preview local, không hiển thị source path/token; confidence thấp có warning; confirm gửi dữ liệu PT đã chỉnh. Roadmap version cũ read-only sau update.

- [ ] **Step 4: Xác minh và commit**

Run: `npm test -- frontend/src/features/inbody frontend/src/features/goals frontend/src/features/roadmap`

Commit: `feat: add reviewed inbody and roadmap ui`

---

### Task 5: Exercise Library, Workout Builder và check-in

**Priority:** P1

**Files:**
- Create: `frontend/src/features/exercises/ExerciseLibrary.tsx`, `ExerciseFormModal.tsx`
- Create: `frontend/src/features/workouts/WorkoutTemplateList.tsx`, `WorkoutBuilder.tsx`, `WorkoutCheckIn.tsx`, `WorkoutSessionHistory.tsx`
- Test: `frontend/src/features/exercises/ExerciseLibrary.test.tsx`, `frontend/src/features/workouts/WorkoutBuilder.test.tsx`, `WorkoutCheckIn.test.tsx`

**Interfaces:**
- API: `/api/exercises`, `/api/workout-templates`, `/api/workout-sessions`, customer packages.
- Flags: `EXERCISE_LIBRARY`, `PROGRESS`.

- [ ] **Step 1: Viết builder/check-in tests RED**

```ts
await user.click(screen.getByRole('button', { name: 'Thêm bài Squat' }));
expect(payload.sessions[0].exercises[0].exerciseId).toBe(squatId);
await user.dblClick(screen.getByRole('button', { name: 'Hoàn tất buổi tập' }));
expect(postCalls).toHaveLength(1);
```

- [ ] **Step 2: Chạy RED**

Run: `npm test -- frontend/src/features/exercises frontend/src/features/workouts`

- [ ] **Step 3: Implement library/builder/version/archive/check-in**

Check-in tạo idempotency key một lần khi mở form và giữ qua retry; sau success refresh session history và package remaining. Template đang ACTIVE không cho xóa; hiển thị conflict 409.

- [ ] **Step 4: Xác minh và commit**

Run: `npm test -- frontend/src/features/exercises frontend/src/features/workouts`

Commit: `feat: add exercise workout and check-in ui`

---

### Task 6: Body Measurement, Progress Chart và Report

**Priority:** P1

**Files:**
- Create: `frontend/src/features/progress/MeasurementForm.tsx`, `ProgressCharts.tsx`, `ProgressReportEditor.tsx`, `ProgressReportList.tsx`
- Modify: `frontend/src/features/customer-portal/CustomerRoutes.tsx`
- Test: `frontend/src/features/progress/ProgressCharts.test.tsx`, `ProgressReportEditor.test.tsx`, `frontend/src/features/customer-portal/CustomerProgress.test.tsx`

**Interfaces:**
- API: `/api/body-measurements`, `/api/progress/:customerId`, `/api/progress-reports`, `/api/me/content`. Customer chỉ render published reports cho tới khi có `/api/me/progress`.

- [ ] **Step 1: Viết chart/report tests RED**

```ts
expect(screen.getByLabelText('Biểu đồ cân nặng')).toHaveTextContent('Không đủ dữ liệu');
await user.click(screen.getByRole('button', { name: 'Công bố báo cáo' }));
expect(screen.getByText('Đã công bố')).toBeVisible();
```

- [ ] **Step 2: Chạy RED**

Run: `npm test -- frontend/src/features/progress frontend/src/features/customer-portal/CustomerProgress.test.tsx`

- [ ] **Step 3: Implement SVG charts và lifecycle report**

Không thêm chart dependency; SVG có accessible name, point labels và empty state. Customer portal chỉ render `progressReports` backend trả về; không suy luận draft ở client.

- [ ] **Step 4: Xác minh và commit**

Run: `npm test -- frontend/src/features/progress frontend/src/features/customer-portal`

Commit: `feat: add progress charts and reports ui`

---

### Task 7: Nutrition workspace và AI draft review

**Priority:** P1

**Files:**
- Create: `frontend/src/features/nutrition/NutritionWorkspace.tsx`, `ActivityCalculator.tsx`, `NutritionLogForm.tsx`, `AiNutritionDraftModal.tsx`
- Test: `frontend/src/features/nutrition/ActivityCalculator.test.tsx`, `NutritionWorkspace.test.tsx`, `AiNutritionDraftModal.test.tsx`

**Interfaces:**
- API: `/api/nutrition/metrics`, `/api/activities`, `/api/nutrition/logs`, `/api/nutrition/logs/summary`, `/api/content-drafts/nutrition`, `/api/nutrition-plans`.
- Flag: `NUTRITION_AI`.

- [ ] **Step 1: Viết calculation/draft tests RED**

```ts
expect(screen.getByText(/MIFFLIN_ST_JEOR v1/)).toBeVisible();
expect(screen.getByText('PT_REVIEW_REQUIRED')).toBeVisible();
expect(screen.queryByRole('button', { name: 'Tự động công bố' })).not.toBeInTheDocument();
```

- [ ] **Step 2: Chạy RED**

Run: `npm test -- frontend/src/features/nutrition`

- [ ] **Step 3: Implement calculator/log/summary/draft edit**

Hiển thị formula version, calorie/macros, manual fallback khi AI lỗi; draft AI phải được copy vào form plan và PT submit riêng, không gọi publish tự động.

- [ ] **Step 4: Xác minh và commit**

Run: `npm test -- frontend/src/features/nutrition`

Commit: `feat: add nutrition metrics logs and ai review ui`

---

### Task 8: Care Workspace và Dashboard PT/Admin

**Priority:** P1

**Files:**
- Create: `frontend/src/features/care/CareWorkspace.tsx`, `CareTodayQueue.tsx`, `CareTaskModal.tsx`, `CareLogPanel.tsx`
- Create: `frontend/src/features/dashboard/PtDashboard.tsx`
- Modify: `frontend/src/features/admin/AdminDashboardPage.tsx`
- Test: `frontend/src/features/care/CareWorkspace.test.tsx`, `frontend/src/features/dashboard/Dashboard.test.tsx`

**Interfaces:**
- API: `/api/care/today`, alerts/tasks/logs/recalculate, `/api/dashboard/pt`, `/api/dashboard/admin`.
- Flags: `CARE`, `DASHBOARD`.

- [ ] **Step 1: Viết Today/score tests RED**

```ts
expect(screen.getByRole('heading', { name: 'Quá hạn' })).toBeVisible();
expect(screen.getByText('INSUFFICIENT_DATA')).toBeVisible();
expect(screen.queryByText(/Hạng #/)).not.toBeInTheDocument();
```

- [ ] **Step 2: Chạy RED**

Run: `npm test -- frontend/src/features/care frontend/src/features/dashboard`

- [ ] **Step 3: Implement queue, resolve/complete và explainability**

Sau complete/resolve refresh Today, logs và dashboard liên quan. Hiển thị `sourcePath`, data status; không xếp hạng khi backend trả rank null.

- [ ] **Step 4: Xác minh và commit**

Run: `npm test -- frontend/src/features/care frontend/src/features/dashboard`

Commit: `feat: add care and explainable dashboards`

---

### Task 9: Notification Center và Calendar

**Priority:** P1

**Files:**
- Create: `frontend/src/features/notifications/NotificationCenter.tsx`
- Create: `frontend/src/features/calendar/InternalCalendar.tsx`, `CalendarEventModal.tsx`
- Test: `frontend/src/features/notifications/NotificationCenter.test.tsx`, `frontend/src/features/calendar/InternalCalendar.test.tsx`

**Interfaces:**
- API: `/api/notifications`, `/api/notifications/:id/read`, CRUD `/api/calendar-events`.

- [ ] **Step 1: Viết unread/calendar tests RED**

```ts
expect(screen.getByLabelText('3 thông báo chưa đọc')).toBeVisible();
await user.click(screen.getByText('Buổi tập chân'));
expect(patchMock).toHaveBeenCalledWith(expect.stringContaining('/read'), {});
```

- [ ] **Step 2: Chạy RED**

Run: `npm test -- frontend/src/features/notifications frontend/src/features/calendar`

- [ ] **Step 3: Implement paginated center và calendar list/grid**

Calendar dùng date inputs và accessible list ở mobile; PT chỉ sửa/xóa event của mình; Admin read/filter theo API. Notification click điều hướng theo `resourceType/resourceId` nếu route tồn tại.

- [ ] **Step 4: Xác minh và commit**

Run: `npm test -- frontend/src/features/notifications frontend/src/features/calendar`

Commit: `feat: add notifications and internal calendar ui`

---

### Task 10: Knowledge Base và PT Assistant

**Priority:** P1

**Files:**
- Create: `frontend/src/features/knowledge/KnowledgeBase.tsx`, `KnowledgeEditor.tsx`, `KnowledgeSearch.tsx`
- Create: `frontend/src/features/assistant/PtAssistant.tsx`, `ConversationList.tsx`, `SuggestionReview.tsx`
- Test: `frontend/src/features/knowledge/KnowledgeBase.test.tsx`, `frontend/src/features/assistant/PtAssistant.test.tsx`

**Interfaces:**
- API: CRUD/publish/unpublish/index/search `/api/knowledge`; conversations/messages; suggestions list/detail/approve/reject/apply.
- Flags: `KNOWLEDGE_BASE`, `PT_ASSISTANT`.

- [ ] **Step 1: Viết safety/citation tests RED**

```ts
expect(screen.getByText('PT_REVIEW_REQUIRED')).toBeVisible();
expect(screen.getByRole('link', { name: citationTitle })).toBeVisible();
expect(screen.getByRole('button', { name: 'Đánh dấu đã sử dụng' })).toBeDisabled();
```

Button apply chỉ enable sau APPROVED; reject không gửi/publish nội dung.

- [ ] **Step 2: Chạy RED**

Run: `npm test -- frontend/src/features/knowledge frontend/src/features/assistant`

- [ ] **Step 3: Implement document lifecycle và conversation workflow**

Index chỉ enable khi PUBLISHED; search hiển thị score/citation. Conversation detail giữ message history; editedContent được hiển thị sau approve; safety warnings luôn visible trước action.

- [ ] **Step 4: Xác minh và commit**

Run: `npm test -- frontend/src/features/knowledge frontend/src/features/assistant`

Commit: `feat: add knowledge and reviewed pt assistant ui`

---

### Task 11: Responsive, accessibility và E2E ba role

**Priority:** P2

**Files:**
- Modify: `frontend/src/App.css`, `frontend/src/index.css`, các feature components có lỗi accessibility
- Create: `frontend/src/tests/fullJourney.ui.test.tsx`, `docs/releases/frontend-uat-checklist.md`
- Test: toàn bộ `frontend/src/**/*.test.tsx`

**Interfaces:**
- Viewports: mobile 375 px, tablet 768 px, desktop 1280 px.
- Journeys: Admin quản lý PT/flag/dashboard; PT CRM → OCR → roadmap → workout → progress → care → assistant; Customer xem published content/report/notification.

- [ ] **Step 1: Viết E2E component journey RED**

```ts
expect(await screen.findByRole('heading', { name: 'Khách hàng của tôi' })).toBeVisible();
await user.click(screen.getByRole('link', { name: 'Chăm sóc' }));
expect(await screen.findByText('Việc cần làm hôm nay')).toBeVisible();
```

Thêm keyboard-only test modal focus trap/restore và feature route blocked.

- [ ] **Step 2: Chạy toàn bộ frontend test RED**

Run: `npm test -- frontend/src`

Expected: chỉ các journey/accessibility chưa hoàn chỉnh fail.

- [ ] **Step 3: Hoàn thiện CSS/state/accessibility**

Không ẩn action quan trọng bằng hover-only; bảng chuyển thành card/list có label ở mobile; modal có heading, Escape, focus restore; toast dùng live region.

- [ ] **Step 4: Quality gate và commit**

Run: `npm test && npm run typecheck && npm run lint && npm run build`

Expected: toàn bộ PASS; không có runtime mock; ba journey pass.

Commit: `test: complete responsive three-role frontend journey`

## Worktree Handoff

```powershell
$baseBranch = git branch --show-current
git worktree add '..\3S-Gym-frontend' -b feature/frontend-wellness-modules $baseBranch
```

Agent frontend chỉ làm plan này. Nếu cần backend contract mới, ghi rõ endpoint/request/response/status vào message cho agent backend; không sửa `backend/**`. Trước merge, resolve thay đổi hiện có trong `frontend/src/App.tsx` và `frontend/src/pages/ConsultationTool.tsx` bằng merge theo feature, không overwrite.
