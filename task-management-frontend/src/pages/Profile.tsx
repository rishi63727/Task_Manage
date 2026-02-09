import React from 'react'
import { Layout } from '../components/Layout'
import { useAuth } from '../context/AuthContext'

export function Profile() {
  const { user } = useAuth()

  return (
    <Layout>
      <h2 style={{ marginTop: 0 }}>Profile</h2>
      <div className="card">
        <div className="card-body">
          <div className="form-group">
            <label>Email</label>
            <p style={{ margin: 0 }}>{user?.email}</p>
          </div>
          <div className="form-group">
            <label>User ID</label>
            <p style={{ margin: 0 }}>{user?.id}</p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
