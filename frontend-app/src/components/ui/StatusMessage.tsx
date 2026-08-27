import type { ReactNode } from 'react'
import styles from './ui.module.css'

type StatusMessageVariant = 'default' | 'error' | 'hint'

interface StatusMessageProps {
  variant?: StatusMessageVariant
  children: ReactNode
}

const VARIANT_CLASS: Record<StatusMessageVariant, string> = {
  default: styles.status,
  error: styles.statusError,
  hint: styles.statusHint,
}

export function StatusMessage({ variant = 'default', children }: StatusMessageProps) {
  return <p className={VARIANT_CLASS[variant]}>{children}</p>
}
