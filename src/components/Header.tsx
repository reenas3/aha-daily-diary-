import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

const Header = () => {
  const location = useLocation()
  const { currentUser, logout } = useAuth()
  const isAdminRoute = location.pathname.startsWith('/admin')

  // Format email to show only the first part before @
  const formatEmail = (email: string) => {
    return email.split('@')[0]
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      toast.error('Error logging out')
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
                AHA Site Diary
              </h1>
            </Link>
            {currentUser && (
              <nav className="ml-10 flex items-center space-x-4">
                <Link
                  to="/admin"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === '/admin'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  View All Entries
                </Link>
              </nav>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {currentUser && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-md">
                  <span className="text-sm text-gray-600">
                    {formatEmail(currentUser.email || '')}
                  </span>
                </div>
                {isAdminRoute ? (
                  <Link
                    to="/"
                    className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                  >
                    New Entry
                  </Link>
                ) : (
                  <Link
                    to="/admin"
                    className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                  >
                    View Entries
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
            {!currentUser && (
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header 