# Thiết kế Joi validation cho API

## Mục tiêu

Thay các hàm kiểm tra dữ liệu thủ công tại route bằng Joi schema có thể tái sử dụng, trong khi giữ nguyên controller, service, model, phân quyền và cấu trúc response lỗi hiện tại.

## Phạm vi

- Áp dụng cho toàn bộ API có nhận `body`, `params` hoặc `query`.
- Các health check và endpoint không nhận dữ liệu không cần schema rỗng.
- Không thay đổi nghiệp vụ, dữ liệu lưu trữ hoặc response thành công.
- Không đưa validation vào controller hay service.

## Kiến trúc

### Middleware

`backend/middlewares/validate.ts` nhận một schema gồm tối đa ba phần:

```ts
interface RequestValidationSchema {
  body?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
}
```

Middleware validate từng phần có khai báo với các tùy chọn thống nhất:

- `abortEarly: false` để trả tất cả lỗi trong một request.
- `allowUnknown: false` để chặn field không nằm trong hợp đồng API.
- `stripUnknown: false` để không âm thầm bỏ dữ liệu sai.
- `convert: true` để hỗ trợ chuyển đổi query string sang number, boolean hoặc date theo schema.

Sau khi hợp lệ, giá trị đã được Joi chuẩn hóa được gán lại vào `req.body`, `req.params` hoặc `req.query`. Khi không hợp lệ, Joi detail được chuyển thành `ValidationIssue[]` và đưa vào `AppError` với HTTP 400, error code hiện tại và thông báo tiếng Việt `Dữ liệu gửi lên không hợp lệ.`.

### Tổ chức schema

Schema nằm trong `backend/validators/`, chia theo nhóm nghiệp vụ:

```text
backend/validators/
├── commonValidator.ts
├── authValidator.ts
├── userValidator.ts
├── customerValidator.ts
├── contentValidator.ts
├── transferValidator.ts
├── workoutValidator.ts
├── nutritionValidator.ts
├── careValidator.ts
├── operationsValidator.ts
├── knowledgeValidator.ts
└── uploadValidator.ts
```

`commonValidator.ts` cung cấp các schema dùng chung cho MongoDB ObjectId, pagination, email, ngày giờ và các helper tạo schema `params` chứa `id`. Mỗi file nghiệp vụ export schema theo hành động, ví dụ `createCustomerSchema`, `updateCustomerSchema` và `listCustomersSchema`.

Không tạo một file cho từng endpoint vì số lượng file sẽ quá lớn. Không gom tất cả schema vào một file vì khó bảo trì và dễ xung đột khi phát triển song song.

## Quy tắc schema

- Schema create khai báo rõ field bắt buộc và giới hạn giá trị.
- Schema update cho phép các field hợp lệ ở trạng thái optional nhưng yêu cầu `body.min(1)`.
- Các field do hệ thống quản lý như `ptId`, `status`, `publishedAt` và `version` chỉ được phép ở endpoint có nghiệp vụ hỗ trợ chúng.
- Enum phải khớp enum trong model và service.
- MongoDB ObjectId được kiểm tra bằng custom Joi schema dùng `mongoose.isValidObjectId`.
- Khoảng ngày phải kiểm tra cả định dạng và quan hệ bắt đầu/kết thúc khi API có hai mốc thời gian.
- Payload lồng nhau như workout session, exercise, macros và measurements phải có schema con thay vì chỉ kiểm tra có phải mảng/object.
- File upload tiếp tục để Multer xử lý trước; Joi/custom validator kiểm tra `req.file` và metadata sau Multer.
- Không dùng schema rỗng cho endpoint không nhận input.

## Gắn schema vào route

Route chỉ import schema và truyền vào middleware:

```ts
router.post('/', validate(createCustomerSchema), controller.create);
router.patch('/:id', validate(updateCustomerSchema), controller.update);
```

Các inline validator và validator thủ công trong file route được xóa sau khi endpoint tương ứng đã có Joi schema và test thay thế.

## Tương thích lỗi

Response validation giữ nguyên contract:

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Dữ liệu gửi lên không hợp lệ.",
  "errors": [
    {
      "field": "email",
      "message": "Email không hợp lệ."
    }
  ]
}
```

Tên field lồng nhau dùng dạng dấu chấm, ví dụ `sessions.0.exercises.1.sets`. Thông báo Joi mặc định không được trả trực tiếp cho client; mỗi schema hoặc bộ ánh xạ chung phải cung cấp thông báo tiếng Việt.

## Trình tự chuyển đổi

1. Thêm Joi, schema dùng chung và middleware tương thích Joi.
2. Chuyển auth, users và features.
3. Chuyển customers và transfers.
4. Chuyển content resources, roadmaps và exercises.
5. Chuyển workout templates, sessions và progress.
6. Chuyển nutrition, nutrition logs, formulas và activities.
7. Chuyển care, operations, knowledge assistant và content drafts.
8. Chuyển upload và InBody OCR, sau đó xóa kiểu validator thủ công không còn sử dụng.

Mỗi nhóm phải có test đạt trước khi chuyển sang nhóm tiếp theo và tạo một commit độc lập.

## Kiểm thử và tiêu chí hoàn thành

- Unit test middleware cho body, params, query, nhiều lỗi cùng lúc, coercion và field lạ.
- Integration test cho create, update, list và ID không hợp lệ của từng nhóm route.
- Test payload lồng nhau cho workout, nutrition và measurement.
- Test bảo đảm toàn bộ message validation gửi cho client là tiếng Việt.
- Test bảo đảm PATCH body rỗng bị từ chối.
- Kiểm tra tĩnh rằng endpoint nhận input đều gọi `validate()` với Joi schema.
- `npm test`, typecheck, lint và backend production build đều đạt.
- Không còn inline validator thủ công trong `backend/routes/`, ngoại trừ kiểm tra file Multer được đóng gói qua helper chung nếu Joi extension không giúp mã nguồn đơn giản hơn.

## Ngoài phạm vi

- Không sinh OpenAPI từ Joi.
- Không thay Joi bằng Zod hoặc thư viện validation khác.
- Không đổi error code hay cấu trúc response API.
- Không refactor controller, service hoặc model ngoài thay đổi cần thiết để nhận dữ liệu đã được Joi chuẩn hóa.
