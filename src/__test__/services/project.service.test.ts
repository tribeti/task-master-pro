import {
  fetchUserBoards,
  createNewBoard,
  createDefaultColumns,
  updateUserBoard,
  deleteUserBoard,
} from "@/services/project.service";

describe("Project Service", () => {
  // Lưu lại fetch gốc
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  describe("fetchUserBoards", () => {
    it("should return boards successfully", async () => {
      const mockData = {
        ownedBoards: [{ id: 1, title: "Test API" }],
        joinedBoards: [],
      };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      const result = await fetchUserBoards();
      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith("/api/boards", {
        method: "GET",
      });
    });

    it("should throw specific error on API failure", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Unauthorized access" }),
      });

      await expect(fetchUserBoards()).rejects.toThrow("Unauthorized access");
    });

    it("should throw fallback error if JSON parsing fails", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => {
          throw new Error("Network error");
        },
      });

      await expect(fetchUserBoards()).rejects.toThrow("Failed to fetch boards");
    });
  });

  describe("createNewBoard", () => {
    const newBoardData = {
      title: "New API Board",
      description: "Desc",
      is_private: true,
      color: "#fff",
      tag: "General",
    };

    it("should send correct POST request to create board", async () => {
      const mockResponse = { id: 2, ...newBoardData };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await createNewBoard("user_123", newBoardData);
      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/boards",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newBoardData),
        }),
      );
    });

    it("should handle validation/creation error from API", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Missing required field" }),
      });

      await expect(createNewBoard("user123", newBoardData)).rejects.toThrow(
        "Missing required field",
      );
    });

    it("should throw fallback error on create failure without message", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({}), // Trả về object rỗng không có error field
      });

      await expect(createNewBoard("user123", newBoardData)).rejects.toThrow(
        "Failed to create project.",
      );
    });
  });

  describe("createDefaultColumns", () => {
    it("should send correct POST request to create default columns", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

      await createDefaultColumns(10);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/boards/10/columns/default",
        {
          method: "POST",
        },
      );
    });

    it("should throw fallback error on API failure", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => {
          throw new Error("Parse error");
        },
      });

      await expect(createDefaultColumns(10)).rejects.toThrow(
        "Failed to create default columns.",
      );
    });
  });

  describe("updateUserBoard", () => {
    const updateData = { title: "Updated Title" };

    it("should send correct PUT request to update board", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

      await updateUserBoard("user_123", 10, updateData);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/boards/10",
        expect.objectContaining({
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        }),
      );
    });

    it("should throw specific error from API", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Not allowed to update" }),
      });

      await expect(updateUserBoard("user_123", 10, updateData)).rejects.toThrow(
        "Not allowed to update",
      );
    });

    it("should throw fallback error on API failure", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({}),
      });

      await expect(updateUserBoard("user_123", 10, updateData)).rejects.toThrow(
        "Failed to update project.",
      );
    });
  });

  describe("deleteUserBoard", () => {
    it("should send correct DELETE request", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

      await deleteUserBoard(10, "user_123");
      expect(global.fetch).toHaveBeenCalledWith("/api/boards/10", {
        method: "DELETE",
      });
    });

    it("should throw specific error from API", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Board not found" }),
      });

      await expect(deleteUserBoard(10, "user_123")).rejects.toThrow(
        "Board not found",
      );
    });

    it("should throw fallback error on API failure", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => {
          throw new Error("Server dead");
        },
      });

      await expect(deleteUserBoard(10, "user_123")).rejects.toThrow(
        "Failed to delete project.",
      );
    });
  });
});
