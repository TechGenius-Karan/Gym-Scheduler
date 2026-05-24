import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <nav className="border-b border-gray-800 bg-gray-900 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-bold text-white text-lg">GymScheduler</span>
          <Link to="/schedule" className="text-gray-300 hover:text-white text-sm transition">My Schedule</Link>
          <Link to="/tools" className="text-gray-300 hover:text-white text-sm transition">Tools</Link>
        </div>
        <div className="flex items-center gap-3">
          {user?.picture && (
            <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full" />
          )}
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-white transition"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}
