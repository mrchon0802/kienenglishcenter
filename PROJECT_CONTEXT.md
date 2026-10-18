# PROJECT_CONTEXT: Web quản lý trung tâm tiếng Anh

Tài liệu bàn giao cho AI tiếp tục dự án. Người dùng: Tin, lập trình viên độc lập (Next.js, TypeScript, NestJS, MongoDB), làm dự án này cho một người bạn là chủ trung tâm. **Trả lời bằng tiếng Việt**, giao code dạng file/zip để Tin chép vào dự án, Tin sẽ chạy rồi dán log lỗi lại.

Bản thiết kế giao diện (2 trang chủ): https://claude.ai/artifact/VX8qUor9wNU5wKZ77M7Ab4 (`Main.dc.html` = admin, `Student.dc.html` = học sinh).

---

## 1. Mục tiêu và tính năng

Web cho **một trung tâm tiếng Anh** (không đa chi nhánh). Người dùng chính là bạn của Tin, **cũng là giáo viên duy nhất**, có quyền admin.

**Vai trò:** `admin` (giáo viên) và `student`. Không có vai trò phụ huynh riêng (phụ huynh xem qua tài khoản của bé).

**Học sinh:** lớp 1 đến lớp 9, mỗi em có tài khoản để xem tiến độ học, điểm số, học phí.

**Tính năng:**
- Quản lý học sinh theo lớp, điểm danh, bảng điểm, báo cáo học sinh/lớp, dashboard
- **Ưu tiên cao nhất:** ngân hàng câu hỏi, giao bài, **làm bài và tự chấm điểm**. Nội dung bám sách giáo khoa, khoảng 1-2 tuần có một bài kiểm tra
- Học phí **tính theo tháng**, công nợ, doanh thu (admin theo dõi)
- **Đã bỏ:** nhắc học phí qua Zalo

## 2. Tech stack và cấu trúc

- **Frontend (đang làm):** Next.js 16.4.1 (App Router, Turbopack), TypeScript, **CSS Modules**, font Be Vietnam Pro (`next/font`, subset `vietnamese`). Dự kiến dùng Redux Toolkit (RTK Query) khi nối API.
- **Backend (chưa làm):** NestJS + MongoDB. Dự kiến: JWT (cookie httpOnly), phân quyền RBAC, Cloudinary/S3 cho ảnh và âm thanh, BullMQ/cron cho việc định kỳ.
- **Môi trường:** Windows, PowerShell, ổ E:. Dự án bật `cacheComponents: true` và `partialPrefetching: true` trong `next.config.ts`.
- Alias `@/` trỏ tới `src/`.

```
src/
├─ app/
│  ├─ layout.tsx, globals.css, page.tsx
│  └─ admin/
│     ├─ layout.tsx (AdminSidebar + main), page.tsx (dashboard)
│     ├─ students/        page, new/, [id]/, _components/{StudentsView,StudentTable,StudentForm}
│     ├─ classes/         page, [id]/, [id]/attendance/[sessionId]/, _components/{ClassTable,ClassStudentsTable,SessionList,AttendanceSheet}
│     ├─ question-bank/   page, new/, [id]/edit/, _components/QuestionBankView
│     └─ assignments/, gradebook/, tuition/, reports/   (mới là trang "đang xây dựng")
├─ components/
│  ├─ ui/         Button, Badge, Card, Table, Input, Select, Textarea, Pagination, EmptyState
│  ├─ layout/     AdminSidebar (client), PageHeader
│  ├─ dashboard/  StatCard, SummaryStats, TodoList, ScheduleList, ProgressBar, ClassScoreBars,
│  │              RecentAssignmentsTable, AttentionList, BarChart, RevenueChart
│  └─ question-editor/  QuestionEditor, QuestionPreview, MediaFields, editors/ (7 dạng câu + AnswerEditor)
├─ mocks/    dashboard.ts, students.ts, classes.ts, questions.ts   (dữ liệu mẫu)
├─ types/    dashboard.ts, student.ts, class.ts, question.ts
├─ lib/      format.ts, format-date.ts, schedule.ts, text.ts, constants.ts, question-types.ts
└─ styles/   tokens.css
```

## 3. Quyết định thiết kế đã chốt (kèm lý do)

