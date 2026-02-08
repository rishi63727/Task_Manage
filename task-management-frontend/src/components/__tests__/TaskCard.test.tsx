import { render, screen } from '@testing-library/react';
import TaskCard from '../TaskCard';
import { describe, it, expect } from 'vitest';

describe('TaskCard', () => {
    const mockTask = {
        id: 1,
        title: 'Test Task',
        description: 'Test Description',
        priority: 'high',
        completed: false,
        status: 'todo',
        assignee: 'User',
        dueDate: '2023-01-01',
        created_at: '2023-01-01'
    };

    it('renders task title', () => {
        render(<TaskCard task={mockTask} />);
        expect(screen.getByText('Test Task')).toBeDefined();
    });

    it('renders task priority', () => {
        render(<TaskCard task={mockTask} />);
        expect(screen.getByText('high')).toBeDefined();
    });
});
