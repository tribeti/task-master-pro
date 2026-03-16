import { renderHook, act } from '@testing-library/react';
import { useProjects } from '@/hooks/useProjects';
import { fetchUserBoards, deleteUserBoard, createNewBoard, createDefaultColumns } from '@/services/project.service';
import { toast } from 'sonner';

// Mock the service functions
jest.mock('@/services/project.service', () => ({
  fetchUserBoards: jest.fn(),
  deleteUserBoard: jest.fn(),
  createNewBoard: jest.fn(),
  createDefaultColumns: jest.fn(),
}));

// Mock the toaster
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  },
}));

describe('useProjects Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Initial State ──────────────────────────────────────────────────────────

  it('initially loads empty without user id', () => {
    const { result } = renderHook(() => useProjects());

    expect(result.current.boardsLoading).toBe(false);
    expect(result.current.boards).toEqual([]);
    expect(fetchUserBoards).not.toHaveBeenCalled();
  });

  it('exposes isSubmitting as false initially', () => {
    const { result } = renderHook(() => useProjects());
    expect(result.current.isSubmitting).toBe(false);
  });

  // ── fetchBoards ────────────────────────────────────────────────────────────

  it('fetches boards on mount if userId is provided', async () => {
    const mockBoards = [{ id: 1, title: 'Test Board' }];
    (fetchUserBoards as jest.Mock).mockResolvedValue(mockBoards);

    const { result } = renderHook(() => useProjects('user-1'));

    expect(result.current.boardsLoading).toBe(true);

    await act(async () => {
      await Promise.resolve();
    });

    expect(fetchUserBoards).toHaveBeenCalledWith('user-1');
    expect(result.current.boardsLoading).toBe(false);
    expect(result.current.boards).toEqual(mockBoards);
  });

  it('handles fetch board errors (covers lines 50-54: catch branch)', async () => {
    (fetchUserBoards as jest.Mock).mockRejectedValue(new Error('Fetch failed'));

    const { result } = renderHook(() => useProjects('user-1'));

    await act(async () => {
      await Promise.resolve();
    });

    // Covers the catch block that calls toast.error and resets boards
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Fetch failed'));
    expect(result.current.boardsLoading).toBe(false);
    expect(result.current.boards).toEqual([]);
  });

  it('handles fetch error with no message (covers unknown error branch)', async () => {
    (fetchUserBoards as jest.Mock).mockRejectedValue({});

    const { result } = renderHook(() => useProjects('user-1'));

    await act(async () => {
      await Promise.resolve();
    });

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('Unknown error'),
    );
    expect(result.current.boards).toEqual([]);
  });

  // ── confirmDeleteProject ───────────────────────────────────────────────────

  it('deletes a project and refetches boards', async () => {
    (deleteUserBoard as jest.Mock).mockResolvedValue(true);
    (fetchUserBoards as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useProjects('user-1'));

    await act(async () => {
      await Promise.resolve();
    });

    let deleteResult;
    await act(async () => {
      deleteResult = await result.current.confirmDeleteProject(10);
    });

    expect(deleteUserBoard).toHaveBeenCalledWith(10, 'user-1');
    expect(toast.success).toHaveBeenCalledWith('Project deleted successfully!');
    expect(fetchUserBoards).toHaveBeenCalledTimes(2);
    expect(deleteResult).toBe(true);
  });

  it('returns false when confirmDeleteProject called without userId', async () => {
    const { result } = renderHook(() => useProjects());

    let deleteResult;
    await act(async () => {
      deleteResult = await result.current.confirmDeleteProject(10);
    });

    expect(deleteUserBoard).not.toHaveBeenCalled();
    expect(deleteResult).toBe(false);
  });

  it('handles delete error and returns false (covers delete catch branch)', async () => {
    (deleteUserBoard as jest.Mock).mockRejectedValue(new Error('Delete failed'));
    (fetchUserBoards as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useProjects('user-1'));

    await act(async () => {
      await Promise.resolve();
    });

    let deleteResult;
    await act(async () => {
      deleteResult = await result.current.confirmDeleteProject(10);
    });

    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Delete failed'));
    expect(deleteResult).toBe(false);
  });

  it('handles delete error with no message (unknown error branch)', async () => {
    (deleteUserBoard as jest.Mock).mockRejectedValue({});
    (fetchUserBoards as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useProjects('user-1'));

    await act(async () => {
      await Promise.resolve();
    });

    let deleteResult;
    await act(async () => {
      deleteResult = await result.current.confirmDeleteProject(10);
    });

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('Unknown error'),
    );
    expect(deleteResult).toBe(false);
  });

  // ── handleCreateProject ────────────────────────────────────────────────────

  it('creates a project, adds default columns, and refetches', async () => {
    const mockCreatedBoard = { id: 99, title: 'New Board' };
    (createNewBoard as jest.Mock).mockResolvedValue(mockCreatedBoard);
    (createDefaultColumns as jest.Mock).mockResolvedValue(true);
    (fetchUserBoards as jest.Mock).mockResolvedValue([mockCreatedBoard]);

    const { result } = renderHook(() => useProjects('user-1'));

    await act(async () => {
      await Promise.resolve();
    });

    const newProjectData = {
      title: 'New Board',
      description: 'Desc',
      is_private: true,
      color: 'red',
      tag: 'design',
      projectDeadline: '',
      selectedTeamMembers: [],
    };

    let createResult;
    await act(async () => {
      createResult = await result.current.handleCreateProject(newProjectData);
    });

    expect(createNewBoard).toHaveBeenCalledWith('user-1', {
      title: 'New Board',
      description: 'Desc',
      is_private: true,
      color: 'red',
      tag: 'design',
    });
    expect(createDefaultColumns).toHaveBeenCalledWith(99);
    expect(toast.success).toHaveBeenCalledWith('Project created successfully!');
    expect(createResult).toBe(true);
  });

  it('returns false when handleCreateProject called without userId', async () => {
    const { result } = renderHook(() => useProjects());

    let createResult;
    await act(async () => {
      createResult = await result.current.handleCreateProject({
        title: 'Board',
        description: '',
        is_private: false,
        color: 'blue',
        tag: 'work',
        projectDeadline: '',
        selectedTeamMembers: [],
      });
    });

    expect(createNewBoard).not.toHaveBeenCalled();
    expect(createResult).toBe(false);
  });

  it('handles createDefaultColumns failure with warning (covers lines 83-86)', async () => {
    const mockCreatedBoard = { id: 99, title: 'New Board' };
    (createNewBoard as jest.Mock).mockResolvedValue(mockCreatedBoard);
    // createDefaultColumns throws so we hit the inner catch
    (createDefaultColumns as jest.Mock).mockRejectedValue(new Error('Columns failed'));
    (fetchUserBoards as jest.Mock).mockResolvedValue([mockCreatedBoard]);

    const { result } = renderHook(() => useProjects('user-1'));

    await act(async () => {
      await Promise.resolve();
    });

    let createResult;
    await act(async () => {
      createResult = await result.current.handleCreateProject({
        title: 'New Board',
        description: 'Desc',
        is_private: false,
        color: 'blue',
        tag: 'work',
        projectDeadline: '',
        selectedTeamMembers: [],
      });
    });

    // toast.warning should be called for the columns error
    expect(toast.warning).toHaveBeenCalledWith(
      expect.stringContaining('Columns failed'),
    );
    // Overall creation still succeeds
    expect(createResult).toBe(true);
  });

  it('handles createNewBoard failure and returns false (covers lines 91-94)', async () => {
    (createNewBoard as jest.Mock).mockRejectedValue(new Error('Board creation failed'));
    (fetchUserBoards as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useProjects('user-1'));

    await act(async () => {
      await Promise.resolve();
    });

    let createResult;
    await act(async () => {
      createResult = await result.current.handleCreateProject({
        title: 'Failing Board',
        description: '',
        is_private: false,
        color: 'blue',
        tag: 'work',
        projectDeadline: '',
        selectedTeamMembers: [],
      });
    });

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('Board creation failed'),
    );
    expect(createResult).toBe(false);
    // isSubmitting should be reset to false in finally
    expect(result.current.isSubmitting).toBe(false);
  });

  it('handles createNewBoard failure with no message (unknown error branch)', async () => {
    (createNewBoard as jest.Mock).mockRejectedValue({});
    (fetchUserBoards as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useProjects('user-1'));

    await act(async () => {
      await Promise.resolve();
    });

    let createResult;
    await act(async () => {
      createResult = await result.current.handleCreateProject({
        title: 'Board',
        description: null as any,
        is_private: false,
        color: 'blue',
        tag: 'work',
        projectDeadline: '',
        selectedTeamMembers: [],
      });
    });

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('Unknown error'),
    );
    expect(createResult).toBe(false);
  });

  it('passes null description when empty string provided', async () => {
    const mockCreatedBoard = { id: 77, title: 'No Desc Board' };
    (createNewBoard as jest.Mock).mockResolvedValue(mockCreatedBoard);
    (createDefaultColumns as jest.Mock).mockResolvedValue(true);
    (fetchUserBoards as jest.Mock).mockResolvedValue([mockCreatedBoard]);

    const { result } = renderHook(() => useProjects('user-1'));

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      await result.current.handleCreateProject({
        title: 'No Desc Board',
        description: '',  // empty → should become null
        is_private: false,
        color: 'green',
        tag: 'personal',
        projectDeadline: '',
        selectedTeamMembers: [],
      });
    });

    expect(createNewBoard).toHaveBeenCalledWith('user-1', expect.objectContaining({
      description: null,
    }));
  });
});
