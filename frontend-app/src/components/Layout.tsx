import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { podeAcessarRota, podeGerenciarEquipe } from '../auth/permissoes'
import { OfflineBanner } from './OfflineBanner'
import styles from './Layout.module.css'

export function Layout() {
  const { session, logout } = useAuth()
  const location = useLocation()
  const isPdv = location.pathname === '/pdv'
  const perfil = session?.perfil

  function navLink(to: string, label: string) {
    if (!perfil || !podeAcessarRota(perfil, to)) return null
    return (
      <Link to={to} className={styles.navLink}>
        {label}
      </Link>
    )
  }

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.logo}>OmniCore</span>
          <span className={styles.subtitle}>Cerebro · Varejo híbrido</span>
        </div>
        <nav className={styles.nav}>
          {navLink('/salao', 'Salão')}
          {navLink('/produtos', 'Produtos')}
          {navLink('/clientes', 'Clientes')}
          {navLink('/estoque', 'Estoque')}
          {navLink('/vendas', 'Vendas')}
          {navLink('/pdv', 'PDV')}
          {navLink('/caixa', 'Caixa')}
          {perfil && podeGerenciarEquipe(perfil) ? (
            <Link to="/equipe" className={styles.navLink}>
              Equipe
            </Link>
          ) : null}
        </nav>
        <div className={styles.userInfo}>
          <span className={styles.userName}>{session?.nome}</span>
          <span className={styles.userPerfil}>{session?.perfil}</span>
        </div>
        <button type="button" className={styles.logoutBtn} onClick={logout}>
          Sair
        </button>
      </header>
      <OfflineBanner />
      <main className={`${styles.main}${isPdv ? ` ${styles.mainPdv}` : ''}`}>
        <Outlet />
      </main>
    </div>
  )
}
