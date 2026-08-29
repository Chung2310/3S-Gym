# Archived Template Editing and Customer Plan Tab Fix — Implementation Plan

**Goal:** Cho phép sửa giáo án mẫu đã lưu trữ, bỏ giao diện giáo án cũ khỏi menu khách hàng, và bảo đảm tab Giáo án trong chi tiết khách hàng gán đầy đủ bản sao từ giáo án mẫu.

**Architecture:** Giữ nguyên API và màn hình studio hiện có. Nới điều kiện cập nhật template để chấp nhận cả `ACTIVE` và `ARCHIVED`, nhưng không thay đổi trạng thái khi lưu. Luồng gán giáo án chỉ còn nằm trong modal chi tiết khách hàng và tiếp tục dùng snapshot độc lập.

**Tech stack:** Express, Mongoose, React, TypeScript, Vitest, Testing Library.

**Constraints:** Không sửa giáo án mẫu khi chỉnh bản gán cho khách; không tự khôi phục template đã lưu trữ; giữ nguyên các thay đổi chưa commit của người dùng.

---

### Task 1: Cho phép sửa template đã lưu trữ

**Files:**
- Modify: `backend/tests/workoutProgress.test.ts`
- Modify: `backend/routes/workoutTemplates.ts`
- Modify: `frontend/tests/components/workouts/MyWorkoutPlans.test.tsx`
- Modify: `frontend/src/components/workouts/WorkoutTemplateList.tsx`

1. Thêm kiểm thử backend cập nhật template `ARCHIVED` và xác nhận trạng thái vẫn là `ARCHIVED`.
2. Thêm kiểm thử frontend xác nhận template `ARCHIVED` vẫn có nút Sửa.
3. Chạy kiểm thử để xác nhận thất bại đúng nguyên nhân.
4. Bỏ điều kiện chỉ cho phép cập nhật `ACTIVE`; luôn hiển thị Sửa và giữ hành động trạng thái phù hợp.
5. Chạy lại kiểm thử.

### Task 2: Bỏ tab Giáo án cũ ở cấp menu khách hàng

**Files:**
- Modify: `frontend/tests/pages/PortalPage.test.tsx`
- Modify: `frontend/src/components/portal/PortalViews.tsx`

1. Thêm kiểm thử PT không còn thấy tab Giáo án ở thanh điều hướng cấp cao.
2. Chạy kiểm thử để xác nhận thất bại.
3. Gỡ mục `workout-plans` khỏi danh sách tab PT và dọn import không còn dùng.
4. Chạy lại kiểm thử.

### Task 3: Xác nhận snapshot gán cho khách đầy đủ

**Files:**
- Modify: `backend/tests/customerWorkoutPlans.test.ts`
- Review: `backend/services/customerWorkoutPlanService.ts`
- Review: `frontend/src/components/customers/WorkoutTemplatePickerModal.tsx`

1. Mở rộng fixture template với bài đã xếp lịch, bài chưa xếp lịch và buổi tập.
2. Xác nhận API gán sao chép đầy đủ các phần trên và giữ liên kết nguồn/version.
3. Chỉ sửa service hoặc picker nếu kiểm thử phát hiện thiếu dữ liệu.

### Task 4: Kiểm tra hồi quy

**Files:**
- Verify only

1. Chạy các test backend/frontend liên quan.
2. Chạy typecheck, lint và build phù hợp với repository.
3. Báo riêng lỗi tồn tại sẵn nếu không thuộc phạm vi thay đổi.
