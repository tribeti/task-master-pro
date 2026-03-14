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

  it('initially loads empty without user id', () => {
    const { result } = renderHook(() => useProjects());

    expect(result.current.boardsLoading).toBe(false);
    expect(result.current.boards).toEqual([]);
    expect(fetchUserBoards).not.toHaveBeenCalled();
  });

  it('fetches boards on mount if userId is provided', async () => {
    const mockBoards = [{ id: 1, title: 'Test Board' }];
    (fetchUserBoards as jest.Mock).mockResolvedValue(mockBoards);

    const { result } = renderHook(() => useProjects('user-1'));

    expect(result.current.boardsLoading).toBe(true);

    // Wait for async effect to settle
    await act(async () => {
      await Promise.resolve();
    });

    expect(fetchUserBoards).toHaveBeenCalledWith('user-1');
    expect(result.current.boardsLoading).toBe(false);
    expect(result.current.boards).toEqual(mockBoards);
  });

  it('handles fetch board errors', async () => {
    (fetchUserBoards as jest.Mock).mockRejectedValue(new Error('Fetch failed'));

    const { result } = renderHook(() => useProjects('user-1'));

    await act(async () => {
      await Promise.resolve();
    });

    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Fetch failed'));
    expect(result.current.boardsLoading).toBe(false);
    expect(result.current.boards).toEqual([]);
  });

  it('deletes a project and refetches boards', async () => {
    (deleteUserBoard as jest.Mock).mockResolvedValue(true);
    (fetchUserBoards as jest.Mock).mockResolvedValue([]); // refetch returns empty

    const { result } = renderHook(() => useProjects('user-1'));

    // initial fetch completes
    await act(async () => {
      await Promise.resolve();
    });

    let deleteResult;
    await act(async () => {
      deleteResult = await result.current.confirmDeleteProject(10);
    });

    expect(deleteUserBoard).toHaveBeenCalledWith(10, 'user-1');
    expect(toast.success).toHaveBeenCalledWith('Project deleted successfully!');
    expect(fetchUserBoards).toHaveBeenCalledTimes(2); // once initial, once after delete
    expect(deleteResult).toBe(true);
  });

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
});
