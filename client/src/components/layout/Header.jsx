import { useState, useRef, useEffect } from 'react'
import { LogOut, ChevronDown, User } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { ROLE_LABELS } from '../../utils/status'

export default function Header({ title }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const initials = user
    ? `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase()
    : '?'

  return (
    <header className="h-14 bg-white border-b border-dark/5 flex items-center justify-between px-6 shrink-0">
      <h1 className="font-serif text-lg text-dark">{title}</h1>

      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2.5 hover:bg-dark/5 px-2 py-1.5 rounded-lg transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-gold/15 flex items-center justify-center">
            <span className="text-gold text-xs font-semibold">{initials}</span>
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-sm font-medium text-dark leading-none">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-dark/40 leading-none mt-0.5">
              {ROLE_LABELS[user?.role] ?? user?.role}
            </p>
          </div>
          <ChevronDown size={14} className="text-dark/40" />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl border border-dark/5 shadow-card-hover py-1 z-20">
            <div className="px-3 py-2 border-b border-dark/5">
              <p className="text-xs text-dark/40">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-dark/70 hover:text-dark hover:bg-dark/5 transition-colors"
            >
              <LogOut size={14} />
              Déconnexion
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
