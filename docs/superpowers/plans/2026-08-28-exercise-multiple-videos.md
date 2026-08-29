# Exercise Multiple Videos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cho phép mỗi bài tập có tối đa 20 video có tiêu đề, từ link hoặc file MP4/WebM/MOV tối đa 100 MB.

**Architecture:** Lưu video dưới dạng subdocument `videos` trong Exercise và chuẩn hoá `videoUrl` cũ ở service response. Upload file qua endpoint riêng dùng multer memory storage và Cloudinary video; frontend quản lý danh sách video trong một component form tập trung.

**Tech Stack:** TypeScript, Express, Mongoose, Joi, Multer, Cloudinary, React 19, Vitest, Testing Library.

## Global Constraints

- Tối đa 20 video mỗi bài tập.
- File hỗ trợ MP4, WebM, MOV và tối đa 100 MB mỗi video.
- Mỗi video có `title`, `url`, `source: 'UPLOAD' | 'LINK'`.
- Giữ tương thích dữ liệu `videoUrl` cũ; chưa xoá asset Cloudinary khi bỏ video.
- Không commit, push hoặc tạo PR nếu người dùng chưa yêu cầu.

---

### Task 1: Model, validation và tương thích API bài tập

**Files:**
- Modify: `backend/models/Exercise.ts`
- Modify: `backend/validators/contentValidator.ts`
- Modify: `backend/services/exerciseService.ts`
- Test: `backend/tests/exercises.test.ts`

**Interfaces:**
- Produces: `IExerciseVideo { title: string; url: string; source: 'UPLOAD' | 'LINK' }`, `IExercise.videos`, và response chuẩn hoá từ `videoUrl` cũ.

- [ ] **Step 1: Viết test thất bại** cho create nhiều video, từ chối video thứ 21, và trả fallback từ `videoUrl` cũ bằng Supertest trong `backend/tests/exercises.test.ts`.
- [ ] **Step 2: Chạy RED** bằng `npx vitest run --config vitest.config.ts backend/tests/exercises.test.ts`; kỳ vọng assertion `videos` thất bại hoặc validation chưa từ chối 21 phần tử.
- [ ] **Step 3: Cài đặt tối thiểu**: thêm sub-schema `_id: false`, Joi `array().items(...).max(20)`, và helper `normalizeExerciseVideos` được áp dụng ở create/list/detail/update.
- [ ] **Step 4: Chạy GREEN** cùng lệnh; kỳ vọng toàn bộ test file pass.

### Task 2: Endpoint upload video

**Files:**
- Modify: `backend/validators/uploadValidator.ts`
- Modify: `backend/services/cloudinaryService.ts`
- Modify: `backend/routes/upload.ts`
- Test: `backend/tests/routeValidation.test.ts`

**Interfaces:**
- Produces: `uploadVideo(fileBuffer: Buffer): Promise<UploadApiResponse>` và `POST /api/upload/video` nhận field `video`, trả `{ url, publicId }`.

- [ ] **Step 1: Viết test thất bại** xác nhận endpoint thiếu file và file MIME không hợp lệ trả 400 với field `video`; dùng `.attach('video', Buffer.from('video'), { filename: 'bad.txt', contentType: 'text/plain' })`.
- [ ] **Step 2: Chạy RED** bằng `npx vitest run --config vitest.config.ts backend/tests/routeValidation.test.ts`; kỳ vọng route hiện trả 404.
- [ ] **Step 3: Cài đặt tối thiểu**: multer riêng giới hạn `100 * 1024 * 1024`, validator MIME, Cloudinary `resource_type: 'video'`, folder `3s-gym/exercises/videos`, route xác thực ADMIN/PT và response chuẩn.
- [ ] **Step 4: Chạy GREEN** cùng lệnh; kỳ vọng test validation pass mà không gọi Cloudinary đối với input lỗi.

### Task 3: Form nhiều video

**Files:**
- Create: `frontend/src/components/exercises/ExerciseVideoFields.tsx`
- Modify: `frontend/src/components/exercises/ExerciseFormModal.tsx`
- Test: `frontend/tests/components/exercises/ExerciseLibrary.test.tsx`

**Interfaces:**
- Consumes: `POST /api/upload/video` trả `{ url: string; publicId: string }`.
- Produces: `ExerciseVideo`, trường `Exercise.videos`, callback `onChange(videos)` và `uploading` để chặn lưu.

- [ ] **Step 1: Viết test thất bại** tạo hai video (một LINK, một UPLOAD), mock `api.upload`, kiểm tra upload dùng field `video` và POST bài tập gửi đúng `videos`.
- [ ] **Step 2: Chạy RED** bằng `npx vitest run --config vitest.config.ts frontend/tests/components/exercises/ExerciseLibrary.test.tsx`; kỳ vọng không tìm thấy nút `Thêm video`.
- [ ] **Step 3: Cài đặt tối thiểu**: component thêm/xoá mục, title bắt buộc, lựa chọn nguồn, URL placeholder, file accept `.mp4,.webm,.mov,video/mp4,video/webm,video/quicktime`, kiểm tra 100 MB, upload ngay và báo toast khi lỗi.
- [ ] **Step 4: Nối form**: hydrate `videos`, gửi trong body, dirty bao gồm videos, vô hiệu submit bằng trạng thái loading trong lúc upload.
- [ ] **Step 5: Chạy GREEN** cùng lệnh; kỳ vọng test form pass.

### Task 4: Hiển thị video trong thư viện và hồi quy

**Files:**
- Modify: `frontend/src/components/exercises/ExerciseLibrary.tsx`
- Modify: `frontend/tests/components/exercises/ExerciseLibrary.test.tsx`

**Interfaces:**
- Consumes: `Exercise.videos` đã được backend chuẩn hoá.

- [ ] **Step 1: Viết test thất bại** với fixture có hai video, kiểm tra cột `Video`, số lượng, tiêu đề và link mở tab mới có `rel="noopener noreferrer"`.
- [ ] **Step 2: Chạy RED** bằng test file frontend; kỳ vọng chưa có cột/link.
- [ ] **Step 3: Cài đặt tối thiểu** bằng `render` column tùy biến theo API `DataColumn`, hiển thị `Chưa có` khi rỗng và link tiêu đề khi có.
- [ ] **Step 4: Chạy GREEN** cùng lệnh.
- [ ] **Step 5: Xác minh tổng thể**: chạy `npm run typecheck`, hai test file liên quan, `npm run build`, sau đó rà từng yêu cầu trong đặc tả và `git diff --check`.
