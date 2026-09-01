# Frontend UAT checklist

## Viewports

- [ ] Mobile 375 px: sidebar drawer, cards thay bảng, modal không tràn viewport.
- [ ] Tablet 768 px: filters xếp dọc hợp lý, action luôn nhìn thấy.
- [ ] Desktop 1280 px: sidebar, bảng, biểu đồ và workspace không có horizontal overflow.

## Journeys

- [ ] Admin: quản lý PT, feature flags, dashboard filters, calendar read/filter, knowledge lifecycle.
- [ ] PT: CRM → OCR review → roadmap → workout/check-in → progress → nutrition → care → assistant.
- [ ] Customer: chỉ thấy published content/report, notifications và link tài nguyên hợp lệ.

## Accessibility and safety

- [ ] Keyboard: Tab bị giữ trong modal; Escape đóng và trả focus.
- [ ] Heading/label rõ nghĩa; SVG chart có accessible name và point labels.
- [ ] Toast dùng live region; action quan trọng không phụ thuộc hover.
- [ ] Feature-disabled/403/error/empty/loading state không làm mất dữ liệu đang hiển thị.
- [ ] AI draft/suggestion luôn yêu cầu PT review; reject không publish/apply.
