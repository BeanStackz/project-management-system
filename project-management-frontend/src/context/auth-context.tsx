import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

import { getProfile, login, register, type User } from "@/lib/api"

const TOKEN_KEY = "pms-token"

type AuthStatus = "loading" | "authenticated" | "unauthenticated"

type AuthContextValue = {
  token: string | null
  user: User | null
  status: AuthStatus
  signIn: (email: string, password: string) => Promise<void>
  signUp: (fullName: string, email: string, password: string) => Promise<void>
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readStoredToken() {
  const sessionToken = sessionStorage.getItem(TOKEN_KEY)
  if (sessionToken) return sessionToken

  const legacyToken = localStorage.getItem(TOKEN_KEY)
  if (legacyToken) {
    sessionStorage.setItem(TOKEN_KEY, legacyToken)
    localStorage.removeItem(TOKEN_KEY)
    return legacyToken
  }

  return null
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(readStoredToken)
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<AuthStatus>(() => (token ? "loading" : "unauthenticated"))

  const clearAuth = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
    setStatus("unauthenticated")
  }, [])

  useEffect(() => {
    if (!token) return

    let active = true
    getProfile(token)
      .then((profile) => {
        if (active) {
          setUser(profile)
          setStatus("authenticated")
        }
      })
      .catch(() => {
        if (active) clearAuth()
      })

    return () => {
      active = false
    }
  }, [clearAuth, token])

  const saveToken = useCallback((nextToken: string) => {
    sessionStorage.setItem(TOKEN_KEY, nextToken)
    localStorage.removeItem(TOKEN_KEY)
    setToken(nextToken)
    setStatus("loading")
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const response = await login(email, password)
    saveToken(response.jwt)
  }, [saveToken])

  const signUp = useCallback(async (fullName: string, email: string, password: string) => {
    const response = await register(fullName, email, password)
    saveToken(response.jwt)
  }, [saveToken])

  const value = useMemo(
    () => ({ token, user, status, signIn, signUp, signOut: clearAuth }),
    [clearAuth, signIn, signUp, status, token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}
