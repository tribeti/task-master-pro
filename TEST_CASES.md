# Danh sách Test Cases - TaskMaster Pro

Tài liệu này tổng hợp toàn bộ các test cases hiện có trong thư mục `src/__test__`.


## Loại Test: ACTIONS

### File: `actions/auth.actions.test.ts`

- **Describe:** Auth Actions (Server Actions)
  - **Describe:** checkEmailExistsAction
    - [ ] returns error for invalid email
    - [ ] returns true if email exists by calling Supabase RPC
    - [ ] returns fallback exists: true if Supabase RPC returns an error
    - [ ] returns fallback exists: true if an unexpected exception occurs (catch block)
  - **Describe:** requestPasswordResetAction
    - [ ] returns error for invalid email format
    - [ ] returns success on valid email by calling Supabase Auth API
    - [ ] returns friendly error message if Supabase Auth API returns an error
    - [ ] returns friendly error message if an unexpected exception occurs (catch block)

### File: `actions/notification.actions.test.ts`

- **Describe:** triggerDeadlineNotifications Server Action
  - [ ] catches and logs unexpected crash (try...catch block)
  - [ ] returns early and logs error if fetching tasks fails
  - [ ] returns early if no tasks are returned
  - [ ] filters out tasks in "Done" columns correctly
  - [ ] returns early and logs error if fetching existing notifications fails
  - [ ] does NOT insert if user was already notified for the exact same urgency
  - [ ] inserts new notification if valid task and not yet notified
  - [ ] logs error but continues loop if insert fails

## Loại Test: HOOKS

### File: `hooks/useDebounce.test.ts`

- **Describe:** useDebounce hook
  - [ ] nên trả về giá trị ban đầu ngay lập tức
  - [ ] nên cập nhật giá trị sau khoảng thời gian delay mặc định (500ms)
  - [ ] nên cập nhật giá trị theo custom delay truyền vào
  - [ ] chỉ nên cập nhật một lần đối với giá trị cuối cùng nếu có nhiều thay đổi diễn ra liên tục

### File: `hooks/useNotifications.test.ts`

- **Describe:** useNotifications Hook
  - [ ] should not fetch data if userId is undefined
  - [ ] should fetch notifications and set initial state correctly
  - [ ] should call triggerDeadlineNotifications once on mount
  - **Describe:** Realtime Subscriptions
    - [ ] should handle INSERT event and show toast
    - [ ] should not duplicate INSERT event if notification already exists
    - [ ] should handle UPDATE event
    - [ ] should handle DELETE event
  - **Describe:** Actions
    - [ ] markAsRead should optimistically update state and call supabase
    - [ ] markAllAsRead should optimistically update state and call supabase
  - [ ] should unsubscribe from channel on unmount

### File: `hooks/useProjects.test.ts`

- **Describe:** useProjects Hook
  - **Describe:** fetchBoards (via useEffect)
    - [ ] sets empty boards and loading=false when no userId
    - [ ] fetches and sets boards when userId is provided
    - [ ] shows error toast and resets boards on fetchUserBoards failure
    - [ ] uses "Unknown error" when error has no message on fetch
    - [ ] re-fetches when userId changes
  - **Describe:** confirmDeleteProject
    - [ ] returns false immediately when no userId
    - [ ] deletes board, shows success toast, re-fetches, and returns true
    - [ ] shows error toast and returns false on delete failure
    - [ ] uses "Unknown error" when delete error has no message
  - **Describe:** handleCreateProject
    - [ ] returns false immediately when no userId
    - [ ] creates board with default columns, shows success, re-fetches, returns true
    - [ ] passes null description when description is empty string
    - [ ] shows warning toast when createDefaultColumns fails but still returns true
    - [ ] shows error toast and returns false when createNewBoard fails
    - [ ] uses "Unknown error" when createNewBoard error has no message
  - **Describe:** handleUpdateExistingProject
    - [ ] returns false immediately when no userId
    - [ ] updates board, shows success toast, re-fetches, and returns true
    - [ ] shows error toast and returns false on update failure
    - [ ] uses "Unknown error" when update error has no message

## Loại Test: INTEGRATION

### File: `integration/auth-api/ChangePasswordApi.test.ts`

