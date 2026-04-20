import { renderHook, act, waitFor } from "@testing-library/react";
import { useNotifications, resetCronTriggered } from "@/hooks/useNotifications";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { triggerDeadlineNotifications } from "@/app/actions/notification.actions";

jest.mock("@/utils/supabase/client");
jest.mock("sonner");
jest.mock("@/app/actions/notification.actions");

const mockToast = toast as jest.MockedFunction<typeof toast>;
const mockTriggerDeadline = triggerDeadlineNotifications as jest.MockedFunction<
  typeof triggerDeadlineNotifications
>;

describe("useNotifications Hook", () => {
  let supabaseMock: any;
  let realtimeCallback: (payload: any) => void;
  let mockChannel: any;
  let mockQuery: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    resetCronTriggered();

    // Setup Supabase Mock Chain
    // mockQuery is thenable so chains ending at .eq() (e.g. update().eq()) can be awaited
    mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
      update: jest.fn().mockReturnThis(),
      then: jest.fn((resolve) => resolve({ data: null, error: null })),
    };

    mockChannel = {
      on: jest.fn((event, config, callback) => {
        realtimeCallback = callback;
        return mockChannel;
      }),
      subscribe: jest.fn(() => mockChannel),
    };

    supabaseMock = {
      from: jest.fn().mockReturnValue(mockQuery),
      channel: jest.fn().mockReturnValue(mockChannel),
      removeChannel: jest.fn(),
    };

    (createClient as jest.Mock).mockReturnValue(supabaseMock);
    mockTriggerDeadline.mockResolvedValue(undefined);
  });

  const mockUserId = "user-123";

  it("should not fetch data if userId is undefined", () => {
    renderHook(() => useNotifications(undefined));
    expect(supabaseMock.from).not.toHaveBeenCalled();
  });

  it("should fetch notifications and set initial state correctly", async () => {
    const mockData = [
      { id: 1, content: "Notif 1", is_read: false, user_id: mockUserId },
      { id: 2, content: "Notif 2", is_read: true, user_id: mockUserId },
    ];
    mockQuery.order.mockResolvedValueOnce({ data: mockData, error: null });

    const { result } = renderHook(() => useNotifications(mockUserId));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(supabaseMock.from).toHaveBeenCalledWith("notifications");
    expect(result.current.notifications).toEqual(mockData);
    expect(result.current.unreadCount).toBe(1);
  });

  it("should call triggerDeadlineNotifications once on mount", async () => {
    renderHook(() => useNotifications(mockUserId));

    await waitFor(() => {
      expect(mockTriggerDeadline).toHaveBeenCalledTimes(1);
    });
  });

  describe("Realtime Subscriptions", () => {
    it("should handle INSERT event and show toast", async () => {
      // SỬA LỖI: Thêm "const { result } = "
      const { result } = renderHook(() => useNotifications(mockUserId));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const newNotif = {
        id: 3,
        content: "New Task",
        is_read: false,
        user_id: mockUserId,
      };

      act(() => {
        realtimeCallback({ eventType: "INSERT", new: newNotif });
      });

      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(1);
        expect(result.current.unreadCount).toBe(1);
      });

      expect(mockToast).toHaveBeenCalledWith("Thông báo mới", {
        description: "New Task",
        action: expect.any(Object),
      });
    });

    it("should not duplicate INSERT event if notification already exists", async () => {
      const existingNotif = {
        id: 1,
        content: "Existing",
        is_read: false,
        user_id: mockUserId,
      };
      mockQuery.order.mockResolvedValueOnce({
        data: [existingNotif],
        error: null,
      });

      // SỬA LỖI: Thêm "const { result } = "
      const { result } = renderHook(() => useNotifications(mockUserId));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => {
        realtimeCallback({ eventType: "INSERT", new: existingNotif });
      });

      expect(result.current.notifications).toHaveLength(1);
    });

    it("should handle UPDATE event", async () => {
      const initialNotif = {
        id: 1,
        content: "Update me",
        is_read: false,
        user_id: mockUserId,
      };
      mockQuery.order.mockResolvedValueOnce({
        data: [initialNotif],
        error: null,
      });

      const { result } = renderHook(() => useNotifications(mockUserId));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.unreadCount).toBe(1);

      act(() => {
        realtimeCallback({
          eventType: "UPDATE",
          new: { ...initialNotif, is_read: true },
        });
      });

      await waitFor(() => {
        expect(result.current.notifications[0].is_read).toBe(true);
        expect(result.current.unreadCount).toBe(0);
      });
    });

    it("should handle DELETE event", async () => {
      const initialNotif = {
        id: 1,
        content: "Delete me",
        is_read: false,
        user_id: mockUserId,
      };
      mockQuery.order.mockResolvedValueOnce({
        data: [initialNotif],
        error: null,
      });

      const { result } = renderHook(() => useNotifications(mockUserId));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => {
        realtimeCallback({ eventType: "DELETE", old: { id: 1 } });
      });

      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(0);
        expect(result.current.unreadCount).toBe(0);
      });
    });
  });

  describe("Actions", () => {
    it("markAsRead should optimistically update state and call supabase", async () => {
      const initialNotif = {
        id: 1,
        content: "Mark me",
        is_read: false,
        user_id: mockUserId,
      };
      mockQuery.order.mockResolvedValueOnce({
        data: [initialNotif],
        error: null,
      });


      const { result } = renderHook(() => useNotifications(mockUserId));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.markAsRead(1);
      });

      expect(result.current.notifications[0].is_read).toBe(true);
      expect(result.current.unreadCount).toBe(0);

      expect(supabaseMock.from).toHaveBeenCalledWith("notifications");
      expect(mockQuery.update).toHaveBeenCalledWith({ is_read: true });
      expect(mockQuery.eq).toHaveBeenCalledWith("id", 1);
    });

    it("markAllAsRead should optimistically update state and call supabase", async () => {
      const mockData = [
        { id: 1, content: "A", is_read: false, user_id: mockUserId },
        { id: 2, content: "B", is_read: false, user_id: mockUserId },
      ];
      mockQuery.order.mockResolvedValueOnce({ data: mockData, error: null });


      const { result } = renderHook(() => useNotifications(mockUserId));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.unreadCount).toBe(2);

      await act(async () => {
        await result.current.markAllAsRead();
      });

      expect(result.current.unreadCount).toBe(0);
      expect(result.current.notifications.every((n) => n.is_read)).toBe(true);

      expect(supabaseMock.from).toHaveBeenCalledWith("notifications");
      expect(mockQuery.update).toHaveBeenCalledWith({ is_read: true });
      expect(mockQuery.eq).toHaveBeenCalledWith("user_id", mockUserId);
      expect(mockQuery.eq).toHaveBeenCalledWith("is_read", false);
    });
  });

  it("should unsubscribe from channel on unmount", () => {
    const { unmount } = renderHook(() => useNotifications(mockUserId));

    act(() => {
      unmount();
    });

    expect(supabaseMock.removeChannel).toHaveBeenCalledWith(mockChannel);
  });
});
