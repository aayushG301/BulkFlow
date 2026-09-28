import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { authApi } from '@/services/auth.api'
import { registerSessionExpiredHandler } from '@/services/api'
import { storage } from '@/utils/storage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isInitializing, setIsInitializing] = useState(true)

  const clearSession = useCallback(() => {
    storage.clearTokens()
    setUser(null)
  }, [])

  // On first load, if we have a stored access token, verify it's still
  // good (and refresh-eligible) by fetching the current user.
  useEffect(() => {
    const bootstrap = async () => {
      if (!storage.getAccessToken()) {
        setIsInitializing(false)
        return
      }

      try {
        const response = await authApi.getMe()
        setUser(response.data.data)
      } catch {
        clearSession()
      } finally {
        setIsInitializing(false)
      }
    }

    bootstrap()
  }, [clearSession])

  useEffect(() => {
    registerSessionExpiredHandler(() => {
      setUser(null)
    })
  }, [])

  const login = useCallback(async ({ email, password }) => {
    const response = await authApi.login({ email, password })
    const { accessToken, refreshToken, user: loggedInUser } = response.data.data
    storage.setTokens({ accessToken, refreshToken })
    setUser(loggedInUser)
    return loggedInUser
  }, [])

  const register = useCallback(async ({ name, email, password }) => {
    await authApi.register({ name, email, password })
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // Even if the server call fails (e.g. token already expired),
      // the local session should still be cleared.
    } finally {
      clearSession()
    }
  }, [clearSession])

  const refreshUser = useCallback(async () => {
    const response = await authApi.getMe()
    setUser(response.data.data)
    return response.data.data
  }, [])

  const updateProfile = useCallback(async (payload) => {
    const response = await authApi.updateMe(payload)
    setUser(response.data.data)
    return response.data.data
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isInitializing,
      login,
      register,
      logout,
      refreshUser,
      updateProfile,
    }),
    [user, isInitializing, login, register, logout, refreshUser, updateProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuthContext = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuthContext must be used within an AuthProvider')
  return context
}
