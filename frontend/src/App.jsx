import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Landing from './pages/Landing'

// Admin
import AdminDashboard from './pages/admin/Dashboard'
import Apartments from './pages/admin/Apartments'
import Employees from './pages/admin/Employees'
import Schedules from './pages/admin/Schedules'
import Reports from './pages/admin/Reports'
import Products from './pages/admin/Products'
import Billing from './pages/admin/Billing'

// Employee
import MySchedule from './pages/employee/MySchedule'
import TaskExecution from './pages/employee/TaskExecution'

function HomeRedirect() {
  const { user } = useAuth()
  if (user?.role === 'admin') return <AdminDashboard />
  return <MySchedule />
}

function LandingOrApp() {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen grid place-items-center"><div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" /></div>
  if (!user) return <Landing />
  return (
    <Layout>
      <HomeRedirect />
    </Layout>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route path="/" element={<LandingOrApp />} />

          <Route
            path="/apartments"
            element={
              <ProtectedRoute requireAdmin>
                <Layout>
                  <Apartments />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/employees"
            element={
              <ProtectedRoute requireAdmin>
                <Layout>
                  <Employees />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/schedules"
            element={
              <ProtectedRoute requireAdmin>
                <Layout>
                  <Schedules />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <ProtectedRoute requireAdmin>
                <Layout>
                  <Reports />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/products"
            element={
              <ProtectedRoute requireAdmin>
                <Layout>
                  <Products />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/billing"
            element={
              <ProtectedRoute requireAdmin>
                <Layout>
                  <Billing />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/task/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <TaskExecution />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App