- **Làm frontend trước với dữ liệu mẫu**, mỗi hàm lấy dữ liệu là `async getX()` trong `src/mocks/` để sau này thay bằng API mà không sửa trang. Kiểu dữ liệu trong `types/` chính là "hợp đồng" backend phải theo.
- **Chấm điểm chỉ ở server.** Frontend gửi câu trả lời, không bao giờ nhận đáp án đúng. Cần một kiểu `QuestionForStudent` (không có đáp án), chưa tạo. `Question` hiện tại chỉ dùng cho admin.
- **Ngân hàng câu hỏi:** phân loại lớp, sách, unit, kỹ năng, độ khó. **Lưu trữ thay vì xóa** (câu đã dùng trong bài không được mất). 7 dạng: `mcq`, `multi`, `truefalse`, `fillblank`, `matching`, `ordering`, `essay`. Ảnh/âm thanh gắn được vào **mọi** dạng (câu nghe = trắc nghiệm kèm audio). Điền chỗ trống: 1 chỗ trống (`___`), nhiều đáp án chấp nhận, bỏ qua hoa/thường và khoảng trắng thừa. Kiểu `Question` đang là **dạng phẳng** (mọi trường), backend có thể lưu dạng union nhưng giữ nguyên tên trường.
- **Hai loại bài (ĐỀ XUẤT, CHƯA được bạn của Tin xác nhận):**
  - *Bài luyện tập:* làm lại không giới hạn, lưu điểm cao nhất, không tính điểm chính thức, nộp trễ vẫn cho (gắn nhãn, không tự trừ điểm), hiện đáp án ngay.
  - *Bài kiểm tra:* làm 1 lần, có đếm ngược, điểm chính thức, khóa sau hạn (giáo viên mở lại riêng từng em), hiện đáp án sau hạn của cả lớp.
- **Khi giao bài, lưu bản sao nội dung câu hỏi vào bài** để sửa ngân hàng sau không đổi điểm cũ. Tạo bài: chọn tay hoặc rút ngẫu nhiên theo unit/số câu/độ khó. *(Chưa làm.)*
- **Giao diện cho trẻ lớp 1-9:** nút lớn (cao tối thiểu 44px), dạng câu hỏi chạm/kéo thả cho lớp nhỏ, dùng được trên điện thoại. Tài khoản học sinh: tên đăng nhập là mã học sinh, mật khẩu giáo viên cấp, chỉ lưu thông tin cần thiết.
- **Học phí:** hóa đơn theo (học sinh, tháng), cho thanh toán một phần.
- **Next.js 16 / Cache Components:** Server Component là mặc định, `"use client"` chỉ khi cần tương tác. `page.tsx` mỏng (chỉ ghép component). Trang có `params` động phải bọc trong `<Suspense>`. Không dùng `searchParams`, bộ lọc nằm trong state client (tải lại trang mất bộ lọc, chấp nhận tạm). Dùng `proxy.ts`, **không dùng `middleware.ts`** (đã bị deprecated).
- Dữ liệu mẫu **phải xác định** (không random, không `Date.now()` lúc render) để tránh lệch server/client.

## 4. Đã làm xong (chưa xác nhận đã chạy ổn hết)

Giao qua 4 gói zip, Tin đã chép gói 1-3, **gói 4 chưa có phản hồi**:
1. **Trang chủ admin** (dashboard): menu, 4 ô số liệu, việc cần xử lý, lịch dạy, bài gần đây, điểm TB theo lớp, học sinh cần chú ý, doanh thu 6 tháng. Tin xác nhận đã chạy.
2. **Học sinh:** danh sách (tìm không dấu, lọc lớp/trạng thái, phân trang 10/trang), form thêm (kiểm tra dữ liệu), hồ sơ `[id]`. 6 trang tạm cho các mục menu còn lại.
3. **Lớp học:** danh sách lớp, chi tiết lớp (học sinh, 6 buổi gần nhất), màn hình điểm danh (3 trạng thái: có mặt/vắng/có phép, nút "tất cả có mặt").
4. **Ngân hàng câu hỏi:** danh sách + lọc + lưu trữ/khôi phục; trình soạn 7 dạng câu kèm xem trước; sau khi lưu câu mới, form làm trống nhưng giữ phần phân loại.
5. **Thiết kế:** mockup trang chủ học sinh (chỉ là thiết kế, **chưa code**).

Mọi form/nút lưu hiện **chưa lưu thật**, chỗ gọi API đánh dấu `// TODO (khi có backend)`.

## 5. Đang dở và lỗi chưa xác nhận đã fix

