import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProfilePage from '@/app/(dashboard)/profile/page';
import { useDashboardUser } from '@/app/(dashboard)/provider';

// Mock contexts
jest.mock('@/app/(dashboard)/provider', () => ({
  useDashboardUser: jest.fn(),
}));

describe('ProfilePage Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useDashboardUser as jest.Mock).mockReturnValue({
      user: {
        id: 'user-1',
        email: 'test@taskmaster.com',
        user_metadata: { full_name: 'Test Setup User' },
      },
    });
  });

  it('renders user details and form inputs correctly', () => {
    render(<ProfilePage />);

    // Verify main header
    expect(screen.getByText('Configuration & Settings')).toBeInTheDocument();

    // Verify User details mapped to inputs
    expect(screen.getByDisplayValue('Test Setup User')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test@taskmaster.com')).toBeInTheDocument();
  });

  it('toggles visual rewards correctly', () => {
    const { container } = render(<ProfilePage />);

    // The Visual Rewards toggle is the second toggle based on DOM structure
    const visualRewardsNode = screen.getByText('Visual Rewards');
    expect(visualRewardsNode).toBeInTheDocument();

    // The component structure is:
    // <div className="flex items-center justify-between...">
    //   <div><h4>Visual Rewards...</div>
    //   <Toggle />
    // </div>
    const toggleContainer = visualRewardsNode.closest('.flex.items-center.justify-between');
    const toggleButton = toggleContainer?.querySelector('button');
    
    expect(toggleButton).toBeInTheDocument();

    // Visual rewards starts as enabled (true) in useState
    // We expect the toggle handle (div) to have translate-x-6
    const handleDiv = toggleButton?.querySelector('div');
    expect(handleDiv).toHaveClass('translate-x-6');

    // Click visual rewards
    if (toggleButton) {
      fireEvent.click(toggleButton);
    }
    
    // Check if it toggled
    expect(handleDiv).toHaveClass('translate-x-0');
  });

  it('switches between Energetic and Cozy mode themes', () => {
    render(<ProfilePage />);

    // Default theme is Energetic Flow
    const energeticThemeTitle = screen.getByText('Energetic Flow');
    const energeticContainer = energeticThemeTitle.closest('.cursor-pointer');
    
    const cozyThemeTitle = screen.getByText('Cozy Focus');
    const cozyContainer = cozyThemeTitle.closest('.cursor-pointer');

    // Initial expectations
    expect(energeticContainer).toHaveClass('border-[#28B8FA]'); // active state class
    expect(cozyContainer).not.toHaveClass('border-[#FF8B5E]'); // inactive cozy class

    // Click cozy theme
    if (cozyContainer) {
      fireEvent.click(cozyContainer);
    }

    // New validation
    expect(cozyContainer).toHaveClass('border-[#FF8B5E]'); // cozy becomes active
    expect(energeticContainer).not.toHaveClass('border-[#28B8FA]'); // energetic becomes inactive
  });
});
