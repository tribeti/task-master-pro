import { checkEmailExistsAction, requestPasswordResetAction } from '@/app/actions/auth.actions';
import { createClient } from '@/utils/supabase/server';

jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('Auth Actions (Server Actions)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkEmailExistsAction', () => {
    it('returns error for invalid email', async () => {
      const result = await checkEmailExistsAction('invalid-email');
      expect(result.exists).toBe(false);
      expect(result.error).toBe('Email không đúng định dạng.');
    });

    it('returns true if email exists by calling Supabase RPC', async () => {
      const mockRpc = jest.fn().mockResolvedValue({ data: true, error: null });
      (createClient as jest.Mock).mockResolvedValue({ rpc: mockRpc });

      const result = await checkEmailExistsAction('test@gmail.com');
      expect(result.exists).toBe(true);
      expect(mockRpc).toHaveBeenCalledWith('check_email_exists', { email_to_check: 'test@gmail.com' });
    });
  });

  describe('requestPasswordResetAction', () => {
    it('returns error for invalid email format', async () => {
      const result = await requestPasswordResetAction('bad-email');
      expect(result.error).toBe('Email không đúng định dạng.');
    });

    it('returns success on valid email by calling Supabase Auth API', async () => {
      const mockReset = jest.fn().mockResolvedValue({ error: null });
      (createClient as jest.Mock).mockResolvedValue({
        auth: { resetPasswordForEmail: mockReset },
      });

      const result = await requestPasswordResetAction('user@example.com');
      expect(result.success).toBe(true);
      expect(mockReset).toHaveBeenCalledWith('user@example.com', expect.any(Object));
    });
  });
});
