import type { InputHTMLAttributes, ReactNode } from 'react'
import styles from './ui.module.css'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: ReactNode
  error?: string
  hint?: string
  mono?: boolean
}

export function TextField({ label, error, hint, mono, className, id, ...props }: TextFieldProps) {
  const inputId = id ?? (typeof label === 'string' ? label.replace(/\s+/g, '-').toLowerCase() : undefined)
  const inputClass = [
    styles.input,
    mono ? styles.inputMono : '',
    error ? styles.inputError : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel} htmlFor={inputId}>
        {label}
        <input id={inputId} className={inputClass} {...props} />
      </label>
      {error && <span className={styles.fieldError}>{error}</span>}
      {!error && hint && <span className={styles.fieldHint}>{hint}</span>}
    </div>
  )
}
