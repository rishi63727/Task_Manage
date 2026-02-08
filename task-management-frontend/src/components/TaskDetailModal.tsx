import React, { useEffect, useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Task, Comment, File as TaskFile } from '../api/types';
import { getTaskComments, createComment, deleteComment } from '../api/comments';
import { getTaskFiles, uploadFile, deleteFile } from '../api/files';
import { updateTask } from '../api/tasks';
import MarkdownRenderer from './MarkdownRenderer';
import ConfirmDialog from './ConfirmDialog';
import styles from './TaskDetailModal.module.css';

interface TaskDetailModalProps {
    task: Task;
    onClose: () => void;
    onUpdate: () => void; // Trigger refresh of parent list if needed
}

export default function TaskDetailModal({ task, onClose, onUpdate }: TaskDetailModalProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'comments' | 'files'>('overview');
    const [comments, setComments] = useState<Comment[]>([]);
    const [files, setFiles] = useState<TaskFile[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);
    const [loadingFiles, setLoadingFiles] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [confirmCommentId, setConfirmCommentId] = useState<number | null>(null);
    const [confirmFileId, setConfirmFileId] = useState<number | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [localTask, setLocalTask] = useState<Task>(task);
    const [editData, setEditData] = useState({
        title: task.title,
        description: task.description || '',
        status: (task.status || 'todo') as 'todo' | 'in_progress' | 'done',
        priority: (task.priority || 'medium') as 'low' | 'medium' | 'high',
        due_date: task.due_date ? task.due_date.slice(0, 10) : '',
        tags: task.tags ? task.tags.join(', ') : '',
        assigned_to: task.assigned_to ? String(task.assigned_to) : '',
    });
    const [saving, setSaving] = useState(false);

    // Fetch data when tab changes or modal opens
    useEffect(() => {
        if (activeTab === 'comments') {
            loadComments();
        } else if (activeTab === 'files') {
            loadFiles();
        }
    }, [activeTab, task.id]);

    useEffect(() => {
        setLocalTask(task);
        setEditData({
            title: task.title,
            description: task.description || '',
            status: (task.status || 'todo') as 'todo' | 'in_progress' | 'done',
            priority: (task.priority || 'medium') as 'low' | 'medium' | 'high',
            due_date: task.due_date ? task.due_date.slice(0, 10) : '',
            tags: task.tags ? task.tags.join(', ') : '',
            assigned_to: task.assigned_to ? String(task.assigned_to) : '',
        });
        setIsEditing(false);
    }, [task]);

    const loadComments = async () => {
        setLoadingComments(true);
        try {
            const data = await getTaskComments(task.id.toString());
            setComments(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to load comments', error);
        } finally {
            setLoadingComments(false);
        }
    };

    const loadFiles = async () => {
        setLoadingFiles(true);
        try {
            const data = await getTaskFiles(task.id.toString());
            setFiles(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to load files', error);
        } finally {
            setLoadingFiles(false);
        }
    };

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        try {
            await createComment(task.id.toString(), newComment);
            setNewComment('');
            loadComments();
        } catch (error) {
            console.error('Failed to post comment', error);
        }
    };

    const handleCommentDelete = (commentId: number) => {
        setConfirmCommentId(commentId);
    };
    const confirmCommentDelete = async () => {
        if (confirmCommentId == null) return;
        try {
            await deleteComment(confirmCommentId.toString());
            loadComments();
        } catch (error) {
            console.error('Failed to delete comment', error);
        } finally {
            setConfirmCommentId(null);
        }
    };

    // File Upload
    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        setUploading(true);
        try {
            for (const file of acceptedFiles) {
                const formData = new FormData();
                formData.append('file', file);
                await uploadFile(task.id.toString(), formData);
            }
            loadFiles();
        } catch (error) {
            console.error('Failed to upload file', error);
            alert('Failed to upload file');
        } finally {
            setUploading(false);
        }
    }, [task.id]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

    const handleFileDelete = (fileId: number) => {
        setConfirmFileId(fileId);
    };
    const confirmFileDelete = async () => {
        if (confirmFileId == null) return;
        try {
            await deleteFile(confirmFileId.toString());
            loadFiles();
        } catch (error) {
            console.error('Failed to delete file', error);
        } finally {
            setConfirmFileId(null);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editData.title.trim()) return;
        setSaving(true);
        try {
            const payload = {
                title: editData.title.trim(),
                description: editData.description.trim() || undefined,
                status: editData.status,
                priority: editData.priority,
                due_date: editData.due_date ? new Date(editData.due_date).toISOString() : null,
                tags: editData.tags
                    ? editData.tags.split(',').map((t) => t.trim()).filter(Boolean)
                    : [],
                assigned_to: editData.assigned_to ? Number(editData.assigned_to) : null,
            };
            const updated = await updateTask(task.id.toString(), payload);
            setLocalTask(updated);
            setIsEditing(false);
            onUpdate();
        } catch (error) {
            console.error('Failed to update task', error);
            alert('Failed to update task');
        } finally {
            setSaving(false);
        }
    };

    const statusLabel = (value?: string) => {
        const normalized = (value || '').toLowerCase().replace('-', '_');
        if (normalized === 'in_progress') return 'In Progress';
        if (normalized === 'done') return 'Done';
        return 'To Do';
    };

    // Format file size
    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <>
        <ConfirmDialog
            open={confirmCommentId !== null}
            title="Delete comment"
            message="Are you sure you want to delete this comment?"
            confirmLabel="Delete"
            variant="danger"
            onConfirm={confirmCommentDelete}
            onCancel={() => setConfirmCommentId(null)}
        />
        <ConfirmDialog
            open={confirmFileId !== null}
            title="Delete file"
            message="Are you sure you want to delete this file?"
            confirmLabel="Delete"
            variant="danger"
            onConfirm={confirmFileDelete}
            onCancel={() => setConfirmFileId(null)}
        />
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>{localTask.title}</h2>
                    {activeTab === 'overview' && (
                        <button
                            type="button"
                            className={styles.editButton}
                            onClick={() => setIsEditing((prev) => !prev)}
                        >
                            {isEditing ? 'Cancel' : 'Edit'}
                        </button>
                    )}
                    <button className={styles.closeButton} onClick={onClose}>×</button>
                </div>

                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        Overview
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'comments' ? styles.active : ''}`}
                        onClick={() => setActiveTab('comments')}
                    >
                        Comments
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'files' ? styles.active : ''}`}
                        onClick={() => setActiveTab('files')}
                    >
                        Files
                    </button>
                </div>

                <div className={styles.body}>
                    {activeTab === 'overview' && (
                        <div>
                            {!isEditing ? (
                                <>
                                    <div className={styles.metadata}>
                                        <div className={styles.metaItem}>
                                            <span className={styles.label}>Status</span>
                                            <span className={styles.value}>{statusLabel(localTask.status)}</span>
                                        </div>
                                        <div className={styles.metaItem}>
                                            <span className={styles.label}>Priority</span>
                                            <span className={styles.value} style={{ textTransform: 'capitalize' }}>{localTask.priority}</span>
                                        </div>
                                        <div className={styles.metaItem}>
                                            <span className={styles.label}>Due Date</span>
                                            <span className={styles.value}>
                                                {localTask.due_date ? new Date(localTask.due_date).toLocaleDateString() : '—'}
                                            </span>
                                        </div>
                                        <div className={styles.metaItem}>
                                            <span className={styles.label}>Assigned To</span>
                                            <span className={styles.value}>
                                                {localTask.assigned_to ? `User ${localTask.assigned_to}` : 'Unassigned'}
                                            </span>
                                        </div>
                                        <div className={styles.metaItem}>
                                            <span className={styles.label}>Tags</span>
                                            <span className={styles.value}>
                                                {localTask.tags && localTask.tags.length > 0 ? localTask.tags.join(', ') : '—'}
                                            </span>
                                        </div>
                                        <div className={styles.metaItem}>
                                            <span className={styles.label}>Created At</span>
                                            <span className={styles.value}>{new Date(localTask.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    <div className={styles.section}>
                                        <h3 className={styles.sectionTitle}>Description</h3>
                                        <div className={styles.description}>
                                            {localTask.description ? (
                                                <MarkdownRenderer content={localTask.description} className="" />
                                            ) : (
                                                <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No description provided.</p>
                                            )}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <form onSubmit={handleSave} className={styles.editForm}>
                                    <div className={styles.formRow}>
                                        <label className={styles.formLabel}>Title</label>
                                        <input
                                            type="text"
                                            value={editData.title}
                                            onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className={styles.formRow}>
                                        <label className={styles.formLabel}>Description</label>
                                        <textarea
                                            value={editData.description}
                                            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                        />
                                    </div>
                                    <div className={styles.formGrid}>
                                        <div className={styles.formRow}>
                                            <label className={styles.formLabel}>Status</label>
                                            <select
                                                value={editData.status}
                                                onChange={(e) =>
                                                    setEditData({
                                                        ...editData,
                                                        status: e.target.value as 'todo' | 'in_progress' | 'done',
                                                    })
                                                }
                                            >
                                                <option value="todo">To Do</option>
                                                <option value="in_progress">In Progress</option>
                                                <option value="done">Done</option>
                                            </select>
                                        </div>
                                        <div className={styles.formRow}>
                                            <label className={styles.formLabel}>Priority</label>
                                            <select
                                                value={editData.priority}
                                                onChange={(e) =>
                                                    setEditData({
                                                        ...editData,
                                                        priority: e.target.value as 'low' | 'medium' | 'high',
                                                    })
                                                }
                                            >
                                                <option value="low">Low</option>
                                                <option value="medium">Medium</option>
                                                <option value="high">High</option>
                                            </select>
                                        </div>
                                        <div className={styles.formRow}>
                                            <label className={styles.formLabel}>Due Date</label>
                                            <input
                                                type="date"
                                                value={editData.due_date}
                                                onChange={(e) => setEditData({ ...editData, due_date: e.target.value })}
                                            />
                                        </div>
                                        <div className={styles.formRow}>
                                            <label className={styles.formLabel}>Assigned To (User ID)</label>
                                            <input
                                                type="number"
                                                min={1}
                                                value={editData.assigned_to}
                                                onChange={(e) => setEditData({ ...editData, assigned_to: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className={styles.formRow}>
                                        <label className={styles.formLabel}>Tags (comma-separated)</label>
                                        <input
                                            type="text"
                                            value={editData.tags}
                                            onChange={(e) => setEditData({ ...editData, tags: e.target.value })}
                                        />
                                    </div>
                                    <div className={styles.formActions}>
                                        <button type="submit" className={styles.saveButton} disabled={saving}>
                                            {saving ? 'Saving...' : 'Save changes'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}

                    {activeTab === 'comments' && (
                        <div>
                            <form onSubmit={handleCommentSubmit} className={styles.commentForm}>
                                <textarea
                                    className={styles.commentInput}
                                    placeholder="Add a comment..."
                                    value={newComment}
                                    onChange={e => setNewComment(e.target.value)}
                                />
                                <button type="submit" className={styles.submitButton} disabled={!newComment.trim()}>
                                    Post
                                </button>
                            </form>

                            <div className={styles.commentsList} style={{ marginTop: '1.5rem' }}>
                                {loadingComments ? <p>Loading comments...</p> : comments.length === 0 ? (
                                    <p style={{ color: 'var(--text-secondary)' }}>No comments yet.</p>
                                ) : (
                                    comments.map(comment => (
                                        <div key={comment.id} className={styles.comment}>
                                            <div className={styles.commentHeader}>
                                                <span className={styles.commentAuthor}>{comment.user?.email || 'User ' + comment.user_id}</span>
                                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                    <span className={styles.commentDate}>{new Date(comment.created_at).toLocaleString()}</span>
                                                    <button className={styles.deleteButton} onClick={() => handleCommentDelete(comment.id)}>Delete</button>
                                                </div>
                                            </div>
                                            <div className={styles.commentContent}>
                                                <MarkdownRenderer content={comment.content} />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'files' && (
                        <div>
                            <div {...getRootProps()} className={`${styles.dropzone} ${isDragActive ? styles.active : ''}`}>
                                <input {...getInputProps()} />
                                {uploading ? (
                                    <p>Uploading...</p>
                                ) : isDragActive ? (
                                    <p>Drop the files here ...</p>
                                ) : (
                                    <p>Drag 'n' drop some files here, or click to select files</p>
                                )}
                            </div>

                            <div className={styles.filesList}>
                                {loadingFiles ? <p>Loading files...</p> : files.length === 0 ? (
                                    <p style={{ color: 'var(--text-secondary)' }}>No files attached.</p>
                                ) : (
                                    files.map(file => (
                                        <div key={file.id} className={styles.fileItem}>
                                            <div>
                                                <a
                                                    href={`/api/v1/files/${file.id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={styles.fileName}
                                                >
                                                    {file.filename}
                                                </a>
                                                <span className={styles.fileSize}>{formatSize(file.size)}</span>
                                            </div>
                                            <div className={styles.fileActions}>
                                                <button className={styles.deleteButton} onClick={() => handleFileDelete(file.id)}>Delete</button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
        </>
    );
}
