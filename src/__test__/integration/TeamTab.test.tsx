import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TeamTab } from '@/components/project-tabs';

// Mock dependencies
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  }
}));

jest.mock('@/app/(dashboard)/provider', () => ({
  useDashboardUser: () => ({
    user: { id: 'user-1' }
  })
}));

jest.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    storage: {
      from: () => ({
        createSignedUrl: jest.fn().mockResolvedValue({ data: { signedUrl: 'mock-url' }, error: null })
      })
    }
  })
}));

describe('TeamTab Integration', () => {
  let originalFetch: typeof global.fetch;

  beforeAll(() => {
    originalFetch = global.fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('renders loading state initially or fetches members on mount', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [],
    });
    
    // Mount Component - TeamTab nhận boardId
    render(<TeamTab boardId={10} />);
    
    // Verify fetch is called with correct URL
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/boards/10/members');
    });
  });

  it('handles member interaction like displaying or adding users', async () => {
    // 1. Mock valid members mapping exactly what is expected from GET request
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { user_id: 'user-1', display_name: 'John Doe', role: 'Owner', joined_at: '2023-01-01', avatar_url: null }
      ],
    });

    render(<TeamTab boardId={10} />);

    // Check if the user is rendered
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // 2. Click "Add Member" (using the text inside the div)
    fireEvent.click(screen.getByText('Mời thành viên'));

    // 3. Provide valid email
    const emailInput = screen.getByPlaceholderText('member@example.com');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    // Mock POST request response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Successfully invited member' }),
    });

    // 4. Submit
    const submitBtn = screen.getByRole('button', { name: "Gửi lời mời" });
    fireEvent.click(submitBtn);

    // Expect correct POST parameters and success notification
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/boards/10/members', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' })
      }));
      expect(screen.getByText('Lời mời đã được gửi đến test@example.com!')).toBeInTheDocument();
    });
  });
});
