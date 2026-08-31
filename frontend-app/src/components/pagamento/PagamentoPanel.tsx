import { useCallback, useMemo, useState } from 'react'
import type { FormaPagamento } from '../../types/pagamento'
import { FORMAS_PAGAMENTO } from '../../types/pagamento'
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
}

export function PagamentoPanel({
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
}: PagamentoPanelProps) {
  const formaInfo = FORMAS_PAGAMENTO.find((f) => f.value === forma)
  const troco = useMemo(() => {
    if (forma !== 'DINHEIRO') return null
    const recebido = Number(valorRecebido.replace(',', '.'))
    if (!Number.isFinite(recebido) || recebido <= 0) return null
    return calcularTroco(recebido, total)
  }, [forma, valorRecebido, total])

  return (
    <div className={`${styles.panel}${compact ? ` ${styles.compact}` : ''}`}>
      <h3 className={styles.title}>Forma de pagamento</h3>
      <p className={styles.totalLine}>
        Total: <strong>{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
      </p>

      <div className={styles.formas} role="radiogroup" aria-label="Forma de pagamento">
        {FORMAS_PAGAMENTO.map((item) => (
          <label key={item.value} className={styles.formaOption}>
            <input
              type="radio"
              name="forma-pagamento"
              value={item.value}
              checked={forma === item.value}
              disabled={disabled}
              onChange={() => onFormaChange(item.value)}
            />
            <span>{item.label}</span>
          </label>
        ))}
      </div>

      {formaInfo?.hint && <p className={styles.hint}>{formaInfo.hint}</p>}

      {forma === 'DINHEIRO' && (
        <label className={styles.field}>
          Valor recebido
          <input
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
}

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
