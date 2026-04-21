import { GET } from "@/app/api/auth/callback/route";
import { createClient } from "@/utils/supabase/server";

jest.mock("@/utils/supabase/server", () => ({
  createClient: jest.fn(),
}));

describe("GET /api/auth/callback", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- HELPER TẠO REQUEST ---
  const createMockRequest = (params: Record<string, string> = {}) => {
    const url = new URL("http://localhost:3000/api/auth/callback");
    Object.entries(params).forEach(([key, val]) =>
      url.searchParams.set(key, val),
    );
    return new Request(url.toString());
  };

  it("1. Redirect về /command nếu exchange code thành công (không có redirectTo)", async () => {
    const mockExchange = jest.fn().mockResolvedValue({ error: null });
    (createClient as jest.Mock).mockResolvedValue({
      auth: { exchangeCodeForSession: mockExchange },
    });

    const req = createMockRequest({ code: "valid-auth-code" });
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "http://localhost:3000/command",
    );
    expect(mockExchange).toHaveBeenCalledWith("valid-auth-code");
  });

  it("2. Redirect về redirectTo nếu exchange thành công và có redirectTo param", async () => {
    const mockExchange = jest.fn().mockResolvedValue({ error: null });
    (createClient as jest.Mock).mockResolvedValue({
      auth: { exchangeCodeForSession: mockExchange },
    });

    const req = createMockRequest({
      code: "valid-auth-code",
      redirectTo: "/projects",
    });
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "http://localhost:3000/projects",
    );
  });

  it("3. Redirect về /login?error=auth_callback_failed nếu exchangeCodeForSession trả về lỗi", async () => {
    const mockExchange = jest
      .fn()
      .mockResolvedValue({ error: new Error("Invalid code") });
    (createClient as jest.Mock).mockResolvedValue({
      auth: { exchangeCodeForSession: mockExchange },
    });

    const req = createMockRequest({ code: "bad-code" });
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "http://localhost:3000/login?error=auth_callback_failed",
    );
  });

  it("4. Redirect về /login?error=auth_callback_failed nếu không có code trong URL", async () => {
    const req = createMockRequest(); // Không có code
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "http://localhost:3000/login?error=auth_callback_failed",
    );

    // Không gọi Supabase nếu không có code
    expect(createClient).not.toHaveBeenCalled();
  });

  it("5. Không dùng redirectTo từ ngoài origin (chỉ dùng path tương đối)", async () => {
    const mockExchange = jest.fn().mockResolvedValue({ error: null });
    (createClient as jest.Mock).mockResolvedValue({
      auth: { exchangeCodeForSession: mockExchange },
    });

    const req = createMockRequest({
      code: "valid-auth-code",
      redirectTo: "/auth/reset-password",
    });
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "http://localhost:3000/auth/reset-password",
    );
  });

  it("6. Redirect về an toàn (/) nếu redirectTo là URL ngoài origin (Open Redirect Protection)", async () => {
    const mockExchange = jest.fn().mockResolvedValue({ error: null });
    (createClient as jest.Mock).mockResolvedValue({
      auth: { exchangeCodeForSession: mockExchange },
    });

    const req = createMockRequest({
      code: "valid-auth-code",
      redirectTo: "https://malicious.com/phishing",
    });
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "http://localhost:3000/",
    );
  });

  it("7. Redirect về an toàn (/) nếu redirectTo là protocol-relative URL (Open Redirect Protection)", async () => {
    const mockExchange = jest.fn().mockResolvedValue({ error: null });
    (createClient as jest.Mock).mockResolvedValue({
      auth: { exchangeCodeForSession: mockExchange },
    });

    const req = createMockRequest({
      code: "valid-auth-code",
      redirectTo: "//malicious.com/phishing",
    });
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "http://localhost:3000/",
    );
  });
});
