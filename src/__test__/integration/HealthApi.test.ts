import { GET } from "@/app/api/health/route";

jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((body, init) => ({
      status: init?.status || 200,
      json: () => Promise.resolve(body),
    })),
  },
}));

describe("GET /api/health", () => {
  const originalEnv = process.env;
  const MOCK_UPTIME = 123.456;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    jest.spyOn(process, "uptime").mockReturnValue(MOCK_UPTIME);
  });

  afterAll(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it("1. Trả về status 200 và đúng cấu trúc thông tin hệ thống", async () => {
    process.env.NEXT_PUBLIC_APP_VERSION = "v1.0.0";

    const res = (await GET()) as any;
    const body = await res.json();

    expect(res.status).toBe(200);

    expect(body.status).toBe("ok");
    expect(body.version).toBe("v1.0.0");
    expect(body.environment).toBe(process.env.NODE_ENV);

    expect(body.uptime).toBe(MOCK_UPTIME);

    expect(body.timestamp).toEqual(expect.any(String));
    expect(isNaN(Date.parse(body.timestamp))).toBe(false);
  });

  it("2. Fallback version về 'unknown' nếu không có biến NEXT_PUBLIC_APP_VERSION", async () => {
    delete process.env.NEXT_PUBLIC_APP_VERSION;

    const res = (await GET()) as any;
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.version).toBe("unknown");
  });
});
