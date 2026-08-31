# Exercise Library Owner Delete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cho phép PT tạo bài tập GLOBAL có chủ sở hữu và chỉ người tạo hoặc Admin được sửa/xóa, đồng thời cung cấp thao tác xóa có xác nhận trong thư viện.

**Architecture:** Backend là nguồn quyết định quyền, lưu `ownerPtId` cho mọi bài do PT tạo và trả `canManage` theo người dùng hiện tại. Frontend chỉ hiển thị thao tác theo `canManage`, dùng `ConfirmModal` và tải lại trang sau khi DELETE thành công.

**Tech Stack:** TypeScript, Express 5, Mongoose 9, React 19, Tailwind CSS 4, Vitest, Supertest, Testing Library.

## Global Constraints

- PT được tạo `PRIVATE` hoặc `GLOBAL`; mọi bài do PT tạo đều lưu `ownerPtId`.
- PT chỉ sửa/xóa bài mình sở hữu; Admin quản lý mọi bài.
- Bài GLOBAL cũ không có chủ sở hữu chỉ Admin quản lý.
- Không migration dữ liệu cũ và không sửa snapshot bài tập trong giáo án/lịch sử tập.
- Backend tiếp tục ghi audit khi tạo, sửa và xóa.
- UI mới/sửa dùng Tailwind utilities; không thêm CSS global, CSS module hoặc inline style.
- Test frontend đặt trong `frontend/tests/`, không đặt trong `src/`.
- Không commit nếu người dùng chưa yêu cầu rõ ràng.

---

### Task 1: Quyền sở hữu và `canManage` ở backend

**Files:**
- Modify: `backend/tests/exercises.test.ts`
- Modify: `backend/services/exerciseService.ts`

**Interfaces:**
- Consumes: `AuthenticatedUser`, `IExercise`, `normalizeExerciseVideos` hiện có.
- Produces: response bài tập có `canManage: boolean`; `create`, `list`, `get`, `update`, `remove` dùng chung quy tắc sở hữu.

- [ ] **Step 1: Viết test thất bại cho PT tạo/quản lý GLOBAL và PT khác bị từ chối**

Thay test cũ cấm PT tạo GLOBAL bằng các assertion sau, đồng thời kiểm tra danh sách của PT khác:

```ts
it('PT owns and manages a global exercise while other PTs can only view it', async () => {
  const created = await request(app).post('/api/exercises').set('Authorization', `Bearer ${ptToken}`).send({
    name: 'Global Row', muscleGroup: 'BACK', level: 'BEGINNER', equipment: [], scope: 'GLOBAL',
  });
  expect(created.status).toBe(201);
  expect(created.body.data).toMatchObject({ scope: 'GLOBAL', canManage: true });
  expect(created.body.data.ownerPtId).toBeTruthy();

  const id = created.body.data._id;
  const otherList = await request(app).get('/api/exercises?muscleGroup=BACK').set('Authorization', `Bearer ${otherPtToken}`);
  expect(otherList.body.data).toEqual(expect.arrayContaining([
    expect.objectContaining({ _id: id, canManage: false }),
  ]));
  expect((await request(app).patch(`/api/exercises/${id}`).set('Authorization', `Bearer ${otherPtToken}`).send({ name: 'Forbidden' })).status).toBe(403);
  expect((await request(app).delete(`/api/exercises/${id}`).set('Authorization', `Bearer ${otherPtToken}`)).status).toBe(403);
  expect((await request(app).patch(`/api/exercises/${id}`).set('Authorization', `Bearer ${ptToken}`).send({ name: 'Global Row Updated' })).status).toBe(200);
  expect((await request(app).delete(`/api/exercises/${id}`).set('Authorization', `Bearer ${ptToken}`)).status).toBe(200);
});
```

Mở rộng test bài GLOBAL legacy và test Admin:

```ts
const legacy = await Exercise.create({ name: 'Legacy Global', muscleGroup: 'LEGACY', level: 'BEGINNER', scope: 'GLOBAL' });
expect((await request(app).patch(`/api/exercises/${legacy.id}`).set('Authorization', `Bearer ${ptToken}`).send({ name: 'No' })).status).toBe(403);
expect((await request(app).delete(`/api/exercises/${legacy.id}`).set('Authorization', `Bearer ${adminToken}`)).status).toBe(200);
```

