import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface AdminRouteProps {
  children: ReactNode
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { currentUser, loading } = useAuth()

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    )
  }

  // Check if user is authenticated and has admin role
  // For now, we'll use a simple check with a specific admin email
  // In a production environment, you should implement proper role-based authentication
  if (!currentUser || currentUser.email !== 'admin@example.com') {
    return <Navigate to="/login" />
  }

  return <>{children}</>
}

export default AdminRoute 