import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { 
  User, 
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  AuthError
} from 'firebase/auth'
import { auth, googleProvider } from '../lib/firebase'
import { toast } from 'react-hot-toast'

interface AuthContextType {
  currentUser: User | null
  loading: boolean
  error: string | null
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  error: null,
  loginWithGoogle: async () => {},
  logout: async () => {}
})

export const useAuth = () => {
  return useContext(AuthContext)
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      setLoading(false)
    }, (error) => {
      console.error('Auth state change error:', error)
      setError(error.message)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const loginWithGoogle = async () => {
    try {
      setError(null)
      setLoading(true)
      const result = await signInWithPopup(auth, googleProvider)
      toast.success(`Welcome ${result.user.displayName || 'User'}!`)
    } catch (error) {
      const authError = error as AuthError
      console.error('Login error:', authError)
      let errorMessage = 'Failed to login. Please try again.'
      
      // Handle specific error codes
      switch (authError.code) {
        case 'auth/popup-blocked':
          errorMessage = 'Please enable popups for this site to login.'
          break
        case 'auth/popup-closed-by-user':
          errorMessage = 'Login cancelled. Please try again.'
          break
        case 'auth/unauthorized-domain':
          errorMessage = 'This domain is not authorized for login. Please contact support.'
          break
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection.'
          break
      }
      
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setError(null)
      await signOut(auth)
      toast.success('Logged out successfully')
    } catch (error) {
      const authError = error as AuthError
      console.error('Logout error:', authError)
      const errorMessage = 'Failed to logout. Please try again.'
      setError(errorMessage)
      toast.error(errorMessage)
    }
  }

  const value = {
    currentUser,
    loading,
    error,
    loginWithGoogle,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
} 