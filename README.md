# TaskMasterPro

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
   git clone https://github.com/tribeti/task-master-pro.git
   cd task-master-pro/src
   ```

2. Cài đặt dependencies:
   ```bash
   npm i
   ```

3. Cấu hình môi trường:
   Tạo file `.env.local` trong thư mục gốc:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
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

### Chạy kiểm thử

```bash
npm run test
```

### Build và deploy

```bash
npm run build
npm run start
```

## 📂 Cấu trúc dự án

```text
task-master-pro/
├── .github/
│   ├── workflows/
│   │   └── ci.yml
│   └── dependabot.yml
├── src/
│   ├── __test__/             # thư mục chứa file test
│   ├── app/
│   │   ├── (dashboard)/      # dashboard layout
│   │   ├── actions/          # server actions
│   │   ├── api/              # server route api
│   ├── components/           # các components
│   ├── lib/                  # thư viện
│   └── utils/
├── .dockerignore
├── docker-compose.yml
├── Dockerfile
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

GPL -2.0
