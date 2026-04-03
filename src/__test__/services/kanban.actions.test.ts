import {
  fetchKanbanDataAction,
  createTaskAction,
  updateTaskAction,
  deleteTaskAction,
  createColumnAction,
  updateColumnAction,
  deleteColumnAction,
} from '@/app/actions/kanban.actions';
import { createClient } from '@/utils/supabase/server';

jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
}));

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

// ── Shared helpers ─────────────────────────────────────────────────────────

/**
 * Build a chainable Supabase-like mock. Each method returns `this` by default
 * so that `.from().select().eq().single()` chains work out of the box.
 * Individual tests override only the methods they need.
 */
function buildSupabase(
  authUser: { id: string } | null = { id: 'user-1' },
  singleData: any = { id: 1 },
  singleError: any = null,
) {
  const mock: any = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: singleData, error: singleError }),
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: authUser }, error: null }),
    },
  };
  return mock;
}

afterEach(() => jest.clearAllMocks());

// ══════════════════════════════════════════════════════════════════════════
//  fetchKanbanDataAction
// ══════════════════════════════════════════════════════════════════════════
describe('fetchKanbanDataAction', () => {
  it('returns columns and tasks for a valid board', async () => {
    const mockColumns = [{ id: 10, title: 'To Do', board_id: 1, position: 0 }];
    const mockTasks = [{ id: 100, title: 'T1', column_id: 10, position: 0 }];

    const supabase = buildSupabase({ id: 'user-1' }, { id: 1 });
    // Board ownership `.single()` already resolves via buildSupabase
    // Columns query uses `.order()`
    let orderCallCount = 0;
    supabase.order.mockImplementation(() => {
      orderCallCount++;
      if (orderCallCount === 1) return Promise.resolve({ data: mockColumns, error: null });
      return Promise.resolve({ data: mockTasks, error: null });
    });
    (createClient as jest.Mock).mockResolvedValue(supabase);

    const result = await fetchKanbanDataAction(1);
    expect(result.columns).toEqual(mockColumns);
    // fetchKanbanDataAction wraps each task with labels: []
    expect(result.tasks).toEqual(
      mockTasks.map((t) => ({ ...t, labels: [] })),
    );
  });

  it('returns empty tasks when there are no columns', async () => {
    const supabase = buildSupabase({ id: 'user-1' }, { id: 1 });
    supabase.order.mockResolvedValue({ data: [], error: null });
    (createClient as jest.Mock).mockResolvedValue(supabase);

    const result = await fetchKanbanDataAction(1);
    expect(result.columns).toEqual([]);
    expect(result.tasks).toEqual([]);
  });

  it('throws Unauthorized when no user', async () => {
    const supabase = buildSupabase(null);
    (createClient as jest.Mock).mockResolvedValue(supabase);
    await expect(fetchKanbanDataAction(1)).rejects.toThrow('Unauthorized');
  });

  it('throws Access denied when board ownership check fails', async () => {
    const supabase = buildSupabase({ id: 'user-1' }, null, { message: 'not found' });
    (createClient as jest.Mock).mockResolvedValue(supabase);
    await expect(fetchKanbanDataAction(1)).rejects.toThrow('Access denied.');
  });

  it('throws when columns query returns an error', async () => {
    const supabase = buildSupabase({ id: 'user-1' }, { id: 1 });
    supabase.order.mockResolvedValue({ data: null, error: { message: 'cols error' } });
    (createClient as jest.Mock).mockResolvedValue(supabase);
    await expect(fetchKanbanDataAction(1)).rejects.toThrow('Failed to load board data.');
  });

  it('throws when tasks query returns an error', async () => {
    const mockColumns = [{ id: 10, title: 'To Do', board_id: 1, position: 0 }];
    const supabase = buildSupabase({ id: 'user-1' }, { id: 1 });
    let orderCallCount = 0;
    supabase.order.mockImplementation(() => {
      orderCallCount++;
      if (orderCallCount === 1) return Promise.resolve({ data: mockColumns, error: null });
      return Promise.resolve({ data: null, error: { message: 'tasks error' } });
    });
    (createClient as jest.Mock).mockResolvedValue(supabase);
    await expect(fetchKanbanDataAction(1)).rejects.toThrow('Failed to load tasks.');
  });
});

