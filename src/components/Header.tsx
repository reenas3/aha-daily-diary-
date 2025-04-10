import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { Link, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'

const Header = () => {
  const location = useLocation()
  const isAdmin = auth.currentUser?.email === 'admin@example.com'
  const isAdminRoute = location.pathname.startsWith('/admin')

  const handleLogout = async () => {
    try {
      await signOut(auth)
      toast.success('Logged out successfully')
    } catch (error) {
      toast.error('Error logging out')
    }
  }

  return (
    <header className="bg-white shadow">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              AHA Site Diary
            </h1>
            {isAdmin && (
              <nav className="hidden sm:flex space-x-4">
                <Link
                  to="/admin/dashboard"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === '/admin/dashboard'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/admin/entries"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === '/admin/entries'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  All Entries
                </Link>
                <Link
                  to="/admin/analytics"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === '/admin/analytics'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Analytics
                </Link>
                <Link
                  to="/admin/settings"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === '/admin/settings'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Settings
                </Link>
              </nav>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {isAdmin && !isAdminRoute && (
              <Link
                to="/admin"
                className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200"
              >
                Admin Panel
              </Link>
            )}
            {isAdmin && isAdminRoute && (
              <Link
                to="/"
                className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200"
              >
                Site Diary
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header 