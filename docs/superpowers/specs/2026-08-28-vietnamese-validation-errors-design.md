# Thiết kế lỗi validation tiếng Việt cho Backend và Frontend

## Mục tiêu

Backend là nguồn duy nhất chuẩn hóa nội dung lỗi validation bằng tiếng Việt. Mọi frontend sử dụng cùng một error contract, hiển thị được thông báo tổng quát, lỗi chi tiết và lỗi theo từng field mà không tự dịch Joi.

## Error contract

Response validation giữ cấu trúc thống nhất:

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Dữ liệu gửi lên không hợp lệ.",
  "requestId": "request-id",
  "errors": [
    {
      "field": "email",
      "message": "Email không đúng định dạng."
    }
  ]
}
```

- `message` là thông báo tổng quát bằng tiếng Việt.
- `errors` chứa toàn bộ lỗi sau khi Joi chạy với `abortEarly: false`.
- `field` dùng dotted path, gồm cả index mảng, ví dụ `sessions.0.exercises.1.sets`.
- `message` của từng field luôn là tiếng Việt và không để lộ cú pháp hoặc nhãn mặc định của Joi.

## Backend

Middleware validation chịu trách nhiệm chuyển `ValidationErrorItem` của Joi thành contract trên.

Một bộ ánh xạ tập trung dịch các loại lỗi phổ biến như required, empty, type mismatch, min/max, length, email, pattern, enum, unknown field và date format. Schema có thể khai báo message tiếng Việt đặc thù; message đặc thù được ưu tiên trước bản dịch mặc định.

Nếu gặp loại Joi chưa có trong bảng ánh xạ, backend trả thông báo tiếng Việt an toàn dựa trên field thay vì chuyển nguyên message tiếng Anh của Joi.

## Frontend

API client tiếp tục chuyển response lỗi thành `ApiError` và giữ nguyên `errors`.

Các helper dùng chung sẽ:

- ưu tiên thông báo chi tiết trong `ApiError.errors` khi tạo nội dung toast;
- loại bỏ message trùng nhau và ghép nhiều lỗi theo thứ tự backend trả về;
- chuyển `errors` thành map theo dotted field path để form có thể hiển thị inline;
- fallback về `ApiError.message`, lỗi JavaScript thông thường hoặc thông báo chung khi không có field errors.

Các API call hiện đã dùng `errorMessage(error)` sẽ tự động hiển thị lỗi validation tiếng Việt chi tiết. Form cần inline error có thể dùng field-error map mà không tự phân tích response.

## Kiểm thử

Backend test xác nhận:

- nhiều lỗi được trả cùng lúc;
- required, format, enum, number/date và unknown field đều là tiếng Việt;
- dotted path được giữ chính xác;
- schema-specific message được ưu tiên;
- fallback không chứa message Joi tiếng Anh.

Frontend test xác nhận:

- `ApiError` giữ nguyên `errors`;
- toast ưu tiên field messages và loại trùng;
- field-error map hỗ trợ dotted path;
- lỗi không phải validation vẫn dùng fallback hiện tại.

## Phạm vi

Thay đổi áp dụng cho toàn bộ API đang đi qua middleware Joi và lớp API client dùng chung. Không thay đổi status code, `code`, `requestId`, payload thành công hoặc logic nghiệp vụ của form.
