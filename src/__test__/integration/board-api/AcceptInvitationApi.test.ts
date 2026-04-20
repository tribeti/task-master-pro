import { GET } from "@/app/api/boards/[boardId]/invitations/accept/route";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// 1. Mock Next.js Server Components
jest.mock("next/server", () => ({
  NextResponse: {
    redirect: jest.fn((url: string) => ({ status: 302, url })),
  },
}));

// 2. Mock Supabase Client
jest.mock("@/utils/supabase/server", () => ({
  createClient: jest.fn(),
}));

// 3. Khởi tạo "Smart Mock Chain" phức tạp cho 2 bảng khác nhau
const mockAuthGetUser = jest.fn();

// --- Chain cho bảng board_invitations ---
const mockInvSingle = jest.fn();
const mockInvEq2 = jest.fn().mockReturnValue({ single: mockInvSingle });
const mockInvEq1 = jest.fn().mockReturnValue({ eq: mockInvEq2 });
const mockInvSelect = jest.fn().mockReturnValue({ eq: mockInvEq1 });

const mockInvUpdateEq = jest.fn();
const mockInvUpdate = jest.fn().mockReturnValue({ eq: mockInvUpdateEq });

// --- Chain cho bảng board_members ---
const mockMemMaybeSingle = jest.fn();
const mockMemEq2 = jest
  .fn()
  .mockReturnValue({ maybeSingle: mockMemMaybeSingle });
const mockMemEq1 = jest.fn().mockReturnValue({ eq: mockMemEq2 });
const mockMemSelect = jest.fn().mockReturnValue({ eq: mockMemEq1 });

const mockMemInsert = jest.fn();

// Hàm from() thông minh định tuyến query
const mockFrom = jest.fn((tableName: string) => {
  if (tableName === "board_invitations") {
    return { select: mockInvSelect, update: mockInvUpdate };
  }
  if (tableName === "board_members") {
    return { select: mockMemSelect, insert: mockMemInsert };
  }
  return {};
});

