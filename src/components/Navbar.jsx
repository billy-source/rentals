import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

export default function Navbar() {
  const { session, profile, isAdmin, signOut } = useAuth()
  const nav = useNavigate()
  const out = async () => { await signOut(); nav('/') }

  return (
    <header>
      <div className="bar">
        <Link to="/" className="logo">Savanna Wheels</Link>
        <Link className="btn" to="/">Cars</Link>
        {!session && <Link className="btn" to="/login">Sign in</Link>}
        {!session && <Link className="btn pri" to="/login" state={{ register: true }}>Create account</Link>}
        {session && !isAdmin && <Link className="btn" to="/my-inquiries">My inquiries</Link>}
        {isAdmin && <Link className="btn" to="/admin">Dashboard</Link>}
        {session && (
          <button className="btn" onClick={out}>
            Sign out ({(profile?.full_name || 'Account').split(' ')[0]})
          </button>
        )}
      </div>
    </header>
  )
}
