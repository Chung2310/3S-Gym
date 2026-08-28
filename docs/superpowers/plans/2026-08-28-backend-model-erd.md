# Backend Model ERD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tạo một ERD duy nhất, đầy đủ trường và quan hệ của toàn bộ 29 Mongoose model trong backend 3S Gym, xuất dưới dạng SVG và PNG.

**Architecture:** Một script Node không phụ thuộc thư viện ngoài chứa biểu diễn chuẩn hóa của các schema, kiểm tra tính đầy đủ so với `backend/models`, tính bố cục theo vùng nghiệp vụ và sinh SVG. Chrome headless raster hóa chính SVG đó thành PNG để hai đầu ra luôn đồng nhất.

**Tech Stack:** Node.js ESM, SVG 1.1, PowerShell, Chrome headless.

## Global Constraints

- Bao gồm đủ 29 file `backend/models/*.ts` và toàn bộ trường schema, kể cả `createdAt`/`updatedAt` khi bật timestamps.
- Subdocument được hiển thị lồng trong collection cha.
- Đường liền chỉ dùng cho Mongoose `ref`; đường nét đứt chỉ dùng cho tham chiếu mềm có đích rõ ràng.
- Xuất `docs/diagrams/backend-model-erd.svg` và `docs/diagrams/backend-model-erd.png`.
- Không thêm package hoặc thay đổi runtime của ứng dụng.

---

### Task 1: Xây dựng nguồn dữ liệu và bộ sinh SVG

**Files:**
- Create: `scripts/generate-backend-model-erd.mjs`
- Create: `docs/diagrams/backend-model-erd.svg`

**Interfaces:**
- Consumes: các file `backend/models/*.ts` và metadata schema chuẩn hóa khai báo trong script.
- Produces: hàm `validateModels(models, modelFiles, refs)` và file SVG ERD đầy đủ.

- [ ] **Step 1: Khai báo metadata của 29 model**

Mỗi model dùng cấu trúc cố định sau; điền trường từ schema thật, không rút gọn:

```js
{
  name: 'CustomerProfile',
  group: 'CRM',
  fields: [
    { name: '_id', type: 'ObjectId', flags: ['PK'] },
    { name: 'userId', type: 'ObjectId', flags: ['ref User', 'unique', 'sparse'] },
    { name: 'assignedPtId', type: 'ObjectId', flags: ['ref User', 'required', 'index'] },
  ],
}
```

- [ ] **Step 2: Thêm kiểm tra tính đầy đủ trước khi render**

`validateModels` phải ném lỗi khi tên file model và tên model metadata không trùng tập hợp, khi một `ref` không có model đích, hoặc khi metadata có model/trường trùng tên:

```js
function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function validateModels(models, modelFiles, refs) {
  const names = models.map((model) => model.name);
  assert(new Set(names).size === names.length, 'Duplicate model name');
  assert(names.length === 29, `Expected 29 models, received ${names.length}`);
  assert([...names].sort().join('|') === [...modelFiles].sort().join('|'), 'Model metadata differs from backend/models');
  for (const model of models) {
    const fieldNames = model.fields.map((field) => field.name);
    assert(new Set(fieldNames).size === fieldNames.length, `Duplicate field in ${model.name}`);
  }
  for (const ref of refs) assert(names.includes(ref.to), `Unknown ref target: ${ref.to}`);
}
```

- [ ] **Step 3: Sinh SVG khổ ngang lớn**

Script tạo một `<svg>` tự chứa style, marker mũi tên, tiêu đề, chú giải, các card collection và đường nối. Card phải render tên trường, kiểu và flags; đường nối phải có nhãn trường nguồn.

- [ ] **Step 4: Chạy bộ sinh và kiểm tra validation**

Run: `node scripts/generate-backend-model-erd.mjs`

Expected: `Validated 29 models` và `Wrote docs/diagrams/backend-model-erd.svg`, exit code 0.

### Task 2: Raster hóa và kiểm chứng đầu ra

**Files:**
- Create: `docs/diagrams/backend-model-erd.png`
- Modify: `scripts/generate-backend-model-erd.mjs`

**Interfaces:**
- Consumes: `docs/diagrams/backend-model-erd.svg` từ Task 1.
- Produces: PNG độ phân giải cao và báo cáo kiểm tra cuối cùng.

- [ ] **Step 1: Thêm chế độ HTML wrapper cho Chrome**

Script sinh tạm một HTML nền trắng chứa SVG ở kích thước tự nhiên; file tạm chỉ phục vụ raster hóa và phải được xóa sau khi hoàn tất.

- [ ] **Step 2: Raster hóa bằng Chrome headless**

Run:

```powershell
& 'C:\Program Files\Google\Chrome\Application\chrome.exe' --headless --disable-gpu --hide-scrollbars --screenshot='docs\diagrams\backend-model-erd.png' --window-size=7680,4320 'file:///D:/Igen%20Tech/3S%20Gym/docs/diagrams/backend-model-erd.svg'
```

Expected: Chrome báo đã ghi PNG và file có kích thước lớn hơn 100 KB.

- [ ] **Step 3: Kiểm tra cấu trúc SVG và kích thước PNG**

Run:

```powershell
[xml](Get-Content -Raw 'docs\diagrams\backend-model-erd.svg') | Out-Null
$png = [System.Drawing.Image]::FromFile((Resolve-Path 'docs\diagrams\backend-model-erd.png'))
"$($png.Width)x$($png.Height)"
$png.Dispose()
```

Expected: XML parse thành công; PNG có kích thước `7680x4320`.

- [ ] **Step 4: Đối chiếu model và quan hệ**

Run: `node scripts/generate-backend-model-erd.mjs --check`

Expected: báo đủ 29 model, mọi `ref` tìm thấy trong source đều có cạnh trên sơ đồ, không ghi lại file.

### Task 3: Kiểm tra trực quan và bàn giao

**Files:**
- Verify: `docs/diagrams/backend-model-erd.svg`
- Verify: `docs/diagrams/backend-model-erd.png`

**Interfaces:**
- Consumes: hai ảnh đã tạo.
- Produces: xác nhận sơ đồ không bị cắt, chữ đọc được khi phóng to và chú giải đúng với kiểu cạnh.

- [ ] **Step 1: Mở PNG bằng công cụ xem ảnh và kiểm tra bốn góc, vùng trung tâm, chú giải**

- [ ] **Step 2: Xác nhận các nút trung tâm `User` và `CustomerProfile` có đầy đủ cạnh theo vai trò**

- [ ] **Step 3: Chạy kiểm chứng cuối**

Run: `node scripts/generate-backend-model-erd.mjs --check`

Expected: exit code 0, `29 models`, không có ref thiếu hoặc model thừa.