- **`usePathname()` ngoài Suspense** (lỗi log của Next 16 trên route động như `/admin/classes/[id]`, sẽ làm hỏng `next build`). Cách sửa đã đưa: bọc `<AdminSidebar />` trong `<Suspense fallback={<div className={styles.sidebarFallback} />}>` ở `app/admin/layout.tsx`, thêm `.sidebarFallback` vào `layout.module.css`. **Chưa biết Tin đã áp dụng chưa.**
- **Tên thư mục viết hoa lệch:** thư mục thực tế `components/layout/AdminSideBar` nhưng import là `AdminSidebar`. Chạy trên Windows được, **sẽ lỗi khi deploy Linux/Vercel**. Cần đổi tên (qua tên tạm).
- **CSS Modules từng không áp dụng** vì `next.config.ts` có khối `turbopack.rules["*.css"]` dùng `@tailwindcss/turbopack`. Cách sửa: xóa khối đó. Tin định **gỡ Tailwind** (dự án tạo sẵn Tailwind, code không dùng nó), chưa rõ đã gỡ xong chưa.
- **Lớp `.sr-only`** phải có trong `app/globals.css` (gói lớp học và ngân hàng câu hỏi cần), cần xác nhận đã thêm.
- `/` bị chuyển hướng hai nơi (`redirects()` trong `next.config.ts` và `app/page.tsx`), nên giữ một.
- Dữ liệu mẫu chưa khớp giữa các trang (dashboard ghi lớp 3A có 18 em, mock học sinh chỉ có 24 em), nút "Điểm danh" ở dashboard còn trỏ `/admin/classes` chung.
- Tin từng tạo sẵn file rỗng (`middleware.ts`, `not-found.tsx`, CSS rỗng) gây lỗi, nếu gặp lỗi "no exports" thì kiểm tra file rỗng.

## 6. Các bước tiếp theo (theo thứ tự)

1. Xác nhận các mục ở phần 5, chạy thử gói ngân hàng câu hỏi, sửa lỗi nếu có.
2. **Tạo bài tập/bài kiểm tra từ ngân hàng** (`/admin/assignments`): chọn tay hoặc rút ngẫu nhiên, hạn nộp, thời lượng, số lần làm, lưu bản sao câu hỏi.
3. **Khu vực học sinh** `/student`: layout (menu ngang), trang chủ (đã có thiết kế), danh sách bài, **màn hình làm bài** (renderer cho từng dạng câu, đếm ngược, lưu nháp, chống nộp trùng), trang kết quả. Tạo `QuestionForStudent`, một hàm chấm giả (mock) dùng tạm.
4. Bảng điểm, **học phí** (hóa đơn theo tháng, thanh toán, công nợ, doanh thu), dashboard và báo cáo dùng dữ liệu thật hơn.
5. Còn thiếu của giai đoạn 1: thêm/sửa lớp, ghi danh/chuyển lớp, import học sinh và câu hỏi từ Excel, upload ảnh/audio.
6. Cho bạn của Tin dùng thử (một lớp thật) sau bước 3, thu phản hồi: các trường học sinh có đủ không, 7 dạng câu có đủ không, quy tắc làm lại/nộp trễ có đúng ý không.
7. Chuyển sang **backend**: chốt hợp đồng API, MSW (tùy chọn), NestJS + MongoDB làm từng module rồi tắt mock từng phần, xác thực/phân quyền, `proxy.ts`, job định kỳ (sinh hóa đơn tháng, giao bài), sao lưu DB.

## 7. Quy ước code

- **Ngôn ngữ:** giao diện và comment bằng tiếng Việt, tên biến/hàm/file bằng tiếng Anh. Số kiểu Việt Nam (`48.500.000 đ`, điểm `7,2`), ngày `dd/mm/yyyy`.
- **Component:** mỗi component một thư mục gồm `Name.tsx`, `Name.module.css`, `index.ts` (re-export); dùng named export. Component dùng riêng cho một route nằm trong `_components/` của route đó; dùng chung thì lên `src/components/`.
- **Component chỉ nhận props**, không tự gọi API; trang (`page.tsx`) lấy dữ liệu và ghép. Route slug tiếng Anh: `students`, `classes`, `question-bank`, `assignments`, `gradebook`, `tuition`, `reports`.
- **CSS:** CSS Modules + biến trong `styles/tokens.css` (`--color-*`, `--space-*`, `--radius-*`, `--touch-target: 44px`), hạn chế viết màu cứng (riêng màu lỗi `#b42318`). Palette admin: teal `#0f766e`, menu `#123b38`, nền `#f4f6f2`, cam cảnh báo `#e8a33d`. Trang học sinh (thiết kế): xanh `#1D4ED8`, font Nunito.
- **Trợ năng:** mọi ô nhập có `label`, thông báo dùng `role="status"`/`role="alert"`, chữ chỉ cho trình đọc màn hình dùng `.sr-only`, vùng chạm tối thiểu 44px, có `:focus-visible`.
- **Dữ liệu:** kiểu trong `src/types/*.ts`, dữ liệu mẫu trong `src/mocks/*.ts` với hàm `async getX()`, hàm định dạng trong `src/lib/`. `newId()` chỉ gọi trong event handler, không gọi lúc render. Chỗ cần nối backend ghi `// TODO (khi có backend): ...`.
- **Next.js 16:** trang có `params` bọc `Suspense` (pattern: component con `async` nhận `params: Promise<...>`), `notFound()` khi không có dữ liệu, `metadata` ở mỗi `page.tsx`.
