import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { rotaInicialPorPerfil } from '../auth/permissoes'

export function HomeRedirect() {
  const { session, isAuthenticated } = useAuth()

  if (!isAuthenticated || !session) {
    return <Navigate to="/login" replace />
  }

  return <Navigate to={rotaInicialPorPerfil(session.perfil)} replace />
}
