import type { ReactNode } from 'react'
import styles from './ui.module.css'

interface SearchPanelProps {
  children: ReactNode
  footer?: ReactNode
}

export function SearchPanel({ children, footer }: SearchPanelProps) {
  return (
    <div className={styles.searchPanel}>
      <div className={styles.searchPanelGrid}>{children}</div>
      {footer && <div className={styles.searchPanelFooter}>{footer}</div>}
    </div>
  )
}
