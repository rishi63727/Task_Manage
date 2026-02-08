'use client';

import React from "react"

import { useState } from 'react'
import { useTaskStore } from '../stores/taskStore'
import styles from './TeamPage.module.css'

interface TeamMember {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'member'
  taskCount: number
  avatar: string
}

function TeamPage() {
  const { tasks } = useTaskStore()
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')

  const teamMembers: TeamMember[] = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'admin',
      taskCount: 5,
      avatar: 'J',
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'manager',
      taskCount: 4,
      avatar: 'S',
    },
    {
      id: '3',
      name: 'Bob Johnson',
      email: 'bob@example.com',
      role: 'member',
      taskCount: 3,
      avatar: 'B',
    },
    {
      id: '4',
      name: 'Alice Williams',
      email: 'alice@example.com',
      role: 'member',
      taskCount: 2,
      avatar: 'A',
    },
  ]

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault()
    setInviteEmail('')
    setShowInvite(false)
  }

  return (
    <div className={styles.teamPage}>
      <div className={styles.header}>
        <h1>Team</h1>
        <button
          className={styles.inviteButton}
          onClick={() => setShowInvite(!showInvite)}
        >
          + Invite Team Member
        </button>
      </div>

      {showInvite && (
        <div className={styles.inviteForm}>
          <form onSubmit={handleInvite}>
            <input
              type="email"
              placeholder="Enter email address"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
            />
            <button type="submit" className={styles.sendButton}>
              Send Invite
            </button>
          </form>
        </div>
      )}

      <div className={styles.membersGrid}>
        {teamMembers.map((member) => (
          <div key={member.id} className={styles.memberCard}>
            <div className={styles.avatarLarge}>{member.avatar}</div>
            <h3>{member.name}</h3>
            <p className={styles.email}>{member.email}</p>
            <div className={styles.roleAndTasks}>
              <span className={styles.role}>{member.role}</span>
              <span className={styles.taskCount}>{member.taskCount} tasks</span>
            </div>
            <div className={styles.actions}>
              <button className={styles.editButton}>Edit</button>
              <button className={styles.removeButton}>Remove</button>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.stats}>
        <h2>Team Statistics</h2>
        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <p className={styles.statLabel}>Total Members</p>
            <p className={styles.statValue}>{teamMembers.length}</p>
          </div>
          <div className={styles.statItem}>
            <p className={styles.statLabel}>Total Assigned Tasks</p>
            <p className={styles.statValue}>
              {tasks.filter((t) => t.assignee).length}
            </p>
          </div>
          <div className={styles.statItem}>
            <p className={styles.statLabel}>Average Tasks per Person</p>
            <p className={styles.statValue}>
              {(
                tasks.filter((t) => t.assignee).length / teamMembers.length
              ).toFixed(1)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TeamPage
