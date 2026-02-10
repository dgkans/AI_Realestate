import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { parseJson } from '../utils/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const refreshMe = async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' })
      const data = await parseJson(res)
      if (!res.ok) {
        setCurrentUser(null)
        return
      }
      setCurrentUser(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshMe()
  }, [])

  const login = async ({ email, password }) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    })
    const data = await parseJson(res)
    if (!res.ok) {
      throw new Error(data?.message || 'Login failed.')
    }
    setCurrentUser(data)
    return data
  }

  const register = async ({ username, email, password }) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, email, password }),
    })
    const data = await parseJson(res)
    if (!res.ok) {
      throw new Error(data?.message || 'Registration failed.')
    }
    setCurrentUser(data)
    return data
  }

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    setCurrentUser(null)
  }

  const value = useMemo(
    () => ({ currentUser, loading, login, register, logout, refreshMe }),
    [currentUser, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
