import {
  fetchUserBoardsAction,
  deleteUserBoardAction,
  createNewBoardAction,
  createDefaultColumnsAction,
} from '@/app/actions/project.actions';
import { createClient } from '@/utils/supabase/server';

// Mock the server Supabase client
jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
}));

// Mock next/cache and sonner (side-effect dependencies)
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
    warning: jest.fn(),
  },
}));

// ── Helper: build a chainable Supabase mock ────────────────────────────────
function buildMockSupabase(overrides: Record<string, any> = {}) {
  const mock: any = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
    auth: {
      getUser: jest
        .fn()
        .mockResolvedValue({ data: { user: { id: 'user-1' } } }),
    },
    ...overrides,
  };
  return mock;
}

describe('project.actions', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  fetchUserBoardsAction
  // ══════════════════════════════════════════════════════════════════════════
  describe('fetchUserBoardsAction', () => {
    it('returns boards when auth matches userId', async () => {
      const mockBoards = [{ id: 1, title: 'Board A' }];
      const mockSupabase = buildMockSupabase();
      mockSupabase.order.mockResolvedValue({ data: mockBoards, error: null });
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const result = await fetchUserBoardsAction('user-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('boards');
      expect(mockSupabase.eq).toHaveBeenCalledWith('owner_id', 'user-1');
      expect(mockSupabase.order).toHaveBeenCalledWith('created_at', {
        ascending: false,
      });
      expect(result).toEqual(mockBoards);
    });

    it('returns empty array when data is null', async () => {
      const mockSupabase = buildMockSupabase();
      mockSupabase.order.mockResolvedValue({ data: null, error: null });
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const result = await fetchUserBoardsAction('user-1');
      expect(result).toEqual([]);
    });

    it('throws Unauthorized when no user in session', async () => {
      const mockSupabase = buildMockSupabase({
        auth: {
          getUser: jest
            .fn()
            .mockResolvedValue({ data: { user: null } }),
        },
      });
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      await expect(fetchUserBoardsAction('user-1')).rejects.toThrow(
        'Unauthorized access',
      );
    });

    it('throws Unauthorized when session userId does not match', async () => {
      const mockSupabase = buildMockSupabase({
        auth: {
          getUser: jest
            .fn()
            .mockResolvedValue({ data: { user: { id: 'other-user' } } }),
        },
      });
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      await expect(fetchUserBoardsAction('user-1')).rejects.toThrow(
        'Unauthorized access',
      );
    });

    it('throws when supabase query returns an error', async () => {
      const mockSupabase = buildMockSupabase();
      mockSupabase.order.mockResolvedValue({
        data: null,
        error: { message: 'DB error' },
      });
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      await expect(fetchUserBoardsAction('user-1')).rejects.toThrow(
        'Failed to fetch projects.',
      );
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  deleteUserBoardAction
  // ══════════════════════════════════════════════════════════════════════════
  describe('deleteUserBoardAction', () => {
    it('deletes successfully', async () => {
      const secondEq = jest.fn().mockResolvedValue({ error: null });
      const mockSupabase = buildMockSupabase({
        eq: jest.fn().mockReturnValue({ eq: secondEq }),
      });
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      await expect(deleteUserBoardAction(10, 'user-1')).resolves.toBeUndefined();
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 10);
      expect(secondEq).toHaveBeenCalledWith('owner_id', 'user-1');
    });

    it('throws Unauthorized when user is null', async () => {
      const mockSupabase = buildMockSupabase({
        auth: {
          getUser: jest
            .fn()
            .mockResolvedValue({ data: { user: null } }),
        },
      });
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      await expect(deleteUserBoardAction(10, 'user-1')).rejects.toThrow(
        'Unauthorized access',
      );
    });

    it('throws Unauthorized when user id does not match', async () => {
      const mockSupabase = buildMockSupabase({
        auth: {
          getUser: jest
            .fn()
            .mockResolvedValue({ data: { user: { id: 'wrong-user' } } }),
        },
      });
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      await expect(deleteUserBoardAction(10, 'user-1')).rejects.toThrow(
        'Unauthorized access',
      );
    });

    it('throws when delete query returns an error', async () => {
      const secondEq = jest
        .fn()
        .mockResolvedValue({ error: { message: 'Delete failed' } });
      const mockSupabase = buildMockSupabase({
        eq: jest.fn().mockReturnValue({ eq: secondEq }),
      });
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      await expect(deleteUserBoardAction(10, 'user-1')).rejects.toThrow(
        'Failed to delete project.',
      );
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  createNewBoardAction
  // ══════════════════════════════════════════════════════════════════════════
  describe('createNewBoardAction', () => {
    const validBoardData = {
      title: 'New Board',
      description: 'A test board',
      is_private: false,
      color: 'blue',
      tag: 'work',
    };

    it('creates a board and returns it', async () => {
      const created = { id: 50, ...validBoardData, owner_id: 'user-1' };
      const mockSupabase = buildMockSupabase();
      mockSupabase.select.mockResolvedValue({ data: [created], error: null });
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const result = await createNewBoardAction('user-1', validBoardData);

      expect(mockSupabase.from).toHaveBeenCalledWith('boards');
      expect(mockSupabase.insert).toHaveBeenCalledWith([
        expect.objectContaining({ title: 'New Board', owner_id: 'user-1' }),
      ]);
      expect(result).toEqual(created);
    });

    it('trims and validates title correctly', async () => {
      const created = { id: 51 };
      const mockSupabase = buildMockSupabase();
      mockSupabase.select.mockResolvedValue({ data: [created], error: null });
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      await createNewBoardAction('user-1', {
        ...validBoardData,
        title: '  Trimmed Title  ',
      });

      expect(mockSupabase.insert).toHaveBeenCalledWith([
        expect.objectContaining({ title: 'Trimmed Title' }),
      ]);
    });

    it('accepts null description (null stays null)', async () => {
      const created = { id: 52 };
      const mockSupabase = buildMockSupabase();
      mockSupabase.select.mockResolvedValue({ data: [created], error: null });
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      await createNewBoardAction('user-1', { ...validBoardData, description: null });

      expect(mockSupabase.insert).toHaveBeenCalledWith([
        expect.objectContaining({ description: null }),
      ]);
    });

    it('throws Unauthorized when no user in session', async () => {
      const mockSupabase = buildMockSupabase({
        auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
      });
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      await expect(
        createNewBoardAction('user-1', validBoardData),
      ).rejects.toThrow('Unauthorized access');
    });

    it('throws Unauthorized when user id does not match', async () => {
      const mockSupabase = buildMockSupabase({
        auth: {
          getUser: jest
            .fn()
            .mockResolvedValue({ data: { user: { id: 'other' } } }),
        },
      });
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      await expect(
        createNewBoardAction('user-1', validBoardData),
      ).rejects.toThrow('Unauthorized access');
    });

    it('throws when title is empty (validateString guard)', async () => {
      const mockSupabase = buildMockSupabase();
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      await expect(
        createNewBoardAction('user-1', { ...validBoardData, title: '   ' }),
      ).rejects.toThrow('Project title is required.');
    });

    it('throws when title exceeds max length (validateString guard)', async () => {
      const mockSupabase = buildMockSupabase();
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      await expect(
        createNewBoardAction('user-1', {
          ...validBoardData,
          title: 'A'.repeat(101),
        }),
      ).rejects.toThrow('Project title must be 100 characters or less.');
    });

    it('throws when tag is empty (validateString guard)', async () => {
      const mockSupabase = buildMockSupabase();
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      await expect(
        createNewBoardAction('user-1', { ...validBoardData, tag: '' }),
      ).rejects.toThrow('Tag is required.');
    });

    it('throws when color is empty (validateString guard)', async () => {
      const mockSupabase = buildMockSupabase();
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      await expect(
        createNewBoardAction('user-1', { ...validBoardData, color: '  ' }),
      ).rejects.toThrow('Color is required.');
    });

    it('throws when insert returns an error', async () => {
      const mockSupabase = buildMockSupabase();
      mockSupabase.select.mockResolvedValue({
        data: null,
        error: { message: 'Insert error' },
      });
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      await expect(
        createNewBoardAction('user-1', validBoardData),
      ).rejects.toThrow('Failed to create project.');
    });

    it('throws when insert returns empty data', async () => {
      const mockSupabase = buildMockSupabase();
      mockSupabase.select.mockResolvedValue({ data: [], error: null });
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      await expect(
        createNewBoardAction('user-1', validBoardData),
      ).rejects.toThrow('Failed to create project: No data returned.');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  createDefaultColumnsAction
  // ══════════════════════════════════════════════════════════════════════════
  describe('createDefaultColumnsAction', () => {
    it('inserts default columns successfully', async () => {
      const mockSupabase = buildMockSupabase();
      // board ownership check
      mockSupabase.single.mockResolvedValue({ data: { id: 15 }, error: null });
      mockSupabase.insert.mockResolvedValue({ error: null });
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      await expect(createDefaultColumnsAction(15)).resolves.toBeUndefined();
      expect(mockSupabase.from).toHaveBeenCalledWith('columns');
      expect(mockSupabase.insert).toHaveBeenCalledWith([
        { title: 'To Do', board_id: 15, position: 0 },
        { title: 'In Progress', board_id: 15, position: 1 },
        { title: 'Done', board_id: 15, position: 2 },
      ]);
    });

    it('throws Unauthorized when user is null', async () => {
      const mockSupabase = buildMockSupabase({
        auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
      });
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      await expect(createDefaultColumnsAction(15)).rejects.toThrow(
        'Unauthorized access',
      );
    });

    it('throws Access denied when board not owned by user', async () => {
      const mockSupabase = buildMockSupabase();
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'not found' },
      });
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      await expect(createDefaultColumnsAction(15)).rejects.toThrow(
        'Access denied.',
      );
    });

    it('throws Access denied when board data is null (no boardError but empty)', async () => {
      const mockSupabase = buildMockSupabase();
      mockSupabase.single.mockResolvedValue({ data: null, error: null });
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      await expect(createDefaultColumnsAction(15)).rejects.toThrow(
        'Access denied.',
      );
    });

    it('throws when columns insert returns an error', async () => {
      const mockSupabase = buildMockSupabase();
      mockSupabase.single.mockResolvedValue({ data: { id: 15 }, error: null });
      mockSupabase.insert.mockResolvedValue({
        error: { message: 'Columns error' },
      });
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      await expect(createDefaultColumnsAction(15)).rejects.toThrow(
        'Failed to create default columns.',
      );
    });
  });
});
