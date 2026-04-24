import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProjectsPage from '@/app/(dashboard)/projects/page';
import { useProjects } from '@/lib/hooks/useProjects';

// ===== MOCKING DEPENDENCIES =====
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}));

jest.mock('@/app/(dashboard)/provider', () => ({
  useDashboardUser: () => ({
    user: { id: 'user_123', name: 'Test User' }
  })
}));

jest.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    channel: () => ({
      on: () => ({
        subscribe: jest.fn(),
      }),
    }),
    removeChannel: jest.fn(),
  }),
}));

jest.mock('@/hooks/useProjects');
const mockedUseProjects = useProjects as jest.MockedFunction<typeof useProjects>;

describe('ProjectsPage Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders skeleton loaders initially, then renders actual project cards when data loads', () => {
    // 1. Initial State: Loading
    mockedUseProjects.mockReturnValue({
      ownedBoards: [],
      joinedBoards: [],
      boardsLoading: true,
      isSubmitting: false,
      fetchBoards: jest.fn(),
      confirmDeleteProject: jest.fn(),
      handleCreateProject: jest.fn(),
      handleUpdateExistingProject: jest.fn(),
    });

    const { rerender } = render(<ProjectsPage />);

    // Title is present
    expect(screen.getByText('Dự án hoạt động')).toBeInTheDocument();

    // 2. Success State: Data Fetched Update
    mockedUseProjects.mockReturnValue({
      ownedBoards: [
        { id: 101, title: 'Super Frontend Project', is_private: false, color: '#FF8B5E', tag: 'Core', created_at: new Date().toISOString() } as any
      ],
      joinedBoards: [],
      boardsLoading: false,
      isSubmitting: false,
      fetchBoards: jest.fn(),
      confirmDeleteProject: jest.fn(),
      handleCreateProject: jest.fn(),
      handleUpdateExistingProject: jest.fn(),
    });

    rerender(<ProjectsPage />);

    // Verify the injected mock data reflects on the UI
    expect(screen.getByText('Super Frontend Project')).toBeInTheDocument();
    expect(screen.getByText('Dự án của tôi')).toBeInTheDocument();
  });

  it('opens Create Project Modal and interacts correctly when "Dự án mới" is clicked', () => {
    mockedUseProjects.mockReturnValue({
      ownedBoards: [],
      joinedBoards: [],
      boardsLoading: false,
      isSubmitting: false,
      fetchBoards: jest.fn(),
      confirmDeleteProject: jest.fn(),
      handleCreateProject: jest.fn(),
      handleUpdateExistingProject: jest.fn(),
    });

    render(<ProjectsPage />);

    // Find and click the new project button
    const newProjectButtons = screen.getAllByText('Dự án mới');
    fireEvent.click(newProjectButtons[0]);

    // The modal should now be integrated and visible
    expect(screen.getByText('Tạo dự án mới')).toBeInTheDocument();

    const input = screen.getByPlaceholderText('e.g. Dự án mới');
    expect(input).toBeInTheDocument();

    // Type a project name
    fireEvent.change(input, { target: { value: 'Integration Test Project' } });
    expect(screen.getByDisplayValue('Integration Test Project')).toBeInTheDocument();
  });
});
