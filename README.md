# TaskMasterPro Dashboard

TaskMasterPro là một ứng dụng quản lý công việc và dự án được xây dựng với Next.js 16, TypeScript và Tailwind CSS. Ứng dụng cung cấp giao diện quản lý công việc hiện đại, theo dõi thời gian và quản lý dự án.

## 🚀 Tính năng

- **Quản lý công việc**: Tạo, theo dõi và quản lý công việc hàng ngày.
- **Theo dõi thời gian**: Đồng hồ bấm giờ tích hợp để đo lường thời gian làm việc.
- **Quản lý dự án**: Giao diện quản lý dự án với các trạng thái công việc (To Do, In Progress, Done).
- **Xác thực người dùng**: Đăng nhập và đăng ký tài khoản an toàn với Supabase Auth.
- **Giao diện hiện đại**: Thiết kế tối giản với hiệu ứng chuyển động mượt mà.

## 🛠️ Cài đặt

### Yêu cầu

- Node.js 18.0.0 trở lên
- npm 9.0.0 trở lên

### Cài đặt

1. Clone repository:
   ```bash
   git clone <repository-url>
   cd task-master-pro
   ```

2. Cài đặt dependencies:
   ```bash
   npm install
   ```

3. Cấu hình môi trường:
   Tạo file `.env.local` trong thư mục gốc:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Chạy ứng dụng:
   ```bash
   npm run dev
   ```

## 🏃 Sử dụng

### Chạy ứng dụng

```bash
npm run dev
```

Ứng dụng sẽ chạy tại `http://localhost:3000`.

### Build và deploy

```bash
npm run build
npm run start
```

## 📂 Cấu trúc dự án

```text
task-master-pro/
├── src/
│   ├── app/                    # 📌 Nền tảng App Router (Định tuyến chính)
│   │   ├── (auth)/             # Nhóm Public Route (Không yêu cầu đăng nhập)
│   │   │   ├── login/          # Giao diện Đăng nhập / Đăng ký
│   │   │   └── auth/callback/  # API Route hứng và xử lý token từ Supabase OAuth
│   │   ├── (dashboard)/        # Nhóm Private Route (Yêu cầu xác thực)
│   │   │   ├── boards/[id]/    # Trang chi tiết Không gian làm việc (Kanban Board)
│   │   │   ├── profile/        # Quản lý thông tin cá nhân & Tài khoản
│   │   │   ├── admin/          # Bảng điều khiển dành riêng cho Quản trị viên
│   │   │   └── page.tsx        # Trang chủ Dashboard: Danh sách dự án đang tham gia
│   │   ├── layout.tsx          # Layout bao bọc toàn ứng dụng (Navbar, Auth Provider)
│   │   └── globals.css         # CSS toàn cục & Cấu hình Tailwind Utilities
│   │
│   ├── components/             # 🧩 UI Components (Các mảnh ghép giao diện tái sử dụng)
│   │   ├── auth/               # Form đăng nhập, đăng ký, quên mật khẩu
│   │   ├── kanban/             # Component cốt lõi: Cột (Column), Thẻ công việc (Task Card)
│   │   └── shared/             # Các UI Elements chung (Button, Modal, Toast, Icons)
│   │
│   ├── hooks/                  # 🎣 Custom React Hooks (Xử lý logic FE)
│   │   ├── useAuth.ts          # Quản lý State của phiên đăng nhập
│   │   └── useKanban.ts        # Xử lý logic kéo/thả (Drag & Drop) của thẻ
│   │
│   ├── lib/                    # 🛠 Thư viện, Tiện ích & Cấu hình Backend
│   │   ├── supabase.ts         # Khởi tạo Supabase Client
│   │   └── utils.ts            # Các hàm helpers (format ngày tháng, debounce...)
│   │
│   └── types/                  # 🏷 Khai báo kiểu dữ liệu (TypeScript Interfaces)
│       └── database.types.ts   # Định nghĩa Schema cho Board, Task, User, Notification
│
├── public/                     # 🖼 Tài nguyên tĩnh (Hình ảnh, Icons, Favicon)
├── tailwind.config.ts          # Cấu hình theme, màu sắc chủ đạo của dự án
├── middleware.ts               # Next.js Middleware bảo vệ các Private Routes
└── .env.local                  # Biến môi trường (Chứa khóa API Supabase)
```

## 🤝 Đóng góp

1. Tạo branch mới:
   ```bash
   git checkout -b feature/new-feature
   ```

2. Commit thay đổi:
   ```bash
   git add .
   git commit -m "Add new feature"
   ```

3. Push và tạo Pull Request:
   ```bash
   git push origin feature/new-feature
   ```

## 📄 Giấy phép

MIT