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
│   ├── __test__/
│   │   ├── actions/
│   │   │   ├── auth.actions.test.ts
│   │   │   └── notification.actions.test.ts
│   │   ├── hooks/
│   │   │   ├── useDebounce.test.ts
│   │   │   ├── useNotifications.test.ts
│   │   │   └── useProjects.test.ts
│   │   ├── integration/
│   │   │   ├── auth-api/
│   │   │   │   ├── ChangePasswordApi.test.ts
│   │   │   │   ├── LoginApi.test.ts
│   │   │   │   ├── Logout.test.ts
│   │   │   │   ├── ProfileApi.test.ts
│   │   │   │   └── RegisterApi.test.ts
│   │   │   ├── board-api/
│   │   │   │   ├── AcceptInvitationApi.test.ts
│   │   │   │   ├── BoardMembersApi.test.ts
│   │   │   │   ├── Create-ReadBoardApi.test.ts
│   │   │   │   ├── GetKanbanBoardApi.test.ts
│   │   │   │   ├── RemoveBoardMemberApi.test.ts
│   │   │   │   ├── SeedColumnApi.test.ts
│   │   │   │   └── Update-DeleteBoardApi.test.ts
│   │   │   ├── kanban-api/
│   │   │   │   ├── ColumnDetailApi.test.ts
│   │   │   │   ├── CommentsApi.test.ts
│   │   │   │   ├── Create-ReadTaskApi.test.ts
│   │   │   │   ├── KanbanColumnsApi.test.ts
│   │   │   │   ├── KanbanLabelsApi.test.ts
│   │   │   │   ├── LabelDetailApi.test.ts
│   │   │   │   ├── TaskAssigneesApi.test.ts
│   │   │   │   ├── TaskCommentsApi.test.ts
│   │   │   │   ├── TaskLabelsApi.test.ts
│   │   │   │   └── Update-DeleteTaskApi.test.ts
│   │   │   ├── CommentDeleteApi.test.ts
│   │   │   ├── CronNotificationsApi.test.ts
│   │   │   ├── HealthApi.test.ts
│   │   │   ├── LoginRegister.test.tsx
│   │   │   ├── ProjectsPage.test.tsx
│   │   │   ├── TaskCommentsApi.test.ts
│   │   │   ├── TeamTab.test.tsx
│   │   │   └── UsersApi.test.ts
│   │   ├── services/
│   │   │   └── project.service.test.ts
│   │   └── unit/
│   │       ├── components/
│   │       │   ├── CreateProjectModal.test.tsx
│   │       │   └── Toggle.test.tsx
│   │       └── utils/
│   │           ├── time.test.ts
│   │           └── validate-string.test.ts
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── command/
│   │   │   │   └── page.tsx
│   │   │   ├── insights/
│   │   │   │   └── page.tsx
│   │   │   ├── notifications/
│   │   │   │   └── page.tsx
│   │   │   ├── profile/
│   │   │   │   └── page.tsx
│   │   │   ├── projects/
│   │   │   │   └── page.tsx
│   │   │   ├── layout.tsx
│   │   │   ├── provider.tsx
│   │   │   └── sidebar.tsx
│   │   ├── actions/
│   │   │   ├── auth.actions.ts
│   │   │   └── notification.actions.ts
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── change-password/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── login/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── logout/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── profile/
│   │   │   │   │   └── route.ts
│   │   │   │   └── register/
│   │   │   │       └── route.ts
│   │   │   ├── boards/
│   │   │   │   ├── [boardId]/
│   │   │   │   │   ├── columns/
│   │   │   │   │   │   └── default/
│   │   │   │   │   │       └── route.ts
│   │   │   │   │   ├── invitations/
│   │   │   │   │   │   └── accept/
│   │   │   │   │   │       └── route.ts
│   │   │   │   │   ├── kanban/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── members/
│   │   │   │   │   │   ├── [userId]/
│   │   │   │   │   │   │   └── route.ts
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── route.ts
│   │   │   │   └── route.ts
│   │   │   ├── comments/
│   │   │   │   └── [commentId]/
│   │   │   │       └── route.ts
│   │   │   ├── cron/
│   │   │   │   └── notifications/
│   │   │   │       └── route.ts
│   │   │   ├── health/
│   │   │   │   └── route.ts
│   │   │   ├── kanban/
│   │   │   │   ├── columns/
│   │   │   │   │   ├── [columnId]/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── route.ts
│   │   │   │   ├── comments/
│   │   │   │   │   └── [commentId]/
│   │   │   │   │       └── route.ts
│   │   │   │   ├── labels/
│   │   │   │   │   ├── [labelId]/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── route.ts
│   │   │   │   └── tasks/
│   │   │   │       ├── [taskId]/
│   │   │   │       │   ├── assignees/
│   │   │   │       │   │   └── route.ts
│   │   │   │       │   ├── comments/
│   │   │   │       │   │   └── route.ts
│   │   │   │       │   ├── labels/
│   │   │   │       │   │   └── route.ts
│   │   │   │       │   └── route.ts
│   │   │   │       └── route.ts
│   │   │   ├── tasks/
│   │   │   │   └── [taskId]/
│   │   │   │       └── comments/
│   │   │   │           └── route.ts
│   │   │   └── users/
│   │   │       └── route.ts
│   │   ├── auth/
│   │   │   ├── callback/
│   │   │   │   └── page.tsx
│   │   │   └── reset-password/
│   │   │       └── page.tsx
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── board/
│   │   │   ├── BoardCard.tsx
│   │   │   └── BoardList.tsx
│   │   ├── Kanban/
│   │   │   ├── KanbanBoard.tsx
│   │   │   ├── KanbanColumn.tsx
│   │   │   └── KanbanTask.tsx
│   │   ├── landing/
│   │   │   ├── CtaSection.tsx
│   │   │   ├── FeaturesSection.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── GamificationSection.tsx
│   │   │   ├── HeroSection.tsx
│   │   │   ├── Navbar.tsx
│   │   │   └── PricingSection.tsx
│   │   ├── project-tabs/
│   │   │   ├── task-details/
│   │   │   │   ├── TaskAssignees.tsx
│   │   │   │   ├── TaskChecklist.tsx
│   │   │   │   ├── TaskComments.tsx
│   │   │   │   └── TaskLabels.tsx
│   │   │   ├── FilesTab.tsx
│   │   │   ├── index.ts
│   │   │   ├── ManageLabelsModal.tsx
│   │   │   ├── TaskDetailsModal.tsx
│   │   │   ├── TasksTab.tsx
│   │   │   ├── TeamTab.tsx
│   │   │   └── TimelineTab.tsx
│   │   ├── projects/
│   │   │   ├── DeleteConfirmModal.tsx
│   │   │   ├── ProjectCard.tsx
│   │   │   ├── QuickEntryModal.tsx
│   │   │   └── UpdateProjectModal.tsx
│   │   ├── timeline/
│   │   │   ├── helper.ts
│   │   │   └── TaskPreviewModal.tsx
│   │   ├── CreateProjectModal.tsx
│   │   ├── icons.tsx
│   │   ├── logo.tsx
│   │   ├── Toggle.tsx
│   │   └── UserAvatar.tsx
│   ├── hooks/
│   │   ├── useDebounce.ts
│   │   ├── useNotifications.ts
│   │   └── useProjects.ts
│   ├── lib/
│   │   ├── auth/
│   │   │   ├── helpers.ts
│   │   │   └── validators.ts
│   │   └── constants.ts
│   ├── public/
│   │   ├── file.svg
│   │   ├── globe.svg
│   │   ├── next.svg
│   │   ├── vercel.svg
│   │   └── window.svg
│   ├── services/
│   │   └── project.service.ts
│   ├── types/
│   │   └── project.ts
│   ├── utils/
│   │   ├── supabase/
│   │   │   ├── admin.ts
│   │   │   ├── client.ts
│   │   │   ├── middleware.ts
│   │   │   └── server.ts
│   │   ├── board-access.ts
│   │   ├── deadline.ts
│   │   ├── time.ts
│   │   ├── validate-string.ts
│   │   └── verify-board-ownership.ts
│   ├── .env.example
│   ├── .gitignore
│   ├── eslint.config.mjs
│   ├── jest.config.ts
│   ├── jest.setup.ts
│   ├── middleware.ts
│   ├── next.config.ts
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.mjs
│   ├── README.md
│   └── tsconfig.json
├── .dockerignore
├── docker-compose.yml
├── Dockerfile
├── LICENSE
└── README.md
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