describe("GET /api/boards/[boardId]/invitations/accept", () => {
  const MOCK_APP_URL = "http://localhost:3000";
  const mockUser = { id: "user-123", email: "test@example.com" };

  beforeEach(() => {
    jest.clearAllMocks();

    process.env.NEXT_PUBLIC_APP_URL = MOCK_APP_URL;

    // Cài đặt Supabase mock
    (createClient as jest.Mock).mockResolvedValue({
      auth: { getUser: mockAuthGetUser },
      from: mockFrom,
    });

    // Mặc định pass auth
    mockAuthGetUser.mockResolvedValue({ data: { user: mockUser } });

    // Ẩn log lỗi terminal
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  // Helper tạo NextRequest giả để lấy searchParams (?token=...)
  const createMockRequest = (fullUrl: string) => {
    const urlObj = new URL(fullUrl);
    return {
      nextUrl: {
        searchParams: urlObj.searchParams,
        toString: () => fullUrl,
      },
    } as any;
  };

  it("1. Lỗi và redirect về home nếu boardId bị NaN", async () => {
    const req = createMockRequest(`${MOCK_APP_URL}/api?token=abc`);
    const params = Promise.resolve({ boardId: "not-a-number" });

    const res = (await GET(req, { params })) as any;

    expect(NextResponse.redirect).toHaveBeenCalledWith(
      `${MOCK_APP_URL}/?error=invalid_board`,
    );
    expect(res.url).toBe(`${MOCK_APP_URL}/?error=invalid_board`);
  });

  it("2. Lỗi và redirect nếu thiếu token trên URL", async () => {
    const req = createMockRequest(`${MOCK_APP_URL}/api`); // Không có ?token=
    const params = Promise.resolve({ boardId: "123" });

    await GET(req, { params });

    expect(NextResponse.redirect).toHaveBeenCalledWith(
      `${MOCK_APP_URL}/?error=missing_token`,
    );
  });

  it("3. Redirect sang trang Login nếu chưa đăng nhập (có kèm redirectTo)", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: null } });

    const targetUrl = `${MOCK_APP_URL}/api/boards/123/invitations/accept?token=valid-token`;
    const req = createMockRequest(targetUrl);
    const params = Promise.resolve({ boardId: "123" });

    await GET(req, { params });

    const expectedRedirect = `${MOCK_APP_URL}/login?redirectTo=${encodeURIComponent(targetUrl)}`;
    expect(NextResponse.redirect).toHaveBeenCalledWith(expectedRedirect);
  });

  it("4. Redirect lỗi nếu không tìm thấy lời mời trong DB (sai token/boardId)", async () => {
    mockInvSingle.mockResolvedValue({
      data: null,
      error: { message: "Not found" },
    });

    const req = createMockRequest(`${MOCK_APP_URL}/api?token=invalid-token`);
    const params = Promise.resolve({ boardId: "123" });

    await GET(req, { params });

    expect(NextResponse.redirect).toHaveBeenCalledWith(
      `${MOCK_APP_URL}/?error=invitation_not_found`,
    );
  });

  it("5. Redirect lỗi nếu lời mời đã được xử lý (status != pending)", async () => {
    mockInvSingle.mockResolvedValue({
      data: { id: 1, email: "test@example.com", status: "accepted" },
      error: null,
    });

    const req = createMockRequest(`${MOCK_APP_URL}/api?token=valid`);
    const params = Promise.resolve({ boardId: "123" });

    await GET(req, { params });

    // API sẽ báo lỗi theo status nhận được (vd: invitation_accepted)
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      `${MOCK_APP_URL}/?error=invitation_accepted`,
    );
  });

  it("6. Redirect lỗi nếu email user đang login KHÔNG khớp với email được mời", async () => {
    mockInvSingle.mockResolvedValue({
      data: { id: 1, email: "DIFFERENT@example.com", status: "pending" },
      error: null,
    });

    const req = createMockRequest(`${MOCK_APP_URL}/api?token=valid`);
    const params = Promise.resolve({ boardId: "123" });

    await GET(req, { params });

    expect(NextResponse.redirect).toHaveBeenCalledWith(
      `${MOCK_APP_URL}/?error=email_mismatch`,
    );
  });

  it("7. Redirect lỗi nếu thêm user vào board_members thất bại (Insert error)", async () => {
    // Pass lời mời
    mockInvSingle.mockResolvedValue({
      data: { id: 1, email: "test@example.com", status: "pending" },
      error: null,
    });
    // Chưa là member
    mockMemMaybeSingle.mockResolvedValue({ data: null });
    // Lỗi khi insert
    mockMemInsert.mockResolvedValue({ error: { message: "Insert error" } });

    const req = createMockRequest(`${MOCK_APP_URL}/api?token=valid`);
    const params = Promise.resolve({ boardId: "123" });

    await GET(req, { params });

    expect(NextResponse.redirect).toHaveBeenCalledWith(
      `${MOCK_APP_URL}/?error=join_failed`,
    );
  });

  it("8. Thành công: User chưa là member -> Insert -> Cập nhật status -> Redirect /projects", async () => {
    mockInvSingle.mockResolvedValue({
      data: { id: 99, email: "Test@Example.com", status: "pending" }, // Test email không phân biệt hoa thường
      error: null,
    });
    mockMemMaybeSingle.mockResolvedValue({ data: null });
    mockMemInsert.mockResolvedValue({ error: null });
    mockInvUpdateEq.mockResolvedValue({ error: null });

    const req = createMockRequest(`${MOCK_APP_URL}/api?token=valid-token`);
    const params = Promise.resolve({ boardId: "123" });

    await GET(req, { params });

    // Kiểm tra Insert
    expect(mockMemInsert).toHaveBeenCalledWith({
      user_id: "user-123",
      board_id: 123,
      role: "Member",
    });

    // Kiểm tra Update Status (sử dụng expect.objectContaining vì Date thay đổi liên tục)
    expect(mockInvUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "accepted",
        responded_at: expect.any(String),
      }),
    );
    expect(mockInvUpdateEq).toHaveBeenCalledWith("id", 99); // Cập nhật đúng ID lời mời

    // Kiểm tra Redirect cuối cùng
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      `${MOCK_APP_URL}/projects`,
    );
  });

  it("9. Edge Case: User đã là member từ trước -> Bỏ qua insert -> Chỉ cập nhật status -> Redirect", async () => {
    mockInvSingle.mockResolvedValue({
      data: { id: 99, email: "test@example.com", status: "pending" },
      error: null,
    });
    // Trả về data (tức là đã tồn tại trong bảng board_members)
    mockMemMaybeSingle.mockResolvedValue({ data: { user_id: "user-123" } });
    mockInvUpdateEq.mockResolvedValue({ error: null });

    const req = createMockRequest(`${MOCK_APP_URL}/api?token=valid`);
    const params = Promise.resolve({ boardId: "123" });

    await GET(req, { params });

    expect(mockMemInsert).not.toHaveBeenCalled();
    expect(mockInvUpdateEq).toHaveBeenCalledWith("id", 99);
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      `${MOCK_APP_URL}/projects`,
    );
  });
});
