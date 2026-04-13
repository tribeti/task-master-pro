import { renderHook, waitFor } from '@testing-library/react';
import { useProjects } from '@/hooks/useProjects';
import * as projectService from '@/services/project.service';

// Mocking dependencies
jest.mock('@/services/project.service');
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  }
}));

describe('useProjects Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initially has no boards and is not loading if no userId is provided', async () => {
    const { result } = renderHook(() => useProjects());

    expect(result.current.ownedBoards).toEqual([]);
    expect(result.current.joinedBoards).toEqual([]);
    expect(result.current.boardsLoading).toBe(false);
  });

  it('fetches boards if userId is provided', async () => {
    const mockData = { ownedBoards: [{ id: 1, title: 'Test' } as any], joinedBoards: [] };
    // @ts-ignore
    projectService.fetchUserBoards.mockResolvedValue(mockData);

    const { result } = renderHook(() => useProjects('user123'));

    await waitFor(() => {
        expect(result.current.boardsLoading).toBe(false);
    });

    expect(projectService.fetchUserBoards).toHaveBeenCalled();
    expect(result.current.ownedBoards).toEqual(mockData.ownedBoards);
  });
});
