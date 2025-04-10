import { Routes, Route } from 'react-router-dom'
import DailyDiaryForm from './pages/DailyDiaryForm'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import PrivateRoute from './components/PrivateRoute'
import AdminRoute from './components/AdminRoute'
import Header from './components/Header'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pt-16">
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Admin Routes */}
          <Route
            path="/admin/*"
            element={
              <AdminRoute>
                <Routes>
                  <Route path="/" element={<AdminDashboard />} />
                  <Route path="/dashboard" element={<AdminDashboard />} />
                  <Route path="/entries" element={<AdminDashboard />} />
                  <Route path="/analytics" element={<AdminDashboard />} />
                  <Route path="/settings" element={<AdminDashboard />} />
                </Routes>
              </AdminRoute>
            }
          />

          {/* User Routes */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <DailyDiaryForm />
              </PrivateRoute>
            }
          />
        </Routes>
      </main>
    </div>
  )
}

export default App 