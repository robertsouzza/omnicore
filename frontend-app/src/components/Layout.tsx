import { Link, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import styles from './Layout.module.css'

export function Layout() {
  const { session, logout } = useAuth()

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.logo}>OmniCore</span>
          <span className={styles.subtitle}>Cerebro · Varejo híbrido</span>
        </div>
        <nav className={styles.nav}>
          <Link to="/produtos" className={styles.navLink}>
            Produtos
          </Link>
          <Link to="/clientes" className={styles.navLink}>
            Clientes
          </Link>
          <Link to="/estoque" className={styles.navLink}>
            Estoque
          </Link>
          <Link to="/vendas" className={styles.navLink}>
            Vendas
          </Link>
        </nav>
        <div className={styles.userInfo}>
          <span className={styles.userName}>{session?.nome}</span>
          <span className={styles.userPerfil}>{session?.perfil}</span>
        </div>
        <button type="button" className={styles.logoutBtn} onClick={logout}>
          Sair
        </button>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