// ══════════════════════════════════════════════════════════════════════════
//  createTaskAction
// ══════════════════════════════════════════════════════════════════════════
describe('createTaskAction', () => {
  const validPayload = {
    title: 'New Task',
    description: null,
    deadline: null,
    priority: 'Low' as const,
    position: 0,
    column_id: 10,
    assignee_id: null,
  };

  it('creates a task successfully', async () => {
    const supabase = buildSupabase({ id: 'user-1' }, { board_id: 1 });
    supabase.insert.mockResolvedValue({ error: null });
    (createClient as jest.Mock).mockResolvedValue(supabase);

    await expect(createTaskAction(validPayload)).resolves.toBeUndefined();
    expect(supabase.insert).toHaveBeenCalledWith([validPayload]);
  });

  it('throws Unauthorized when no user', async () => {
    const supabase = buildSupabase(null);
    (createClient as jest.Mock).mockResolvedValue(supabase);
    await expect(createTaskAction(validPayload)).rejects.toThrow('Unauthorized');
  });

  it('throws Access denied when column lookup fails', async () => {
    const supabase = buildSupabase({ id: 'user-1' }, null, { message: 'nope' });
    (createClient as jest.Mock).mockResolvedValue(supabase);
    await expect(createTaskAction(validPayload)).rejects.toThrow('Access denied.');
  });

  it('validates title - throws when empty', async () => {
    const supabase = buildSupabase({ id: 'user-1' });
    (createClient as jest.Mock).mockResolvedValue(supabase);
    await expect(createTaskAction({ ...validPayload, title: '   ' })).rejects.toThrow('Task title is required.');
  });

  it('validates description when provided', async () => {
    const supabase = buildSupabase({ id: 'user-1' });
    (createClient as jest.Mock).mockResolvedValue(supabase);
    await expect(
      createTaskAction({ ...validPayload, description: '  ' }),
    ).rejects.toThrow('Description is required.');
  });

  it('throws when insert fails', async () => {
    const supabase = buildSupabase({ id: 'user-1' }, { board_id: 1 });
    supabase.insert.mockResolvedValue({ error: { message: 'insert error' } });
    (createClient as jest.Mock).mockResolvedValue(supabase);
    await expect(createTaskAction(validPayload)).rejects.toThrow('Failed to create task.');
  });
});

