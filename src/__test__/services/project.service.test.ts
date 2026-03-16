import { fetchUserBoards, deleteUserBoard, createNewBoard, createDefaultColumns } from '@/services/project.service';
import { createClient } from '@/utils/supabase/client';
import { createClient as createServerClient } from '@/utils/supabase/server';

// Mock the Supabase clients
jest.mock('@/utils/supabase/client', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

describe('project.service', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
      },
    };
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
    (createServerClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchUserBoards', () => {
    it('should return boards for a user', async () => {
      const mockBoards = [{ id: 1, title: 'Test Board' }];
      mockSupabase.order.mockResolvedValue({ data: mockBoards, error: null });

      const result = await fetchUserBoards('user-1');
      expect(mockSupabase.from).toHaveBeenCalledWith('boards');
      expect(mockSupabase.eq).toHaveBeenCalledWith('owner_id', 'user-1');
      expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual(mockBoards);
    });

    it('should throw an error if fetch fails', async () => {
      mockSupabase.order.mockResolvedValue({ data: null, error: { message: 'Fetch error' } });
      await expect(fetchUserBoards('user-1')).rejects.toThrow('Failed to fetch projects.');
    });
  });

  describe('deleteUserBoard', () => {
    it('should successfully delete a board', async () => {
      const secondEqMock = jest.fn().mockResolvedValue({ error: null });
      mockSupabase.eq.mockReturnValue({
        eq: secondEqMock,
      });

      await deleteUserBoard(10, 'user-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('boards');
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 10);
      expect(secondEqMock).toHaveBeenCalledWith('owner_id', 'user-1');
    });

    it('should throw an error if delete fails', async () => {
      mockSupabase.eq.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: { message: 'Delete error' } }),
      });
      await expect(deleteUserBoard(10, 'user-1')).rejects.toThrow('Failed to delete project.');
    });
  });

  describe('createNewBoard', () => {
    const mockBoardData = {
      title: 'New Board',
      description: 'Desc',
      is_private: true,
      color: 'blue',
      tag: 'work',
    };

    it('should create and return a new board', async () => {
      const returnedBoard = { id: 10, ...mockBoardData, owner_id: 'user-1' };
      mockSupabase.select.mockResolvedValue({ data: [returnedBoard], error: null });

      const result = await createNewBoard('user-1', mockBoardData);

      expect(mockSupabase.from).toHaveBeenCalledWith('boards');
      expect(mockSupabase.insert).toHaveBeenCalledWith([{ ...mockBoardData, owner_id: 'user-1' }]);
      expect(result).toEqual(returnedBoard);
    });

    it('should throw an error if insert fails', async () => {
      mockSupabase.select.mockResolvedValue({ data: null, error: { message: 'Insert error' } });
      await expect(createNewBoard('user-1', mockBoardData)).rejects.toThrow('Failed to create project.');
    });

    it('should throw an error if no data is returned', async () => {
      mockSupabase.select.mockResolvedValue({ data: [], error: null });
      await expect(createNewBoard('user-1', mockBoardData)).rejects.toThrow('Failed to create project: No data returned');
    });
  });

  describe('createDefaultColumns', () => {
    it('should insert default columns', async () => {
      mockSupabase.insert.mockResolvedValue({ error: null });

      await createDefaultColumns(15);

      expect(mockSupabase.from).toHaveBeenCalledWith('columns');
      expect(mockSupabase.insert).toHaveBeenCalledWith([
        { title: 'To Do', board_id: 15, position: 0 },
        { title: 'In Progress', board_id: 15, position: 1 },
        { title: 'Done', board_id: 15, position: 2 },
      ]);
    });

    it('should throw an error if columns insert fails', async () => {
      mockSupabase.insert.mockResolvedValue({ error: { message: 'Columns error' } });
      await expect(createDefaultColumns(15)).rejects.toThrow('Failed to create default columns.');
    });
  });
});