- [ ] **Step 2: Chạy test để xác nhận RED**

Run: `npx vitest run --config vitest.config.ts backend/tests/exercises.test.ts`

Expected: FAIL vì PT tạo GLOBAL nhận `403` và response chưa có `canManage`.

- [ ] **Step 3: Cài đặt tối thiểu quy tắc quản lý và response theo user**

Trong `exerciseService.ts`, đổi normalizer để nhận user và thêm helper:

```ts
function canManageExercise(user: AuthenticatedUser, exercise: { ownerPtId?: unknown }): boolean {
  return user.role === 'ADMIN' || Boolean(exercise.ownerPtId && String(exercise.ownerPtId) === user.id);
}

function normalizeExerciseVideos(user: AuthenticatedUser, value: unknown): ExerciseResponse & { canManage: boolean } {
  const documentLike = value as { toObject?: () => unknown; id?: unknown };
  const raw = typeof documentLike.toObject === 'function' ? documentLike.toObject() : value;
  const exercise = { ...(raw as Record<string, unknown>) } as ExerciseResponse;
  const id = documentLike.id ?? exercise._id;
  if (id != null) exercise.id = String(id);
  if ((!exercise.videos || exercise.videos.length === 0) && exercise.videoUrl) {
    exercise.videos = [{ title: 'Video hướng dẫn', url: exercise.videoUrl, source: 'LINK' }];
  }
  return { ...exercise, canManage: canManageExercise(user, exercise) };
}
```

Áp dụng helper trong các luồng:

```ts
const scope = payload.scope || (user.role === 'ADMIN' ? 'GLOBAL' : 'PRIVATE');
const exercise = await Exercise.create({
  ...payload,
  scope,
  ownerPtId: user.role === 'PT' ? user.id : undefined,
});
return normalizeExerciseVideos(user, exercise);
```

```ts
if (!canManageExercise(user, exercise)) {
  throw new AppError({ status: 403, code: ERROR_CODES.AUTHORIZATION, message: 'Bạn không có quyền quản lý bài tập này.' });
}
```

Dùng điều kiện trên cho `update` và `remove`; `list`, `get`, `create`, `update` đều gọi `normalizeExerciseVideos(user, value)`. Giữ nguyên bộ protected fields và các lệnh `recordAudit`.

- [ ] **Step 4: Chạy test backend để xác nhận GREEN**

Run: `npx vitest run --config vitest.config.ts backend/tests/exercises.test.ts`

Expected: toàn bộ test trong file PASS.

---

### Task 2: Form tạo gửi phạm vi PRIVATE/GLOBAL

**Files:**
- Modify: `frontend/tests/components/exercises/ExerciseLibrary.test.tsx`
- Modify: `frontend/src/components/exercises/ExerciseFormModal.tsx`

**Interfaces:**
- Consumes: `Exercise.scope`, `api.post`, `api.patch`.
- Produces: `Exercise.canManage: boolean`; form create có select `Phạm vi` và gửi `scope`; edit không gửi thay đổi scope.

- [ ] **Step 1: Viết test thất bại cho phạm vi GLOBAL**

Thêm `canManage: true` vào fixture Squat và thêm test:

```tsx
it('tạo bài tập global theo phạm vi PT đã chọn', async () => {
  const user = userEvent.setup();
  render(<ToastProvider><ExerciseLibraryPage /></ToastProvider>);
  await screen.findAllByText('Squat');
  await user.click(screen.getByRole('button', { name: 'Tạo bài tập' }));
  const dialog = screen.getByRole('dialog', { name: 'Tạo bài tập' });
  await user.type(within(dialog).getByLabelText('Tên bài tập'), 'Global Row');
  await user.type(within(dialog).getByLabelText('Nhóm cơ'), 'BACK');
  await user.selectOptions(within(dialog).getByLabelText('Phạm vi'), 'GLOBAL');
  await user.click(within(dialog).getByRole('button', { name: 'Lưu bài tập' }));
  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/api/exercises', expect.objectContaining({ scope: 'GLOBAL' })));
});
```

