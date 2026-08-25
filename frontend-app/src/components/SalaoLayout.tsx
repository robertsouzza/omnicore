import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { OfflineBanner } from './OfflineBanner'
import styles from './SalaoLayout.module.css'

export function SalaoLayout() {
  const { session, logout } = useAuth()

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.logo}>OmniCore Salão</span>
          <span className={styles.subtitle}>Modo vendedor</span>
        </div>
        {session && (
          <div className={styles.userBlock}>
            <div className={styles.userMeta}>
              <span className={styles.userName}>{session.nome}</span>
              <span className={styles.userPerfil}>{session.perfil}</span>
            </div>
            <button type="button" className={styles.logoutBtn} onClick={logout}>
              Sair
            </button>
          </div>
        )}
      </header>

      <OfflineBanner />

      <main className={styles.main}>
        <Outlet />
      </main>

      <nav className={styles.bottomNav} aria-label="Navegação salão">
        <NavLink
          to="/salao"
          end
          className={({ isActive }) => (isActive ? styles.navItemActive : styles.navItem)}
        >
          <span className={styles.navIcon} aria-hidden="true">
            ⊕
          </span>
          Vender
        </NavLink>
        <NavLink
          to="/salao/vendas"
          className={({ isActive }) => (isActive ? styles.navItemActive : styles.navItem)}
        >
          <span className={styles.navIcon} aria-hidden="true">
            ≡
          </span>
          Vendas
        </NavLink>
        <Link to="/produtos" className={styles.navItem}>
          <span className={styles.navIcon} aria-hidden="true">
            ⚙
          </span>
          Admin
        </Link>
      </nav>
    </div>
  )
}
