import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CommandCenter from '@/app/(dashboard)/command/page';
import { TASKS } from '@/lib/constants';

jest.mock('@/lib/constants', () => ({
  TASKS: [
    { id: 1, title: 'Test Task 1', tag: 'High', status: 'pending' },
    { id: 2, title: 'Test Task 2', tag: 'Medium', status: 'done' },
    { id: 3, title: 'Test Task 3', tag: 'Low', status: 'pending' },
    { id: 4, title: 'Test Task 4', tag: 'Low', status: 'pending' }, // 4th task to test queue expansion
  ]
}));

describe('CommandCenter Integration', () => {
  it('renders correctly and limits visible tasks to 3 initially', () => {
    render(<CommandCenter />);

    // Header validations
    expect(screen.getByText('Command Center')).toBeInTheDocument();
    
    // Check sprint timer
    expect(screen.getByText('24:00')).toBeInTheDocument();

    // Verify task rendering
    expect(screen.getByText('Test Task 1')).toBeInTheDocument();
    expect(screen.getByText('Test Task 2')).toBeInTheDocument();
    expect(screen.getByText('Test Task 3')).toBeInTheDocument();
    
    // Task 4 should not be visible
    expect(screen.queryByText('Test Task 4')).not.toBeInTheDocument();
  });

  it('expands queue when clicked', () => {
    render(<CommandCenter />);

    const expandBtn = screen.getByText(/Expand Queue/i);
    fireEvent.click(expandBtn);

    // Verify task 4 is now visible
    expect(screen.getByText('Test Task 4')).toBeInTheDocument();
    expect(screen.getByText(/Collapse Queue/i)).toBeInTheDocument();
  });

  it('toggles the sprint timer', () => {
    render(<CommandCenter />);
    
    const startSprintBtn = screen.getByText('Start Sprint');
    fireEvent.click(startSprintBtn);

    // After click it should change into Pause
    expect(screen.getByText('Pause Sprint')).toBeInTheDocument();
    expect(screen.getByText('23:59')).toBeInTheDocument();
    
    // Click again to pause
    const pauseSprintBtn = screen.getByText('Pause Sprint');
    fireEvent.click(pauseSprintBtn);
    
    expect(screen.getByText('Start Sprint')).toBeInTheDocument();
    expect(screen.getByText('24:00')).toBeInTheDocument();
  });

  it('opens quick entry modal and toggles tags', () => {
    render(<CommandCenter />);
    
    const quickEntryBtn = screen.getByText('Quick Entry');
    fireEvent.click(quickEntryBtn);
    
    // Find modal elements
    const input = screen.getByPlaceholderText("What's on your mind?");
    expect(input).toBeInTheDocument();

    // Type in input
    fireEvent.change(input, { target: { value: 'Buy Groceries' } });

    // Togge a tag
    const personalTagBtn = screen.getByText('Personal');
    fireEvent.click(personalTagBtn);

    // Check UI updates: tag selected implies custom button change
    const createBtn = screen.getByText(/Add Task/i);
    expect(createBtn).toBeInTheDocument();
  });
});
