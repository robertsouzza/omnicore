import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { FormaPagamento } from '../../types/pagamento'
import { FORMAS_PAGAMENTO } from '../../types/pagamento'
import { teclaFormaPagamento } from '../../utils/pagamentoAtalhos'
import {
  buildPagarVendaRequest,
  calcularTroco,
  validarPagamentoForm,
} from '../../utils/pagamentoForm'
import styles from './PagamentoPanel.module.css'

export interface PagamentoPanelProps {
  total: number
  disabled?: boolean
  forma: FormaPagamento
  onFormaChange: (forma: FormaPagamento) => void
  valorRecebido: string
  onValorRecebidoChange: (value: string) => void
  parcelas: number
  onParcelasChange: (parcelas: number) => void
  error?: string | null
  compact?: boolean
  /** Exibe atalhos 1–4 no PDV (terminal sem mouse). */
  showKeyboardHints?: boolean
  radioGroupName?: string
}

export type PagamentoPanelHandle = {
  focusForma: () => void
  focusCampoExtra: () => void
}

export const PagamentoPanel = forwardRef<PagamentoPanelHandle, PagamentoPanelProps>(
  function PagamentoPanel(
    {
      total,
      disabled,
      forma,
      onFormaChange,
      valorRecebido,
      onValorRecebidoChange,
      parcelas,
      onParcelasChange,
      error,
      compact,
      showKeyboardHints,
      radioGroupName = 'forma-pagamento',
    },
    ref,
  ) {
    const panelRef = useRef<HTMLDivElement>(null)
    const valorRecebidoRef = useRef<HTMLInputElement>(null)
    const parcelasRef = useRef<HTMLSelectElement>(null)

    const formaInfo = FORMAS_PAGAMENTO.find((f) => f.value === forma)
    const troco = useMemo(() => {
      if (forma !== 'DINHEIRO') return null
      const recebido = Number(valorRecebido.replace(',', '.'))
      if (!Number.isFinite(recebido) || recebido <= 0) return null
      return calcularTroco(recebido, total)
    }, [forma, valorRecebido, total])

    const focusForma = useCallback(() => {
      const root = panelRef.current
      if (!root) return
      const checked =
        root.querySelector<HTMLInputElement>(`input[name="${radioGroupName}"]:checked`) ??
        root.querySelector<HTMLInputElement>(`input[name="${radioGroupName}"]`)
      checked?.focus()
      root.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }, [radioGroupName])

    const focusCampoExtra = useCallback(() => {
      if (forma === 'DINHEIRO') {
        valorRecebidoRef.current?.focus()
        return
      }
      if (forma === 'CREDITO') {
        parcelasRef.current?.focus()
      }
    }, [forma])

    useImperativeHandle(ref, () => ({ focusForma, focusCampoExtra }), [
      focusForma,
      focusCampoExtra,
    ])

    return (
      <div
        ref={panelRef}
        className={`${styles.panel}${compact ? ` ${styles.compact}` : ''}`}
      >
        <h3 className={styles.title}>Forma de pagamento</h3>
        <p className={styles.totalLine}>
          Total:{' '}
          <strong>{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
        </p>

        {showKeyboardHints && (
          <p className={styles.keyboardHint}>
            Teclas <kbd>1</kbd>–<kbd>4</kbd> escolhem a forma · <kbd>Tab</kbd> entre campos ·{' '}
            <kbd>Enter</kbd> ou <kbd>F10</kbd> confirma
          </p>
        )}

        <div className={styles.formas} role="radiogroup" aria-label="Forma de pagamento">
          {FORMAS_PAGAMENTO.map((item) => {
            const tecla = showKeyboardHints ? teclaFormaPagamento(item.value) : null
            return (
              <label key={item.value} className={styles.formaOption}>
                <input
                  type="radio"
                  name={radioGroupName}
                  value={item.value}
                  checked={forma === item.value}
                  disabled={disabled}
                  onChange={() => onFormaChange(item.value)}
                />
                <span className={styles.formaLabel}>
                  {tecla != null && <kbd className={styles.formaKbd}>{tecla}</kbd>}
                  {item.label}
                </span>
              </label>
            )
          })}
        </div>

        {formaInfo?.hint && <p className={styles.hint}>{formaInfo.hint}</p>}

        {forma === 'DINHEIRO' && (
          <label className={styles.field}>
            Valor recebido
            <input
              ref={valorRecebidoRef}
              className={styles.input}
              type="text"
              inputMode="decimal"
              value={valorRecebido}
              disabled={disabled}
              onChange={(e) => onValorRecebidoChange(e.target.value)}
              placeholder="0,00"
              autoComplete="off"
            />
          </label>
        )}

        {forma === 'DINHEIRO' && troco != null && (
          <p className={styles.troco}>
            Troco:{' '}
            <strong>{troco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
          </p>
        )}

        {forma === 'CREDITO' && (
          <label className={styles.field}>
            Parcelas
            <select
              ref={parcelasRef}
              className={styles.select}
              value={parcelas}
              disabled={disabled}
              onChange={(e) => onParcelasChange(Number(e.target.value))}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}x
                </option>
              ))}
            </select>
          </label>
        )}

        {error && <p className={styles.error}>{error}</p>}
      </div>
    )
  },
)

export function usePagamentoFormState(total: number) {
  const [forma, setForma] = useState<FormaPagamento>('DINHEIRO')
  const [valorRecebido, setValorRecebido] = useState('')
  const [parcelas, setParcelas] = useState(1)
  const [error, setError] = useState<string | null>(null)

  const reset = useCallback(() => {
    setForma('DINHEIRO')
    setValorRecebido('')
    setParcelas(1)
    setError(null)
  }, [])

  const validate = useCallback((): boolean => {
    const msg = validarPagamentoForm(forma, total, valorRecebido, parcelas)
    setError(msg)
    return msg == null
  }, [forma, total, valorRecebido, parcelas])

  const buildRequest = useCallback(() => {
    return buildPagarVendaRequest(forma, total, valorRecebido, parcelas)
  }, [forma, total, valorRecebido, parcelas])

  return {
    forma,
    setForma,
    valorRecebido,
    setValorRecebido,
    parcelas,
    setParcelas,
    error,
    setError,
    validate,
    buildRequest,
    reset,
  }
}
