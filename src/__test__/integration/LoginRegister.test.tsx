import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TaskFlowAuth from '@/app/login/page';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('@/utils/supabase/client', () => ({
  createClient: jest.fn(),
}));

describe('Login & Register UI Flow', () => {
  const mockRouterPush = jest.fn();
  let mockSupabase: any;
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockRouterPush });
    
    global.fetch = jest.fn();

    mockSupabase = {
      auth: {
        signInWithOAuth: jest.fn(),
      }
    };
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('renders login view by default', () => {
    render(<TaskFlowAuth />);
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument();
  });

  it('switches to register view when "Sign up now" is clicked', () => {
    render(<TaskFlowAuth />);
    fireEvent.click(screen.getByText('Sign up now'));
    
    // UI responds dynamically
    expect(screen.getByText('Create Account')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Full Name')).toBeInTheDocument();
  });

  it('shows generic mock error if backend auth API fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Invalid credentials' }),
    });

    render(<TaskFlowAuth />);
    fireEvent.change(screen.getByPlaceholderText('Email address'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByText('Sign In'));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('redirects to /command dashbaord on successful login', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ session: 'token' }),
    });

    render(<TaskFlowAuth />);
    fireEvent.change(screen.getByPlaceholderText('Email address'), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'correctpass' } });
    fireEvent.click(screen.getByText('Sign In'));

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith('/command');
    });
  });
});
