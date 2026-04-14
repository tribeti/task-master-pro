import { createTaskAction, deleteTaskAction } from '@/app/actions/kanban.actions';
import { createClient } from '@/utils/supabase/server';
import { verifyBoardAccess, verifyTaskAccess } from '@/utils/board-access';
import { revalidatePath } from 'next/cache';

// Mocks
jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/utils/supabase/admin', () => ({
  createAdminClient: jest.fn().mockReturnValue({
    from: jest.fn().mockReturnValue({
      insert: jest.fn(),
    })
  }),
}));

jest.mock('@/utils/board-access', () => ({
  verifyBoardAccess: jest.fn(),
  verifyAllBoardsAccess: jest.fn(),
  verifyTaskAccess: jest.fn(),
  validateString: jest.fn((str) => str),
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

describe('Kanban / Task Server Actions Test', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user_123' } }, error: null }),
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { board_id: 1, id: 1 }, error: null }),
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  describe('createTaskAction', () => {
    it('creates a task successfully and revalidates page cache', async () => {
      await createTaskAction({ column_id: 1, title: 'New Valid Task', position: 1 } as any);
      
      // Verification logic passes
      expect(verifyBoardAccess).toHaveBeenCalled();
      
      // Makes DB insertion calls
      expect(mockSupabase.from).toHaveBeenCalledWith('tasks');
      expect(mockSupabase.insert).toHaveBeenCalled();
      
      // Updates Next.js Router cache
      expect(revalidatePath).toHaveBeenCalledWith('/projects');
    });

    it('throws error if user is unauthenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: new Error('Auth Err') });
      await expect(createTaskAction({ column_id: 1, title: 'Task' } as any)).rejects.toThrow('Unauthorized');
    });
  });

  describe('deleteTaskAction', () => {
    it('deletes a task successfully with proper row level security simulation', async () => {
      await deleteTaskAction(10);
      expect(verifyTaskAccess).toHaveBeenCalledWith(expect.any(Object), 'user_123', 10);
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalledWith('/projects');
    });
  });
});