- **Describe:** POST /api/auth/change-password
  - [ ] 1. Lỗi 500 nếu thiếu biến môi trường Supabase
  - [ ] 2. Lỗi 400 nếu thiếu oldPassword hoặc newPassword
  - [ ] 3. Lỗi 400 nếu mật khẩu mới không qua được validate
  - [ ] 4. Trả về lỗi từ helper nếu getAuthenticatedUser thất bại
  - [ ] 5. Lỗi 400 nếu mật khẩu hiện tại không đúng (signInWithPassword lỗi)
  - [ ] 6. Đổi mật khẩu thành công trả về 200
  - [ ] 7. Lỗi 500 nếu catch được exception (vd: lỗi parse JSON body)

### File: `integration/auth-api/LoginApi.test.ts`

- **Describe:** POST /api/auth/login
  - [ ] 1. Lỗi 400 nếu thiếu email hoặc password
  - [ ] 2. Lỗi 401 nếu Supabase trả về lỗi đăng nhập (Sai pass/email)
  - [ ] 3. Đăng nhập thành công và trả về thông tin user (Status 200)
  - [ ] 4. Lỗi 500 nếu có exception xảy ra (VD: Request body bị lỗi parse)

### File: `integration/auth-api/Logout.test.ts`

- **Describe:** POST /api/auth/logout
  - [ ] 1. Lỗi 500 nếu Supabase signOut thất bại
  - [ ] 2. Đăng xuất thành công và trả về 200
  - [ ] 3. Lỗi 500 nếu có exception bất ngờ xảy ra

### File: `integration/auth-api/ProfileApi.test.ts`

- **Describe:** /api/auth/profile
  - **Describe:** GET
    - [ ] 1. Trả về lỗi 401 nếu chưa đăng nhập
    - [ ] 2. Lỗi 500 nếu query database thất bại (không phải lỗi PGRST116)
    - [ ] 3. Thành công (200) nhưng User chưa có profile trong bảng users (Lỗi PGRST116)
    - [ ] 4. Lấy thông tin profile thành công (200)
  - **Describe:** PUT
    - [ ] 1. Lỗi 400 nếu displayName bị trống hoặc không phải chuỗi
    - [ ] 2. Lỗi 500 nếu update bảng users thất bại
    - [ ] 3. Lỗi 500 nếu đồng bộ auth.users thất bại
    - [ ] 4. Cập nhật profile thành công (200)
    - [ ] 5. Catch block: Lỗi 500 nếu body request gửi lên bị lỗi (VD: không parse được JSON)

### File: `integration/auth-api/RegisterApi.test.ts`

- **Describe:** POST /api/auth/register
  - [ ] 1. Lỗi 400 nếu thiếu email, password, hoặc fullName
  - [ ] 2. Lỗi 400 nếu mật khẩu không qua được validator
  - [ ] 3. Lỗi 400 nếu Supabase signUp trả về lỗi (VD: Email đã tồn tại)
  - [ ] 4. Đăng ký thành công và URL callback lấy từ Header Origin
  - [ ] 5. Đăng ký thành công và URL callback có chứa query redirectTo
  - [ ] 6. Lỗi 500 nếu có exception (VD: Request body bị lỗi parse)

### File: `integration/board-api/AcceptInvitationApi.test.ts`

- **Describe:** GET /api/boards/[boardId]/invitations/accept
  - [ ] 1. Lỗi và redirect về home nếu boardId bị NaN
  - [ ] 2. Lỗi và redirect nếu thiếu token trên URL
  - [ ] 3. Redirect sang trang Login nếu chưa đăng nhập (có kèm redirectTo)
  - [ ] 4. Redirect lỗi nếu không tìm thấy lời mời trong DB (sai token/boardId)
  - [ ] 5. Redirect lỗi nếu lời mời đã được xử lý (status != pending)
  - [ ] 6. Redirect lỗi nếu email user đang login KHÔNG khớp với email được mời
  - [ ] 7. Redirect lỗi nếu thêm user vào board_members thất bại (Insert error)
  - [ ] 8. Thành công: User chưa là member -> Insert -> Cập nhật status -> Redirect /projects
  - [ ] 9. Edge Case: User đã là member từ trước -> Bỏ qua insert -> Chỉ cập nhật status -> Redirect

### File: `integration/board-api/BoardMembersApi.test.ts`