// ══════════════════════════════════════════════════════════════════════════
//  updateTaskAction
// ══════════════════════════════════════════════════════════════════════════
describe('updateTaskAction', () => {
  it('updates a task successfully', async () => {
    const supabase = buildSupabase({ id: 'user-1' }, { column_id: 10 });
    // For verifyTaskOwnership: tasks.single → column_id, columns.single → board_id, boards.single → ownership
    let singleCallCount = 0;
    supabase.single.mockImplementation(() => {
      singleCallCount++;
      if (singleCallCount === 1) return Promise.resolve({ data: { column_id: 10 }, error: null });
      if (singleCallCount === 2) return Promise.resolve({ data: { board_id: 1 }, error: null });
      return Promise.resolve({ data: { id: 1 }, error: null }); // board ownership
    });
    supabase.eq.mockReturnThis();
    supabase.update.mockReturnValue(supabase);
    supabase.update.mockImplementation(() => ({ eq: jest.fn().mockResolvedValue({ error: null }) }));
    (createClient as jest.Mock).mockResolvedValue(supabase);

    await expect(updateTaskAction(5, { title: 'Updated' })).resolves.toBeUndefined();
  });

  it('throws Unauthorized when no user', async () => {
    const supabase = buildSupabase(null);
    (createClient as jest.Mock).mockResolvedValue(supabase);
    await expect(updateTaskAction(5, {})).rejects.toThrow('Unauthorized');
  });

  it('validates title when provided', async () => {
    const supabase = buildSupabase({ id: 'user-1' });
    (createClient as jest.Mock).mockResolvedValue(supabase);
    await expect(updateTaskAction(5, { title: '' })).rejects.toThrow('Task title is required.');
  });

  it('validates description when provided and non-null', async () => {
    const supabase = buildSupabase({ id: 'user-1' });
    (createClient as jest.Mock).mockResolvedValue(supabase);
    await expect(updateTaskAction(5, { description: '  ' })).rejects.toThrow('Description is required.');
  });

  it('skips description validation when null', async () => {
    const supabase = buildSupabase({ id: 'user-1' }, { column_id: 10 });
    let singleCallCount = 0;
    supabase.single.mockImplementation(() => {
      singleCallCount++;
      if (singleCallCount === 1) return Promise.resolve({ data: { column_id: 10 }, error: null });
      if (singleCallCount === 2) return Promise.resolve({ data: { board_id: 1 }, error: null });
      return Promise.resolve({ data: { id: 1 }, error: null });
    });
    supabase.update.mockImplementation(() => ({ eq: jest.fn().mockResolvedValue({ error: null }) }));
    (createClient as jest.Mock).mockResolvedValue(supabase);

    // description null should NOT trigger validation error
    await expect(updateTaskAction(5, { description: null })).resolves.toBeUndefined();
  });

  it('throws when task ownership lookup fails (task not found)', async () => {
    const supabase = buildSupabase({ id: 'user-1' }, null, { message: 'nope' });
    (createClient as jest.Mock).mockResolvedValue(supabase);
    await expect(updateTaskAction(5, {})).rejects.toThrow('Access denied.');
  });

  it('also checks target column ownership when column_id changes', async () => {
    const supabase = buildSupabase({ id: 'user-1' });
    let singleCallCount = 0;
    supabase.single.mockImplementation(() => {
      singleCallCount++;
      // verifyTaskOwnership: task single
      if (singleCallCount === 1) return Promise.resolve({ data: { column_id: 10 }, error: null });
      // verifyTaskOwnership: column single
      if (singleCallCount === 2) return Promise.resolve({ data: { board_id: 1 }, error: null });
      // verifyBoardOwnership: board single
      if (singleCallCount === 3) return Promise.resolve({ data: { id: 1 }, error: null });
      // target column single (column_id change)
      if (singleCallCount === 4) return Promise.resolve({ data: { board_id: 1 }, error: null });
      // board ownership of target column
      return Promise.resolve({ data: { id: 1 }, error: null });
    });
    supabase.update.mockImplementation(() => ({ eq: jest.fn().mockResolvedValue({ error: null }) }));
    (createClient as jest.Mock).mockResolvedValue(supabase);

    await expect(updateTaskAction(5, { column_id: 20 })).resolves.toBeUndefined();
  });

  it('throws Access denied when target column lookup fails', async () => {
    const supabase = buildSupabase({ id: 'user-1' });
    let singleCallCount = 0;
    supabase.single.mockImplementation(() => {
      singleCallCount++;
      if (singleCallCount === 1) return Promise.resolve({ data: { column_id: 10 }, error: null });
      if (singleCallCount === 2) return Promise.resolve({ data: { board_id: 1 }, error: null });
      if (singleCallCount === 3) return Promise.resolve({ data: { id: 1 }, error: null });
      // target column not found
      return Promise.resolve({ data: null, error: { message: 'not found' } });
    });
    (createClient as jest.Mock).mockResolvedValue(supabase);
    await expect(updateTaskAction(5, { column_id: 99 })).rejects.toThrow('Access denied.');
  });

  it('throws when update query returns error', async () => {
    const supabase = buildSupabase({ id: 'user-1' });
    let singleCallCount = 0;
    supabase.single.mockImplementation(() => {
      singleCallCount++;
      if (singleCallCount === 1) return Promise.resolve({ data: { column_id: 10 }, error: null });
      if (singleCallCount === 2) return Promise.resolve({ data: { board_id: 1 }, error: null });
      return Promise.resolve({ data: { id: 1 }, error: null });
    });
    supabase.update.mockImplementation(() => ({
      eq: jest.fn().mockResolvedValue({ error: { message: 'update failed' } }),
    }));
    (createClient as jest.Mock).mockResolvedValue(supabase);
    await expect(updateTaskAction(5, { title: 'X' })).rejects.toThrow('Failed to update task.');
  });
});

