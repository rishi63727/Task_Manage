import React, { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { LoadingSpinner } from './components/LoadingSpinner'

const Login = lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })))
const Register = lazy(() => import('./pages/Register').then((m) => ({ default: m.Register })))
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })))
const TaskList = lazy(() => import('./pages/TaskList').then((m) => ({ default: m.TaskList })))
const TaskDetail = lazy(() => import('./pages/TaskDetail').then((m) => ({ default: m.TaskDetail })))
const TaskForm = lazy(() => import('./pages/TaskForm').then((m) => ({ default: m.TaskForm })))
const Profile = lazy(() => import('./pages/Profile').then((m) => ({ default: m.Profile })))
const Analytics = lazy(() => import('./pages/Analytics').then((m) => ({ default: m.Analytics })))

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Suspense fallback={<Layout><LoadingSpinner /></Layout>}>
              <Dashboard />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasks"
        element={
          <ProtectedRoute>
            <Suspense fallback={<Layout><LoadingSpinner /></Layout>}>
              <TaskList />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasks/new"
        element={
          <ProtectedRoute>
            <Suspense fallback={<Layout><LoadingSpinner /></Layout>}>
              <TaskForm />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasks/:id"
        element={
          <ProtectedRoute>
            <Suspense fallback={<Layout><LoadingSpinner /></Layout>}>
              <TaskDetail />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasks/:id/edit"
        element={
          <ProtectedRoute>
            <Suspense fallback={<Layout><LoadingSpinner /></Layout>}>
              <TaskForm />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Suspense fallback={<Layout><LoadingSpinner /></Layout>}>
              <Profile />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <Suspense fallback={<Layout><LoadingSpinner /></Layout>}>
              <Analytics />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_relativeSplatPath: true }}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
