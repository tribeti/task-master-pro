import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Toggle from '@/components/Toggle';

describe('Toggle Component', () => {
    it('renders correctly when checked', () => {
        render(<Toggle checked={true} onChange={jest.fn()} />);
        const button = screen.getByRole('button');
        expect(button).toHaveClass('bg-[#34D399]');
    });

    it('renders correctly when unchecked', () => {
        render(<Toggle checked={false} onChange={jest.fn()} />);
        const button = screen.getByRole('button');
        expect(button).toHaveClass('bg-slate-200');
    });

    it('calls onChange when clicked', () => {
        const onChangeMock = jest.fn();
        render(<Toggle checked={false} onChange={onChangeMock} />);
        
        const button = screen.getByRole('button');
        fireEvent.click(button);
        
        expect(onChangeMock).toHaveBeenCalledTimes(1);
    });
});
