import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import MyInquiries from './pages/MyInquiries'
import Dashboard from './pages/Dashboard'
import { useAuth } from './AuthContext'

function Protected({ admin, children }) {
  const { session, isAdmin, loading } = useAuth()
  if (loading) return <p className="empty">Loading...</p>
  if (!session) return <Navigate to="/login" replace />
  if (admin && !isAdmin) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/my-inquiries" element={<Protected><MyInquiries /></Protected>} />
          <Route path="/admin" element={<Protected admin><Dashboard /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  )
}
