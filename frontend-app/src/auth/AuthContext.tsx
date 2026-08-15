import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { login as loginApi } from '../api/auth'
import { ApiError } from '../api/client'
import type { AuthSession, LoginRequest } from '../types/auth'
import { clearSession, loadSession, saveSession } from './storage'

interface AuthContextValue {
  session: AuthSession | null
  isAuthenticated: boolean
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => loadSession())

  const login = useCallback(async (credentials: LoginRequest) => {
    const response = await loginApi(credentials)
    const next: AuthSession = {
      token: response.token,
      colaboradorId: response.colaboradorId,
      nome: response.nome,
      email: response.email,
      perfil: response.perfil,
    }
    saveSession(next)
    setSession(next)
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setSession(null)
  }, [])

  const value = useMemo(
    () => ({
      session,
      isAuthenticated: session !== null,
      login,
      logout,
    }),
    [session, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return ctx
}

export function getLoginErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return 'E-mail ou senha inválidos.'
    }
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'Não foi possível entrar. Tente novamente.'
}
