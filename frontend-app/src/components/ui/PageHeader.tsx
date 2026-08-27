import type { ReactNode } from 'react'
import styles from './ui.module.css'

interface PageHeaderProps {
  title: string
  subtitle?: string
  badge?: ReactNode
  actions?: ReactNode
}

export function PageHeader({ title, subtitle, badge, actions }: PageHeaderProps) {
  return (
    <header className={styles.pageHeader}>
      <div className={styles.pageHeaderMain}>
        <h1 className={styles.pageTitle}>{title}</h1>
        {subtitle && <p className={styles.pageSubtitle}>{subtitle}</p>}
      </div>
      {(badge || actions) && (
        <div className={styles.pageHeaderAside}>
          {badge && <span className={styles.badge}>{badge}</span>}
          {actions}
        </div>
      )}
    </header>
  )
}
