import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CreateProjectModal from '@/components/CreateProjectModal';

describe('CreateProjectModal (Test nhập liệu UI)', () => {
    const mockOnClose = jest.fn();
    const mockOnSubmit = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders the modal when isOpen is true', () => {
        render(<CreateProjectModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);
        expect(screen.getByText('Tạo dự án mới')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
        const { container } = render(<CreateProjectModal isOpen={false} onClose={mockOnClose} onSubmit={mockOnSubmit} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('disables submit button when project name is empty', () => {
        render(<CreateProjectModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);
        
        const submitButton = screen.getByText('Bắt đầu dự án').closest('button');
        expect(submitButton).toBeDisabled();
    });

    it('allows submitting when project name is entered', () => {
        render(<CreateProjectModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);
        
        const input = screen.getByPlaceholderText('e.g. Dự án mới');
        fireEvent.change(input, { target: { value: 'My new project' } });
        
        const submitButton = screen.getByText('Bắt đầu dự án').closest('button');
        expect(submitButton).not.toBeDisabled();
        
        fireEvent.click(submitButton!);
        expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
            title: 'My new project',
            tag: 'Core'
        }));
    });

    it('handles typing description and changing tags correctly', () => {
        render(<CreateProjectModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);
        
        // Name
        fireEvent.change(screen.getByPlaceholderText('e.g. Dự án mới'), { target: { value: 'Advanced Setup' } });
        
        // Description
        fireEvent.change(screen.getByPlaceholderText('Mô tả dự án...'), { target: { value: 'Detailed description' } });
        
        // Tag
        fireEvent.click(screen.getByText('Dev'));

        const submitButton = screen.getByText('Bắt đầu dự án').closest('button');
        fireEvent.click(submitButton!);

        expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
            title: 'Advanced Setup',
            description: 'Detailed description',
            tag: 'Dev'
        }));
    });
});
