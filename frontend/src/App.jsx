import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Analytics } from '@vercel/analytics/react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import SetupPage from './pages/SetupPage'
import NewSetup from './pages/NewSetup'
import EditSetup from './pages/EditSetup'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import HowTo from './pages/HowTo'
import Events from './pages/Events'
import './styles/global.css'

function RequireAuth({ children }) {
  const { session, loading } = useAuth()
  const location = useLocation()
  if (loading) return null
  if (!session) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  return children
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/"                element={<Home />} />
          <Route path="/setup/:id"       element={<SetupPage />} />
          <Route path="/how-to"          element={<HowTo />} />
          <Route path="/events/:type"    element={<Events />} />
          <Route path="/login"           element={<Login />} />
          <Route path="/register"        element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password"  element={<ResetPassword />} />
          <Route path="/new"             element={<RequireAuth><NewSetup /></RequireAuth>} />
          <Route path="/edit/:id"        element={<RequireAuth><EditSetup /></RequireAuth>} />
          <Route path="/dashboard"       element={<RequireAuth><Dashboard /></RequireAuth>} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <AppRoutes />
          <Analytics />
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}