- **Describe:** /api/boards/[boardId]/members
  - **Describe:** GET
    - [ ] 1. Lỗi 400 nếu boardId không hợp lệ
    - [ ] 2. Lỗi 401 nếu chưa đăng nhập
    - [ ] 3. Lỗi 403 nếu không phải owner và cũng không phải member
    - [ ] 4. Lỗi 500 nếu query bảng board_members thất bại
    - [ ] 5. Thành công (200) trả về Owner ở đầu mảng và map data chuẩn xác
    - [ ] 6. Catch block: Xử lý exception bất ngờ
  - **Describe:** POST
    - [ ] 1. Lỗi 400 nếu thiếu email
    - [ ] 2. Lỗi 403 nếu không phải là owner
    - [ ] 3. Lỗi 500 nếu Admin Client listUsers thất bại
    - [ ] 4. Lỗi 404 nếu email chưa đăng ký tài khoản Auth
    - [ ] 5. Lỗi 400 nếu tự mời chính mình
    - [ ] 6. Lỗi 409 nếu target user đã là thành viên trong board_members
    - [ ] 7. Lỗi 409 nếu email này đang có một lời mời 'pending' khác
    - [ ] 8. Lỗi 500 nếu tạo record lời mời thất bại
    - [ ] 9. Thành công (201): Tạo lời mời và thông báo In-App thành công
    - [ ] 10. Thành công (201) ngay cả khi lỗi tạo Notification (Không chặn luồng chính)

### File: `integration/board-api/Create-ReadBoardApi.test.ts`

- **Describe:** /api/boards
  - **Describe:** GET
    - [ ] 1. Lỗi 401 nếu chưa đăng nhập
    - [ ] 2. Lỗi 500 nếu lấy danh sách owned boards thất bại
    - [ ] 3. Lỗi 500 nếu lấy danh sách joined boards thất bại
    - [ ] 4. Thành công (200) và filter đúng các joined boards do user tự tạo
    - [ ] 5. Catch block: Trả về 500 nếu có exception bất ngờ
  - **Describe:** POST
    - [ ] 1. Lỗi 401 nếu chưa đăng nhập
    - [ ] 2. Lỗi 400 nếu validate input thất bại (VD: thiếu title)
    - [ ] 3. Lỗi 500 nếu insert vào database thất bại
    - [ ] 4. Lỗi 500 nếu insert thành công nhưng không trả về data
    - [ ] 5. Tạo bảng thành công (201)
    - [ ] 6. Catch block: Trả về 500 nếu body request gửi lên bị lỗi JSON

### File: `integration/board-api/GetKanbanBoardApi.test.ts`

- **Describe:** GET /api/boards/[boardId]/kanban
  - [ ] 1. Lỗi 400 nếu boardId không phải số hợp lệ
  - [ ] 2. Lỗi 401 nếu chưa đăng nhập
  - [ ] 3. Lỗi 403 nếu không có quyền truy cập board
  - [ ] 4. Lỗi 500 nếu query bảng columns thất bại
  - [ ] 5. Lỗi 500 nếu query bảng tasks thất bại
  - [ ] 6. Lỗi 500 nếu query bảng task_assignees thất bại
  - [ ] 7. Lỗi 500 nếu query bảng users thất bại
  - [ ] 8. Lỗi 500 nếu query bảng labels thất bại
  - [ ] 9. Lỗi 500 nếu query bảng task_labels thất bại
  - [ ] 10. Trả về đúng cấu trúc khi Board không có cột nào
  - [ ] 11. TRÙM CUỐI: Map thành công toàn bộ Tasks, Assignees, Profiles, và Labels
  - [ ] 12. Catch block: Xử lý exception bất ngờ

### File: `integration/board-api/RemoveBoardMemberApi.test.ts`

- **Describe:** DELETE /api/boards/[boardId]/members/[userId]
  - [ ] 1. Lỗi 400 nếu params không hợp lệ (NaN boardId hoặc thiếu userId)
  - [ ] 2. Lỗi 401 nếu chưa đăng nhập
  - [ ] 3. Lỗi 404 nếu không tìm thấy board
  - [ ] 4. Lỗi 403 nếu người dùng không phải là owner của board
  - [ ] 5. Lỗi 400 nếu owner cố tình tự xóa chính mình
  - [ ] 6. Lỗi 500 nếu lấy danh sách cột thất bại
  - [ ] 7. Lỗi 500 nếu lấy danh sách task thất bại
  - [ ] 8. Lỗi 500 nếu lấy danh sách assignee bị ảnh hưởng thất bại
  - [ ] 9. Lỗi 500 nếu lệnh xóa assignees thất bại
  - [ ] 10. Lỗi 500 nếu đồng bộ (sync) fetch lại assignee thất bại
  - [ ] 11. Lỗi 500 nếu đồng bộ (sync) update bảng tasks thất bại
  - [ ] 12. Lỗi 500 nếu bước xóa board_members cuối cùng thất bại
  - [ ] 13. Thành công (200) xóa member nhưng board rỗng (không có cột/task nào)
  - [ ] 14. Thành công (200) đầy đủ luồng: Xóa assignee và đôn người mới lên Primary
  - [ ] 15. Thành công (200) đầy đủ luồng: Không còn ai khác -> Primary assignee = null
  - [ ] 16. Catch block: Xử lý các exception bất ngờ (vd: params Promise bị crash)

