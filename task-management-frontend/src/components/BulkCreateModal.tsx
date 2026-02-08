import React, { useState } from 'react';
import { createBulkTasks } from '../api/tasks';
import styles from './BulkCreateModal.module.css';

interface BulkCreateModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

interface TaskRow {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
}

export default function BulkCreateModal({ onClose, onSuccess }: BulkCreateModalProps) {
    const [tasks, setTasks] = useState<TaskRow[]>([
        { title: '', description: '', priority: 'medium' },
        { title: '', description: '', priority: 'medium' },
        { title: '', description: '', priority: 'medium' },
    ]);
    const [submitting, setSubmitting] = useState(false);

    const handleTaskChange = (index: number, field: keyof TaskRow, value: string) => {
        const newTasks = [...tasks];
        newTasks[index] = { ...newTasks[index], [field]: value };
        setTasks(newTasks);
    };

    const addTaskRow = () => {
        setTasks([...tasks, { title: '', description: '', priority: 'medium' }]);
    };

    const removeTaskRow = (index: number) => {
        if (tasks.length === 1) return;
        const newTasks = tasks.filter((_, i) => i !== index);
        setTasks(newTasks);
    };

    const handleSubmit = async () => {
        const validTasks = tasks.filter(t => t.title.trim());
        if (validTasks.length === 0) {
            alert("Please add at least one task with a title.");
            return;
        }

        setSubmitting(true);
        try {
            await createBulkTasks(validTasks.map(t => ({
                title: t.title,
                description: t.description || undefined,
                priority: t.priority
            })));
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to create bulk tasks', error);
            alert('Failed to create tasks. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Bulk Create Tasks</h2>
                    <button className={styles.closeButton} onClick={onClose}>×</button>
                </div>

                <div className={styles.body}>
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th style={{ width: '30%' }}>Title *</th>
                                    <th style={{ width: '40%' }}>Description</th>
                                    <th style={{ width: '20%' }}>Priority</th>
                                    <th style={{ width: '10%' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.map((task, index) => (
                                    <tr key={index}>
                                        <td>
                                            <input
                                                className={styles.input}
                                                type="text"
                                                value={task.title}
                                                onChange={(e) => handleTaskChange(index, 'title', e.target.value)}
                                                placeholder="Task title"
                                                autoFocus={index === 0}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                className={styles.input}
                                                type="text"
                                                value={task.description}
                                                onChange={(e) => handleTaskChange(index, 'description', e.target.value)}
                                                placeholder="Optional description"
                                            />
                                        </td>
                                        <td>
                                            <select
                                                className={styles.select}
                                                value={task.priority}
                                                onChange={(e) => handleTaskChange(index, 'priority', e.target.value as any)}
                                            >
                                                <option value="low">Low</option>
                                                <option value="medium">Medium</option>
                                                <option value="high">High</option>
                                            </select>
                                        </td>
                                        <td>
                                            <button
                                                className={styles.removeButton}
                                                onClick={() => removeTaskRow(index)}
                                                disabled={tasks.length === 1}
                                            >
                                                ×
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <button className={styles.addButton} onClick={addTaskRow}>+ Add Row</button>
                </div>

                <div className={styles.footer}>
                    <span>{tasks.filter(t => t.title.trim()).length} task(s) to create</span>
                    <button
                        className={styles.submitButton}
                        onClick={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? 'Creating...' : 'Create Tasks'}
                    </button>
                </div>
            </div>
        </div>
    );
}
