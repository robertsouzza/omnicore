import { type FormEvent, useRef, useState } from 'react'
import { onlyDigits } from '../utils/strings'
import { BarcodeScannerModal } from './BarcodeScannerModal'
import styles from './BarcodeField.module.css'

interface BarcodeFieldProps {
  disabled?: boolean
  loading?: boolean
  feedback?: { type: 'ok' | 'error' | 'loading'; message: string } | null
  onSubmitCode: (code: string) => void | Promise<void>
  /** ID do input (ex.: PDV vs salão). */
  inputId?: string
  /** Classe extra no input (ex.: tamanho maior no PDV). */
  inputClassName?: string
}

export function BarcodeField({
  disabled,
  loading,
  feedback,
  onSubmitCode,
  inputId = 'barcode-input',
  inputClassName,
}: BarcodeFieldProps) {
  const [value, setValue] = useState('')
  const [scannerOpen, setScannerOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function submitRaw(raw: string) {
    const code = onlyDigits(raw).trim() || raw.trim()
    if (code.length < 3) return
    await onSubmitCode(code)
    setValue('')
    inputRef.current?.focus()
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    void submitRaw(value)
  }

  function handleDetected(code: string) {
    void submitRaw(code)
  }

  const feedbackClass =
    feedback?.type === 'ok'
      ? styles.feedbackOk
      : feedback?.type === 'error'
        ? styles.feedbackError
        : styles.feedbackLoading

  return (
    <>
      <form className={styles.field} onSubmit={handleSubmit}>
        <label className={styles.label} htmlFor={inputId}>
          Código de barras
        </label>
        <div className={styles.row}>
          <input
            id={inputId}
            ref={inputRef}
            className={`${styles.input}${inputClassName ? ` ${inputClassName}` : ''}`}
            value={value}
            onChange={(e) => setValue(onlyDigits(e.target.value))}
            placeholder="Escaneie ou digite o EAN"
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            disabled={disabled || loading}
          />
          <button
            type="button"
            className={styles.scanBtn}
            disabled={disabled || loading}
            onClick={() => setScannerOpen(true)}
          >
            Câmera
          </button>
        </div>
        <p className={`${styles.feedback} ${feedback ? feedbackClass : ''}`} aria-live="polite">
          {feedback?.message ?? '\u00a0'}
        </p>
      </form>

      <BarcodeScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={handleDetected}
      />
    </>
  )
}