### File: `integration/board-api/SeedColumnApi.test.ts`

- **Describe:** POST /api/boards/[boardId]/columns/default
  - [ ] 1. Lỗi 400 nếu boardId không hợp lệ (NaN)
  - [ ] 2. Lỗi 401 nếu chưa đăng nhập
  - [ ] 3. Lỗi 403 nếu user không phải là owner của board
  - [ ] 4. Lỗi 500 nếu Supabase insert thất bại
  - [ ] 5. Tạo 3 cột mặc định thành công (201)
  - [ ] 6. Catch block: Lỗi 500 nếu có exception (VD: params Promise bị reject)

### File: `integration/board-api/Update-DeleteBoardApi.test.ts`

- **Describe:** /api/boards/[boardId]
  - **Describe:** PUT
    - [ ] 1. Lỗi 400 nếu boardId không phải là số hợp lệ
    - [ ] 2. Lỗi 401 nếu chưa đăng nhập
    - [ ] 3. Lỗi 403 nếu user không phải là owner của board
    - [ ] 4. Lỗi 400 nếu dữ liệu truyền vào sai (validateString báo lỗi)
    - [ ] 5. Cập nhật thành công (200) với các trường dữ liệu được xử lý đúng
    - [ ] 6. Lỗi 500 nếu Supabase update thất bại
    - [ ] 7. Lỗi 400 nếu body request gửi lên không phải JSON
  - **Describe:** DELETE
    - [ ] 1. Lỗi 400 nếu boardId không hợp lệ (NaN)
    - [ ] 2. Lỗi 401 nếu chưa đăng nhập
    - [ ] 3. Lỗi 404 (P0002) nếu board không tồn tại
    - [ ] 4. Lỗi 403 (P0003) nếu user không có quyền xóa
    - [ ] 5. Lỗi 409 (P0004) nếu vẫn còn task chưa Done
    - [ ] 6. Lỗi 500 nếu gặp mã lỗi RPC không xác định
    - [ ] 7. Xóa thành công (200)
    - [ ] 8. Catch block: Lỗi 500 nếu có exception (VD: params Promise bị reject)

### File: `integration/CronNotificationsApi.test.ts`

- **Describe:** GET /api/cron/notifications
  - [ ] returns 401 when CRON_SECRET is set but authorization header is wrong
  - [ ] returns 401 when CRON_SECRET is set but authorization header is missing
  - [ ] passes auth when CRON_SECRET matches authorization header
  - [ ] returns 200 with message when no urgent tasks found
  - [ ] returns 500 when tasks query fails
  - [ ] creates notifications for tasks with upcoming deadlines
  - [ ] filters out tasks in Done column
  - [ ] skips notification if same urgency stage already exists
  - [ ] returns 500 when notifications query fails

### File: `integration/HealthApi.test.ts`

- **Describe:** GET /api/health
  - [ ] 1. Trả về status 200 và đúng cấu trúc thông tin hệ thống
  - [ ] 2. Fallback version về 'unknown' nếu không có biến NEXT_PUBLIC_APP_VERSION

### File: `integration/kanban-api/ColumnDetailApi.test.ts`

