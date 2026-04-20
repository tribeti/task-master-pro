import { POST } from "@/app/api/kanban/tasks/[taskId]/comments/route";
import { createClient } from "@/utils/supabase/server";
import { verifyTaskAccess, validateString } from "@/utils/board-access";

// --- MOCKING DEPENDENCIES ---
jest.mock("@/utils/supabase/server", () => ({
  createClient: jest.fn(),
}));

jest.mock("@/utils/board-access", () => ({
  verifyTaskAccess: jest.fn(),
  validateString: jest.fn(),
}));

// Helper function tạo Request
const createRequest = (bodyParams?: any) => {
  return new Request("http://localhost/api/kanban/tasks/123/comments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: bodyParams ? JSON.stringify(bodyParams) : undefined,
  });
};

// Helper function tạo Context cho dynamic route
const createContext = (taskId: string = "123") => ({
  params: Promise.resolve({ taskId }),
});

describe("Task Comments API (POST)", () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock chaining của Supabase
    mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
          error: null,
        }),
      },
      from: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn(),
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);

    // Mặc định validateString sẽ trả về chính string đó
    (validateString as jest.Mock).mockImplementation((val) => val);
    // Mặc định user có quyền truy cập task
    (verifyTaskAccess as jest.Mock).mockResolvedValue(undefined);
  });

  describe("POST /api/kanban/tasks/[taskId]/comments", () => {
    it("nên trả về 401 nếu user chưa đăng nhập", async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null } });

      const req = createRequest({ content: "Hello comment" });
      const res = await POST(req, createContext());

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe("Unauthorized");
    });

    it("nên trả về lỗi (500) nếu user không có quyền truy cập task", async () => {
      // Mock verifyTaskAccess ném lỗi
      (verifyTaskAccess as jest.Mock).mockRejectedValueOnce(
        new Error("No access to this task"),
      );

      const req = createRequest({ content: "Test content" });
      const res = await POST(req, createContext());

      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error).toBe("No access to this task");
    });

    it("nên trả về lỗi (500) nếu dữ liệu content không hợp lệ (validateString ném lỗi)", async () => {
      (validateString as jest.Mock).mockImplementationOnce(() => {
        throw new Error("Invalid comment length");
      });

      const req = createRequest({ content: "" }); // Gửi chuỗi rỗng ví dụ
      const res = await POST(req, createContext());

      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error).toBe("Invalid comment length");
    });

    it("nên trả về 500 nếu Supabase insert comment thất bại", async () => {
      // Mock single() trả về lỗi ở bước cuối của chuỗi insert
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: "Database insert error" },
      });

      const req = createRequest({ content: "This will fail" });
      const res = await POST(req, createContext());

      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error).toBe("Database insert error");
    });

    it("nên tạo comment thành công và trả về dữ liệu comment", async () => {
      const mockCommentData = {
        id: 1,
        content: "This is a valid comment",
        task_id: 123,
        user_id: "user-123",
      };

      // Mock chuỗi insert thành công
      mockSupabase.single.mockResolvedValueOnce({
        data: mockCommentData,
        error: null,
      });

      const req = createRequest({ content: "This is a valid comment" });
      const res = await POST(req, createContext());

      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json).toEqual(mockCommentData);

      // Kiểm tra hàm insert được gọi đúng với payload
      expect(mockSupabase.from).toHaveBeenCalledWith("comments");
      expect(mockSupabase.insert).toHaveBeenCalledWith([
        {
          content: "This is a valid comment",
          task_id: 123,
          user_id: "user-123",
        },
      ]);
    });
  });
});
