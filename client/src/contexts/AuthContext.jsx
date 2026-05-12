import { createContext, useState, useEffect, useCallback } from 'react'
import { getMe, logout as apiLogout } from '../api/auth.api'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('plm_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('plm_token')
    if (!token) {
      setLoading(false)
      return
    }
    getMe()
      .then((data) => {
        const userData = data.user ?? data
        setUser(userData)
        localStorage.setItem('plm_user', JSON.stringify(userData))
      })
      .catch(() => {
        localStorage.removeItem('plm_token')
        localStorage.removeItem('plm_user')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const signIn = useCallback((token, userData) => {
    localStorage.setItem('plm_token', token)
    localStorage.setItem('plm_user', JSON.stringify(userData))
    setUser(userData)
  }, [])

  const signOut = useCallback(async () => {
    try {
      await apiLogout()
    } catch {}
    localStorage.removeItem('plm_token')
    localStorage.removeItem('plm_user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