- **Describe:** /api/kanban/columns/[columnId]
  - **Describe:** PUT
    - [ ] 1. Lỗi 401 nếu chưa đăng nhập
    - [ ] 2. Lỗi 400 nếu position bị sai định dạng (số âm hoặc không phải số nguyên)
    - [ ] 3. Lỗi 400 nếu payload gửi lên không có trường hợp lệ nào
    - [ ] 4. Lỗi 404 nếu không tìm thấy cột trong database
    - [ ] 5. Lỗi 403 nếu bị chặn quyền (verifyBoardAccess văng lỗi AuthorizationError)
    - [ ] 6. Lỗi 500 nếu update database thất bại
    - [ ] 7. Thành công (200) update title và position
    - [ ] 8. Catch block: Xử lý exception bất ngờ (vd: Lỗi parse JSON)
  - **Describe:** DELETE
    - [ ] 1. Lỗi 401 nếu chưa đăng nhập
    - [ ] 2. Lỗi 404 nếu không tìm thấy cột trong database
    - [ ] 3. Lỗi 403 nếu bị chặn quyền (verifyBoardAccess từ chối)
    - [ ] 4. Lỗi 500 nếu đếm task thất bại
    - [ ] 5. Lỗi 400 nếu cột vẫn còn chứa task (count > 0)
    - [ ] 6. Lỗi 500 nếu lệnh xóa cột thất bại
    - [ ] 7. Thành công (200) xóa cột rỗng
    - [ ] 8. Catch block: Xử lý exception bất ngờ (vd: params reject)

### File: `integration/kanban-api/CommentsApi.test.ts`

- **Describe:** DELETE /api/kanban/comments/[commentId]
  - [ ] 1. Lỗi 401 nếu chưa đăng nhập
  - [ ] 2. Lỗi 404 nếu không tìm thấy bình luận
  - [ ] 3. Lỗi 500 nếu người dùng không có quyền truy cập Task (verifyTaskAccess)
  - [ ] 4. Lỗi 403 nếu cố tình xóa bình luận của người khác
  - [ ] 5. Lỗi 500 nếu lệnh delete của Supabase thất bại
  - [ ] 6. Xóa thành công (200) bình luận của chính mình
  - [ ] 7. Catch block: Xử lý exception bất ngờ

### File: `integration/kanban-api/Create-ReadTaskApi.test.ts`

- **Describe:** Tasks API (POST & PUT)
  - **Describe:** POST /api/kanban/tasks
    - [ ] nên trả về 401 nếu user chưa đăng nhập
    - [ ] nên trả về 400 nếu column_id không hợp lệ
    - [ ] nên trả về 403 nếu check verifyBoardAccess thất bại
    - [ ] nên tạo task thành công và gửi notification
  - **Describe:** PUT /api/kanban/tasks
    - [ ] nên trả về mảng rỗng nếu payload không phải array hoặc rỗng
    - [ ] nên trả về 400 nếu dữ liệu cập nhật không hợp lệ
    - [ ] nên trả về 404 nếu không tìm thấy đủ số lượng task yêu cầu
    - [ ] nên cập nhật thành công nhiều task

### File: `integration/kanban-api/KanbanColumnsApi.test.ts`

- **Describe:** /api/kanban/columns
  - **Describe:** POST
    - [ ] 1. Lỗi 401 nếu chưa đăng nhập
    - [ ] 2. Lỗi 500 nếu validateString quăng lỗi (VD: chuỗi rỗng)
    - [ ] 3. Lỗi 500 nếu người dùng không có quyền truy cập bảng (verifyBoardAccess)
    - [ ] 4. Lỗi 500 nếu insert vào Supabase thất bại
    - [ ] 5. Tạo cột thành công (200)
  - **Describe:** PUT
    - [ ] 1. Trả về mảng rỗng (200) nếu gửi lên mảng updates rỗng
    - [ ] 2. Lỗi 401 nếu chưa đăng nhập
    - [ ] 3. Lỗi 404 nếu fetch columns lỗi hoặc số lượng cột trong DB không khớp số lượng gửi lên
    - [ ] 4. Lỗi 500 nếu user không có quyền vào một trong số các bảng chứa cột (verifyAllBoardsAccess)
    - [ ] 5. Lỗi 500 nếu lệnh upsert bulk update thất bại
    - [ ] 6. Cập nhật vị trí kéo thả hàng loạt thành công (200)
    - [ ] 7. Catch block: Trả về 500 nếu body request gửi lên bị lỗi JSON

### File: `integration/kanban-api/KanbanLabelsApi.test.ts`

