import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { podeAcessarRota, rotaInicialPorPerfil } from '../auth/permissoes'
import styles from './RequirePermissao.module.css'

export function RequirePermissao() {
  const { session } = useAuth()
  const location = useLocation()

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (!podeAcessarRota(session.perfil, location.pathname)) {
    return (
      <section className={styles.page}>
        <h1 className={styles.title}>Acesso negado</h1>
        <p className={styles.message}>
          Seu perfil ({session.perfil}) não tem permissão para esta área.
        </p>
        <Link className={styles.link} to={rotaInicialPorPerfil(session.perfil)}>
          Ir para a página inicial do seu perfil
        </Link>
      </section>
    )
  }

  return <Outlet />
}