// ══════════════════════════════════════════════════════════════════════════
//  deleteTaskAction
// ══════════════════════════════════════════════════════════════════════════
describe('deleteTaskAction', () => {
  it('deletes a task successfully', async () => {
    const supabase = buildSupabase({ id: 'user-1' });
    let singleCallCount = 0;
    supabase.single.mockImplementation(() => {
      singleCallCount++;
      if (singleCallCount === 1) return Promise.resolve({ data: { column_id: 10 }, error: null });
      if (singleCallCount === 2) return Promise.resolve({ data: { board_id: 1 }, error: null });
      return Promise.resolve({ data: { id: 1 }, error: null });
    });
    supabase.delete.mockImplementation(() => ({
      eq: jest.fn().mockResolvedValue({ error: null }),
    }));
    (createClient as jest.Mock).mockResolvedValue(supabase);

    await expect(deleteTaskAction(5)).resolves.toBeUndefined();
  });

  it('throws Unauthorized when no user', async () => {
    const supabase = buildSupabase(null);
    (createClient as jest.Mock).mockResolvedValue(supabase);
    await expect(deleteTaskAction(5)).rejects.toThrow('Unauthorized');
  });

  it('throws Access denied when task ownership check fails', async () => {
    const supabase = buildSupabase({ id: 'user-1' }, null, { message: 'nope' });
    (createClient as jest.Mock).mockResolvedValue(supabase);
    await expect(deleteTaskAction(5)).rejects.toThrow('Access denied.');
  });

  it('throws when delete query returns error', async () => {
    const supabase = buildSupabase({ id: 'user-1' });
    let singleCallCount = 0;
    supabase.single.mockImplementation(() => {
      singleCallCount++;
      if (singleCallCount === 1) return Promise.resolve({ data: { column_id: 10 }, error: null });
      if (singleCallCount === 2) return Promise.resolve({ data: { board_id: 1 }, error: null });
      return Promise.resolve({ data: { id: 1 }, error: null });
    });
    supabase.delete.mockImplementation(() => ({
      eq: jest.fn().mockResolvedValue({ error: { message: 'delete error' } }),
    }));
    (createClient as jest.Mock).mockResolvedValue(supabase);
    await expect(deleteTaskAction(5)).rejects.toThrow('Failed to delete task.');
  });
});

// ══════════════════════════════════════════════════════════════════════════
//  createColumnAction
// ══════════════════════════════════════════════════════════════════════════
describe('createColumnAction', () => {
  it('creates a column successfully', async () => {
    const supabase = buildSupabase({ id: 'user-1' }, { id: 1 });
    supabase.insert.mockResolvedValue({ error: null });
    (createClient as jest.Mock).mockResolvedValue(supabase);

    await expect(createColumnAction(1, 'Review', 3)).resolves.toBeUndefined();
    expect(supabase.insert).toHaveBeenCalledWith([
      { title: 'Review', board_id: 1, position: 3 },
    ]);
  });

  it('throws Unauthorized when no user', async () => {
    const supabase = buildSupabase(null);
    (createClient as jest.Mock).mockResolvedValue(supabase);
    await expect(createColumnAction(1, 'Review', 0)).rejects.toThrow('Unauthorized');
  });

  it('throws when title is empty (validateString)', async () => {
    const supabase = buildSupabase({ id: 'user-1' });
    (createClient as jest.Mock).mockResolvedValue(supabase);
    await expect(createColumnAction(1, '  ', 0)).rejects.toThrow('Column title is required.');
  });

  it('throws Access denied when board ownership check fails', async () => {
    const supabase = buildSupabase({ id: 'user-1' }, null, { message: 'not found' });
    (createClient as jest.Mock).mockResolvedValue(supabase);
    await expect(createColumnAction(1, 'Sprint', 0)).rejects.toThrow('Access denied.');
  });

  it('throws when insert returns error', async () => {
    const supabase = buildSupabase({ id: 'user-1' }, { id: 1 });
    supabase.insert.mockResolvedValue({ error: { message: 'insert failed' } });
    (createClient as jest.Mock).mockResolvedValue(supabase);
    await expect(createColumnAction(1, 'Sprint', 0)).rejects.toThrow('Failed to create column.');
  });
});