- **Describe:** POST /api/kanban/labels
  - [ ] 1. Lỗi 401 nếu chưa đăng nhập
  - [ ] 2. Lỗi 400 nếu định dạng color_hex không hợp lệ (sai Regex)
  - [ ] 3. Lỗi 500 nếu validateString quăng lỗi
  - [ ] 4. Lỗi 500 nếu user không có quyền vào board
  - [ ] 5. Lỗi 500 nếu Supabase insert thất bại
  - [ ] 6. Tạo Label thành công (200) với mã màu 3 ký tự và 6 ký tự
  - [ ] 7. Catch block: Xử lý exception bất ngờ (vd: body rỗng)

### File: `integration/kanban-api/LabelDetailApi.test.ts`

- **Describe:** DELETE /api/kanban/labels/[labelId]
  - [ ] 1. Lỗi 401 nếu chưa đăng nhập
  - [ ] 2. Lỗi 404 nếu không tìm thấy Label
  - [ ] 3. Lỗi 500 nếu verifyBoardAccess thất bại
  - [ ] 4. Lỗi 500 nếu Supabase delete thất bại
  - [ ] 5. Xóa thành công (200)
  - [ ] 6. Catch block: Xử lý exception bất ngờ

### File: `integration/kanban-api/TaskAssigneesApi.test.ts`

- **Describe:** Task Assignees API (POST & DELETE)
  - **Describe:** POST /api/kanban/tasks/[taskId]/assignees
    - [ ] nên trả về 401 nếu chưa đăng nhập
    - [ ] nên trả về 404 nếu không tìm thấy người dùng (assigneeErr)
    - [ ] nên trả về 500 nếu thêm assignee thất bại (upsert error)
    - [ ] nên gán task thành công, đồng bộ assignee và gửi thông báo
  - **Describe:** DELETE /api/kanban/tasks/[taskId]/assignees
    - [ ] nên trả về 401 nếu chưa đăng nhập
    - [ ] nên xóa tất cả assignees nếu truyền param removeAll=true
    - [ ] nên trả về 500 nếu xóa tất cả assignees thất bại
    - [ ] nên trả về 400 nếu removeAll=false nhưng không truyền userId
    - [ ] nên xóa 1 assignee cụ thể nếu truyền userId hợp lệ
    - [ ] nên trả về 500 nếu lệnh xóa assignee cụ thể bị lỗi

### File: `integration/kanban-api/TaskCommentsApi.test.ts`

- **Describe:** Task Comments API (POST)
  - **Describe:** POST /api/kanban/tasks/[taskId]/comments
    - [ ] nên trả về 401 nếu user chưa đăng nhập
    - [ ] nên trả về lỗi (500) nếu user không có quyền truy cập task
    - [ ] nên trả về lỗi (500) nếu dữ liệu content không hợp lệ (validateString ném lỗi)
    - [ ] nên trả về 500 nếu Supabase insert comment thất bại
    - [ ] nên tạo comment thành công và trả về dữ liệu comment

### File: `integration/kanban-api/TaskLabelsApi.test.ts`

- **Describe:** Task Labels API (POST & DELETE)
  - **Describe:** POST /api/kanban/tasks/[taskId]/labels
    - [ ] nên trả về 401 nếu user chưa đăng nhập
    - [ ] nên trả về 500 nếu verifyTaskAccess bị lỗi (không có quyền)
    - [ ] nên trả về 404 nếu không tìm thấy task
    - [ ] nên trả về 404 nếu không tìm thấy label
    - [ ] nên trả về 403 nếu label không thuộc cùng board với task
    - [ ] nên thêm label vào task thành công
    - [ ] nên trả về 500 nếu upsert bị lỗi
  - **Describe:** DELETE /api/kanban/tasks/[taskId]/labels
    - [ ] nên trả về 400 nếu thiếu param labelId
    - [ ] nên trả về 401 nếu chưa đăng nhập
    - [ ] nên xóa label khỏi task thành công
    - [ ] nên trả về 500 nếu lệnh xóa database thất bại

### File: `integration/kanban-api/Update-DeleteTaskApi.test.ts`

- **Describe:** Update/Delete Task API
  - **Describe:** PUT /api/kanban/tasks/[taskId]
    - [ ] nên trả về 401 nếu user chưa đăng nhập
    - [ ] nên trả về lỗi (500) nếu validateString ném lỗi
    - [ ] nên trả về 500 nếu verifyTaskAccess ném lỗi (vd: không có quyền)
    - [ ] nên trả về 403 nếu cố gắng chuyển sang cột (column_id) không tồn tại
    - [ ] nên cập nhật task thành công khi chuyển sang cột mới
    - [ ] nên cập nhật thông tin task thành công mà không đổi cột
  - **Describe:** DELETE /api/kanban/tasks/[taskId]
    - [ ] nên trả về 401 nếu user chưa đăng nhập
    - [ ] nên trả về lỗi (500) nếu verifyTaskAccess thất bại
    - [ ] nên trả về 500 nếu lệnh xóa database thất bại
    - [ ] nên xóa task thành công

