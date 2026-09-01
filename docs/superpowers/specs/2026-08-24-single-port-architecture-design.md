# Thiết kế kiến trúc một cổng

Express là HTTP server duy nhất trên `PORT`. Development gắn Vite middleware mode với root `frontend` và HMR; production phục vụ `dist`. Frontend luôn gọi API bằng đường dẫn relative `/api`.

Khởi tạo app phải được `await` trước `listen`: middleware API → API 404 → frontend adapter → error handler. Development không dùng Vite proxy; production SPA fallback không được bắt `/api/*`.

`npm run dev` chạy một process Node. Test xác minh root Vite, thứ tự middleware, static/SPA production và frontend API URL relative.
