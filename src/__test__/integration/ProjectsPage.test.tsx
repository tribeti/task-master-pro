import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProjectsPage from '@/app/(dashboard)/projects/page';
import { useDashboardUser } from '@/app/(dashboard)/provider';
import { fetchUserBoards, createNewBoard, createDefaultColumns } from '@/services/project.service';

// Mock the dependencies
jest.mock('@/app/(dashboard)/provider', () => ({
  useDashboardUser: jest.fn(),
}));

jest.mock('@/services/project.service', () => ({
  fetchUserBoards: jest.fn(),
  createNewBoard: jest.fn(),
  deleteUserBoard: jest.fn(),
  createDefaultColumns: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  },
}));

describe('ProjectsPage Integration', () => {
  const mockUser = { id: 'user-123' };

  beforeEach(() => {
    jest.clearAllMocks();
    (useDashboardUser as jest.Mock).mockReturnValue({ user: mockUser });
  });

  it('renders active projects and allows opening the create modal', async () => {
    // Mock the fetch behavior to return one project initially
    const mockBoards = [
      { id: 1, title: 'Existing Project', description: 'desc', is_private: false, color: 'blue', tag: 'test' }
    ];
    (fetchUserBoards as jest.Mock).mockResolvedValue(mockBoards);

    render(<ProjectsPage />);

    // Fast Forward: wait for boards to load
    await waitFor(() => {
      expect(screen.getByText('Existing Project')).toBeInTheDocument();
    });

    // Check header
    expect(screen.getByText('Active Projects')).toBeInTheDocument();
    expect(screen.getByText(/1 active/i)).toBeInTheDocument();

    // Find the "New Project" button card and click it
    const newProjectCard = screen.getByText('Start tracking a new initiative.');
    fireEvent.click(newProjectCard);

    // Provide some mocked return for create new board
    (createNewBoard as jest.Mock).mockResolvedValue({ id: 99, title: 'Brand New Project' });
    (createDefaultColumns as jest.Mock).mockResolvedValue({});
    (fetchUserBoards as jest.Mock).mockResolvedValue([
      ...mockBoards,
      { id: 99, title: 'Brand New Project' }
    ]); // Mock the simulated refetch finding the new project

    // Wait for the modal to appear (looking for standard form elements)
    await waitFor(() => {
      // CreateProjectModal should have an input or heading saying "Create New Project"
      const modalHeader = screen.getAllByText('Create New Project');
      expect(modalHeader.length).toBeGreaterThan(0);
    });

    // We can simulate an integration form submit here
    // Assuming there's a title input with placeholder "e.g. Q4 Brand Sprint"
    const titleInput = screen.getByPlaceholderText('e.g. Q4 Brand Sprint');
    fireEvent.change(titleInput, { target: { value: 'Brand New Project' } });

    // Find the Create Project button inside the modal and click
    // Note: It's the submit button, we can find it by button text 'Launch Project'
    const submitBtn = screen.getByText(/launch project/i);
    fireEvent.click(submitBtn);

    // Verify service calls and new UI renders
    await waitFor(() => {
      expect(createNewBoard).toHaveBeenCalledWith('user-123', expect.objectContaining({
        title: 'Brand New Project',
      }));
    });

    // Expect the UI to show the new project
    await waitFor(() => {
      expect(screen.getByText('Brand New Project')).toBeInTheDocument();
      expect(screen.getByText(/2 active/i)).toBeInTheDocument();
    });
  });
});
