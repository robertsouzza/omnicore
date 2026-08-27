import type { ReactNode, TextareaHTMLAttributes } from 'react'
import styles from './ui.module.css'

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: ReactNode
  error?: string
  hint?: string
}

export function TextArea({ label, error, hint, className, id, ...props }: TextAreaProps) {
  const inputId = id ?? (typeof label === 'string' ? label.replace(/\s+/g, '-').toLowerCase() : undefined)
  const areaClass = [styles.textarea, error ? styles.inputError : '', className].filter(Boolean).join(' ')

  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel} htmlFor={inputId}>
        {label}
        <textarea id={inputId} className={areaClass} {...props} />
      </label>
      {error && <span className={styles.fieldError}>{error}</span>}
      {!error && hint && <span className={styles.fieldHint}>{hint}</span>}
    </div>
  )
}
