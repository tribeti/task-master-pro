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
      in: jest.fn().mockReturnThis(),
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
    it('should successfully delete a board if all tasks are done', async () => {
      const columns = [
        { id: 1, title: 'To Do' },
        { id: 2, title: 'Done' },
      ];
      let fromCallCount = 0;

      mockSupabase.from.mockImplementation((table: string) => {
        fromCallCount += 1;
        const chain: any = {
          select: jest.fn().mockReturnThis(),
          delete: jest.fn().mockReturnThis(),
          eq: jest.fn(),
          in: jest.fn(),
        };

        if (fromCallCount === 1 && table === 'columns') {
          chain.eq.mockImplementation((field: string) => {
            if (field === 'board_id') {
              return Promise.resolve({ data: columns, error: null });
            }
            return Promise.resolve({ data: null, error: null });
          });
          return chain;
        }

        if (fromCallCount === 2 && table === 'tasks') {
          chain.in.mockImplementation((field: string) => {
            if (field === 'column_id') {
              return Promise.resolve({ data: [], error: null });
            }
            return Promise.resolve({ data: null, error: null });
          });
          return chain;
        }

        if (fromCallCount === 3 && table === 'tasks') {
          chain.in.mockImplementation((field: string) => {
            if (field === 'column_id') {
              return Promise.resolve({ error: null });
            }
            return Promise.resolve({ error: null });
          });
          return chain;
        }

        if (fromCallCount === 4 && table === 'columns') {
          chain.eq.mockResolvedValue({ error: null });
          return chain;
        }

        if (fromCallCount === 5 && table === 'boards') {
          chain.eq.mockImplementation((field: string) => {
            if (field === 'id') return chain;
            if (field === 'owner_id') return Promise.resolve({ error: null });
            return Promise.resolve({ error: null });
          });
          return chain;
        }

        return chain;
      });

      await deleteUserBoard(10, 'user-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('columns');
      expect(mockSupabase.from).toHaveBeenCalledWith('tasks');
      expect(mockSupabase.from).toHaveBeenCalledWith('boards');
    });

    it('should block deletion when tasks exist outside Done column', async () => {
      const columns = [
        { id: 1, title: 'To Do' },
        { id: 2, title: 'Done' },
      ];
      let fromCallCount = 0;

      mockSupabase.from.mockImplementation((table: string) => {
        fromCallCount += 1;
        const chain: any = {
          select: jest.fn().mockReturnThis(),
          delete: jest.fn().mockReturnThis(),
          eq: jest.fn(),
          in: jest.fn(),
        };

        if (fromCallCount === 1 && table === 'columns') {
          chain.eq.mockImplementation((field: string) => {
            if (field === 'board_id') {
              return Promise.resolve({ data: columns, error: null });
            }
            return Promise.resolve({ data: null, error: null });
          });
          return chain;
        }

        if (fromCallCount === 2 && table === 'tasks') {
          chain.in.mockResolvedValue({ data: [{ id: 123 }], error: null });
          return chain;
        }

        return chain;
      });

      await expect(deleteUserBoard(10, 'user-1')).rejects.toThrow(
        'Cannot delete project while there are tasks outside the Done column',
      );
    });

    it('should throw an error if delete fails', async () => {
      const columns: Array<{id:number;title:string}> = [];
      let fromCallCount = 0;

      mockSupabase.from.mockImplementation((table: string) => {
        fromCallCount += 1;
        const chain: any = {
          select: jest.fn().mockReturnThis(),
          delete: jest.fn().mockReturnThis(),
          eq: jest.fn(),
          in: jest.fn(),
        };

        if (fromCallCount === 1 && table === 'columns') {
          chain.eq.mockImplementation((field: string) => {
            if (field === 'board_id') {
              return Promise.resolve({ data: columns, error: null });
            }
            return Promise.resolve({ data: null, error: null });
          });
          return chain;
        }

        if (fromCallCount === 2 && table === 'boards') {
          chain.eq.mockImplementation((field: string) => {
            if (field === 'id') return chain;
            if (field === 'owner_id') {
              return Promise.resolve({ error: { message: 'Delete error' } });
            }
            return Promise.resolve({ error: null });
          });
          return chain;
        }

        return chain;
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
