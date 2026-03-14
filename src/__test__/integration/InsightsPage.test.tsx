import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import InsightsPage from '@/app/(dashboard)/insights/page';

describe('InsightsPage Integration', () => {
  it('renders the insights page header and default metrics', () => {
    render(<InsightsPage />);
    
    // Check main headers
    expect(screen.getByText('Time Distribution')).toBeInTheDocument();
    expect(screen.getByText('Activity Breakdown')).toBeInTheDocument();
    expect(screen.getByText('Focus Heatmap')).toBeInTheDocument();
    expect(screen.getByText('Top Projects')).toBeInTheDocument();
    
    // Check Top Projects rendering 
    expect(screen.getByText('Website Redesign')).toBeInTheDocument();
    expect(screen.getByText('Client Onboarding')).toBeInTheDocument();
    expect(screen.getByText('Inbox Zero')).toBeInTheDocument();
  });

  it('toggles time periods between Daily and Weekly correctly', () => {
    render(<InsightsPage />);

    // Initially "Weekly" should be activated
    const weeklyBtn = screen.getByRole('button', { name: 'Weekly' });
    const dailyBtn = screen.getByRole('button', { name: 'Daily' });

    expect(weeklyBtn).toHaveClass('bg-[#1E293B]'); // Active state class
    expect(dailyBtn).not.toHaveClass('bg-[#1E293B]');

    // Act: Click Daily
    fireEvent.click(dailyBtn);

    // Verify Daily became active
    expect(dailyBtn).toHaveClass('bg-[#1E293B]');
    expect(weeklyBtn).not.toHaveClass('bg-[#1E293B]');
  });
});