### File: `integration/LoginRegister.test.tsx`

- **Describe:** Login & Register UI Flow
  - [ ] renders login view by default
  - [ ] switches to register view when "Sign up now" is clicked
  - [ ] shows generic mock error if backend auth API fails
  - [ ] redirects to /command dashboard on successful login

### File: `integration/ProjectsPage.test.tsx`

- **Describe:** ProjectsPage Integration
  - [ ] renders skeleton loaders initially, then renders actual project cards when data loads
  - [ ] opens Create Project Modal and interacts correctly when "Dự án mới" is clicked

### File: `integration/TaskCommentsApi.test.ts`

- **Describe:** GET /api/tasks/[taskId]/comments
  - [ ] returns 400 when taskId is not a number
  - [ ] returns 401 when user is not authenticated
  - [ ] returns 404 when task does not exist
  - [ ] returns 404 when column does not exist
  - [ ] returns 403 when user is neither board owner nor member
  - [ ] returns 200 with comments when user is board owner
  - [ ] returns 200 with comments when user is board member
  - [ ] returns 500 when comments query fails
  - [ ] returns empty array when task has no comments

### File: `integration/TeamTab.test.tsx`

- **Describe:** TeamTab Integration
  - [ ] renders loading state initially or fetches members on mount
  - [ ] handles member interaction like displaying or adding users

### File: `integration/UsersApi.test.ts`

- **Describe:** GET /api/users
  - [ ] returns 400 when boardId query param is missing
  - [ ] returns 400 when boardId is not a number
  - [ ] returns 401 when user is not authenticated
  - [ ] returns 403 when user has no access to the board
  - [ ] returns 404 when board does not exist
  - [ ] returns 500 when board_members query fails
  - [ ] returns 200 with user list for valid board members
  - [ ] returns 500 when users query fails

## Loại Test: SERVICES

### File: `services/project.service.test.ts`

- **Describe:** Project Service
  - **Describe:** fetchUserBoards
    - [ ] should return boards successfully
    - [ ] should throw specific error on API failure
    - [ ] should throw fallback error if JSON parsing fails
  - **Describe:** createNewBoard
    - [ ] should send correct POST request to create board
    - [ ] should handle validation/creation error from API
    - [ ] should throw fallback error on create failure without message
  - **Describe:** createDefaultColumns
    - [ ] should send correct POST request to create default columns
    - [ ] should throw fallback error on API failure
  - **Describe:** updateUserBoard
    - [ ] should send correct PUT request to update board
    - [ ] should throw specific error from API
    - [ ] should throw fallback error on API failure
  - **Describe:** deleteUserBoard
    - [ ] should send correct DELETE request
    - [ ] should throw specific error from API
    - [ ] should throw fallback error on API failure

## Loại Test: UNIT

### File: `unit/components/CreateProjectModal.test.tsx`

- **Describe:** CreateProjectModal (Test nhập liệu UI)
    - [ ] renders the modal when isOpen is true
    - [ ] does not render when isOpen is false
    - [ ] disables submit button when project name is empty
    - [ ] allows submitting when project name is entered
    - [ ] handles typing description and changing tags correctly

### File: `unit/components/Toggle.test.tsx`

- **Describe:** Toggle Component
    - [ ] renders correctly when checked
    - [ ] renders correctly when unchecked
    - [ ] calls onChange when clicked

### File: `unit/utils/time.test.ts`

- **Describe:** Time Utils
    - **Describe:** formatRelativeTime
        - [ ] should return "Just now" for times under 60 seconds
        - [ ] should return minutes correctly
        - [ ] should return hours correctly
        - [ ] should return 1 day correctly
        - [ ] should return multiple days correctly

### File: `unit/utils/validate-string.test.ts`

- **Describe:** validateString (Test sai số và exception)
    - [ ] should return trimmed string when input is valid
    - [ ] should throw an error if the string is empty or contains only spaces
    - [ ] should throw an error if the string exceeds maxLength
    - [ ] should not throw an error if string length exactly matches maxLength
