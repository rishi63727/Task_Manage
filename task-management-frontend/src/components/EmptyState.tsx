import React from 'react'

interface EmptyStateProps {
  title: string
  description?: string
  action?: React.ReactNode
  icon?: React.ReactNode
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="empty-state">
      {icon ?? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      )}
      <p style={{ margin: 0, fontWeight: 600, color: 'var(--text)' }}>{title}</p>
      {description && <p style={{ margin: '0.5rem 0 1rem' }}>{description}</p>}
      {action}
    </div>
  )
}