// ══════════════════════════════════════════════════════════════════════════
//  updateColumnAction
// ══════════════════════════════════════════════════════════════════════════
describe('updateColumnAction', () => {
  it('updates a column title successfully', async () => {
    const supabase = buildSupabase({ id: 'user-1' });
    let singleCallCount = 0;
    supabase.single.mockImplementation(() => {
      singleCallCount++;
      if (singleCallCount === 1) return Promise.resolve({ data: { board_id: 1 }, error: null });
      return Promise.resolve({ data: { id: 1 }, error: null });
    });
    supabase.update.mockImplementation(() => ({
      eq: jest.fn().mockResolvedValue({ error: null }),
    }));
    (createClient as jest.Mock).mockResolvedValue(supabase);

    await expect(updateColumnAction(10, { title: 'Done' })).resolves.toBeUndefined();
  });

  it('throws Unauthorized when no user', async () => {
    const supabase = buildSupabase(null);
    (createClient as jest.Mock).mockResolvedValue(supabase);
    await expect(updateColumnAction(10, { title: 'X' })).rejects.toThrow('Unauthorized');
  });

  it('throws when column not found', async () => {
    const supabase = buildSupabase({ id: 'user-1' }, null, { message: 'not found' });
    (createClient as jest.Mock).mockResolvedValue(supabase);
    await expect(updateColumnAction(10, { title: 'X' })).rejects.toThrow('Column not found.');
  });

  it('validates title - throws when empty', async () => {
    const supabase = buildSupabase({ id: 'user-1' });
    (createClient as jest.Mock).mockResolvedValue(supabase);
    await expect(updateColumnAction(10, { title: '  ' })).rejects.toThrow('Column title is required.');
  });

  it('throws when update query returns error', async () => {
    const supabase = buildSupabase({ id: 'user-1' });
    let singleCallCount = 0;
    supabase.single.mockImplementation(() => {
      singleCallCount++;
      if (singleCallCount === 1) return Promise.resolve({ data: { board_id: 1 }, error: null });
      return Promise.resolve({ data: { id: 1 }, error: null });
    });
    supabase.update.mockImplementation(() => ({
      eq: jest.fn().mockResolvedValue({ error: { message: 'update error' } }),
    }));
    (createClient as jest.Mock).mockResolvedValue(supabase);
    await expect(updateColumnAction(10, { title: 'X' })).rejects.toThrow('Không thể cập nhật cột lúc này.');
  });
});

// ══════════════════════════════════════════════════════════════════════════
//  deleteColumnAction
// ══════════════════════════════════════════════════════════════════════════
describe('deleteColumnAction', () => {
  it('deletes a column successfully', async () => {
    const supabase = buildSupabase({ id: 'user-1' });
    let singleCallCount = 0;
    supabase.single.mockImplementation(() => {
      singleCallCount++;
      if (singleCallCount === 1) return Promise.resolve({ data: { board_id: 1 }, error: null });
      return Promise.resolve({ data: { id: 1 }, error: null });
    });
    // Mock the task-count select: returns count: 0 (empty column)
    supabase.select.mockReturnThis();
    supabase.eq.mockImplementation(() => {
      // Return count result for task count query
      return Promise.resolve({ count: 0, error: null });
    });
    supabase.delete.mockImplementation(() => ({
      eq: jest.fn().mockResolvedValue({ error: null }),
    }));
    (createClient as jest.Mock).mockResolvedValue(supabase);

    await expect(deleteColumnAction(10)).resolves.toBeUndefined();
  });

  it('throws Unauthorized when no user', async () => {
    const supabase = buildSupabase(null);
    (createClient as jest.Mock).mockResolvedValue(supabase);
    await expect(deleteColumnAction(10)).rejects.toThrow('Unauthorized');
  });

  it('throws when column not found', async () => {
    const supabase = buildSupabase({ id: 'user-1' }, null, { message: 'not found' });
    (createClient as jest.Mock).mockResolvedValue(supabase);
    await expect(deleteColumnAction(10)).rejects.toThrow('Column not found.');
  });

  it('throws when delete query returns error', async () => {
    const supabase = buildSupabase({ id: 'user-1' });
    let singleCallCount = 0;
    supabase.single.mockImplementation(() => {
      singleCallCount++;
      if (singleCallCount === 1) return Promise.resolve({ data: { board_id: 1 }, error: null });
      return Promise.resolve({ data: { id: 1 }, error: null });
    });
    // Mock count query: count = 0 (empty column, allow delete)
    supabase.select.mockReturnThis();
    supabase.eq.mockImplementation(() =>
      Promise.resolve({ count: 0, error: null }),
    );
    supabase.delete.mockImplementation(() => ({
      eq: jest.fn().mockResolvedValue({ error: { message: 'delete error' } }),
    }));
    (createClient as jest.Mock).mockResolvedValue(supabase);
    await expect(deleteColumnAction(10)).rejects.toThrow('Không thể xóa cột lúc này.');
  });
});