- [ ] **Step 2: Chạy test để xác nhận RED**

Run: `npx vitest run --config vitest.config.ts frontend/tests/components/exercises/ExerciseLibrary.test.tsx`

Expected: FAIL vì chưa có select tên `Phạm vi`.

- [ ] **Step 3: Thêm scope vào state và payload tạo**

Mở rộng type/state:

```ts
export interface Exercise {
  [key: string]: unknown;
  _id: string;
  name: string;
  muscleGroup: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  equipment?: string[];
  technique?: string;
  videos?: ExerciseVideo[];
  scope: 'GLOBAL' | 'PRIVATE';
  canManage: boolean;
}
interface ExerciseFormState { name: string; muscleGroup: string; level: Exercise['level']; equipment: string; technique: string; videos: ExerciseVideo[]; scope: Exercise['scope'] }
const emptyForm: ExerciseFormState = { name: '', muscleGroup: '', level: 'BEGINNER', equipment: '', technique: '', videos: [], scope: 'PRIVATE' };
```

Khi mở modal edit, sao chép `scope: exercise.scope`. Render select chỉ khi tạo:

```tsx
{!exercise && <label className="field"><span>Phạm vi</span><select aria-label="Phạm vi" value={form.scope} onChange={(event) => change('scope', event.target.value)}><option value="PRIVATE">Riêng tư</option><option value="GLOBAL">Dùng chung</option></select></label>}
```

Tạo `body` chung không có scope, sau đó chỉ gắn scope ở POST:

```ts
const body = { name: form.name, muscleGroup: form.muscleGroup, level: form.level, equipment: form.equipment.split(',').map((item) => item.trim()).filter(Boolean), technique: form.technique, videos: form.videos };
const result = exercise
  ? await api.patch(`/api/exercises/${exercise._id}`, body)
  : await api.post('/api/exercises', { ...body, scope: form.scope });
```

- [ ] **Step 4: Chạy test frontend để xác nhận GREEN**

Run: `npx vitest run --config vitest.config.ts frontend/tests/components/exercises/ExerciseLibrary.test.tsx`

Expected: các test form PASS.

---

### Task 3: Xóa bài tập có xác nhận và phân trang an toàn

**Files:**
- Modify: `frontend/tests/components/exercises/ExerciseLibrary.test.tsx`
- Modify: `frontend/src/pages/pt/ExerciseLibraryPage.tsx`

**Interfaces:**
- Consumes: `Exercise.canManage`, `ConfirmModal`, `api.delete`, `useToast`.
- Produces: action `Xóa`, xác nhận DELETE, reload trang hiện tại hoặc trang trước.

- [ ] **Step 1: Viết test thất bại cho quyền hiển thị và xác nhận xóa**

Thiết lập `api.delete` trong `beforeEach` và thêm fixture GLOBAL không quản lý được:

```ts
vi.mocked(api.delete).mockReset().mockResolvedValue({ data: null, message: 'Xóa bài tập thành công.' });
```

```tsx
it('chỉ xóa bài có quyền quản lý sau khi xác nhận', async () => {
  const user = userEvent.setup();
  render(<ToastProvider><ExerciseLibraryPage /></ToastProvider>);
  await screen.findAllByText('Squat');
  expect(screen.getByRole('button', { name: 'Xóa Squat' })).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Xóa Squat' }));
  expect(api.delete).not.toHaveBeenCalled();
  const dialog = screen.getByRole('dialog', { name: 'Xóa bài tập' });
  expect(within(dialog).getByText(/Squat/)).toBeVisible();
  await user.click(within(dialog).getByRole('button', { name: 'Xóa bài tập' }));
  await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/api/exercises/squat-1'));
  await waitFor(() => expect(api.get).toHaveBeenLastCalledWith('/api/exercises?page=1&limit=20'));
});
```

Thêm test hủy modal và test fixture trang 2 chỉ có một item, xác nhận lần GET cuối là trang 1 sau khi xóa.

- [ ] **Step 2: Chạy test để xác nhận RED**

Run: `npx vitest run --config vitest.config.ts frontend/tests/components/exercises/ExerciseLibrary.test.tsx`

Expected: FAIL vì chưa có nút `Xóa Squat` và modal.

- [ ] **Step 3: Thêm state, handler và ConfirmModal**

Import `Trash2` và `ConfirmModal`, thêm state:

```ts
const [deleteExercise, setDeleteExercise] = useState<Exercise | null>(null);
const [deleting, setDeleting] = useState(false);
```

Thêm handler:

```ts
const confirmDelete = async () => {
  if (!deleteExercise) return;
  setDeleting(true);
  try {
    const result = await api.delete(`/api/exercises/${deleteExercise._id}`);
    toast.success(result.message);
    const targetPage = items.length === 1 && (meta.page || 1) > 1 ? (meta.page || 1) - 1 : (meta.page || 1);
    setDeleteExercise(null);
    await load(targetPage);
  } catch (error) {
    toast.error(errorMessage(error));
  } finally {
    setDeleting(false);
  }
};
```

Đổi actions sang `canManage`, sử dụng Tailwind utilities cho nhóm nút và trạng thái focus/disabled:

```tsx
renderActions={(item) => item.canManage ? <div className="flex items-center justify-end gap-2">
  <button className="text-button focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" onClick={() => setFormExercise(item)}>Sửa</button>
  <button aria-label={`Xóa ${item.name}`} className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50" onClick={() => setDeleteExercise(item)}><Trash2 size={16} /> Xóa</button>
</div> : null}
```

Render modal cạnh form:

```tsx
<ConfirmModal open={deleteExercise !== null} title="Xóa bài tập" description={deleteExercise ? `Bạn có chắc muốn xóa “${deleteExercise.name}”? Thao tác này không thể hoàn tác.` : undefined} confirmLabel="Xóa bài tập" danger loading={deleting} onClose={() => !deleting && setDeleteExercise(null)} onConfirm={confirmDelete} />
```

- [ ] **Step 4: Chạy test để xác nhận GREEN**

Run: `npx vitest run --config vitest.config.ts frontend/tests/components/exercises/ExerciseLibrary.test.tsx`

Expected: test hiển thị, hủy, xóa, reload và lùi trang đều PASS.

---

### Task 4: Kiểm chứng tích hợp

**Files:**
- Verify: `backend/tests/exercises.test.ts`
- Verify: `frontend/tests/components/exercises/ExerciseLibrary.test.tsx`
- Verify: `backend/services/exerciseService.ts`
- Verify: `frontend/src/components/exercises/ExerciseFormModal.tsx`
- Verify: `frontend/src/pages/pt/ExerciseLibraryPage.tsx`

**Interfaces:**
- Consumes: toàn bộ thay đổi Tasks 1–3.
- Produces: bằng chứng test, typecheck và lint sạch cho feature.

- [ ] **Step 1: Chạy hai test liên quan**

Run: `npx vitest run --config vitest.config.ts backend/tests/exercises.test.ts frontend/tests/components/exercises/ExerciseLibrary.test.tsx`

Expected: tất cả test PASS, không có unhandled error.

- [ ] **Step 2: Chạy typecheck**

Run: `npm run typecheck`

Expected: exit code 0, không có TypeScript error.

- [ ] **Step 3: Chạy lint trên các file thay đổi**

Run: `npx oxlint backend/services/exerciseService.ts backend/tests/exercises.test.ts frontend/src/components/exercises/ExerciseFormModal.tsx frontend/src/pages/pt/ExerciseLibraryPage.tsx frontend/tests/components/exercises/ExerciseLibrary.test.tsx`

Expected: exit code 0, không có lint error.

- [ ] **Step 4: Đối chiếu tiêu chí hoàn thành**

Xác nhận bằng kết quả test rằng PT sở hữu quản lý được GLOBAL, PT khác bị chặn, Admin có toàn quyền, legacy GLOBAL an toàn, form gửi scope, xóa cần xác nhận, lỗi không làm mất dữ liệu và phân trang lùi đúng.
