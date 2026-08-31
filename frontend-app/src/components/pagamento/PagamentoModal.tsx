import { useEffect } from 'react'
import type { PagarVendaRequest } from '../../types/pagamento'
import type { AguardandoPagamentoExterno } from '../../utils/urlExperiencia'
import type { Venda } from '../../types/venda'
import { formatPreco } from '../../types/venda'
import { AguardandoExperienciaPanel } from './AguardandoExperienciaPanel'
import { PagamentoPanel, usePagamentoFormState } from './PagamentoPanel'
import styles from './PagamentoModal.module.css'

interface PagamentoModalProps {
  venda: Venda | null
  open: boolean
  submitting: boolean
  error: string | null
  aguardandoExterno?: AguardandoPagamentoExterno | null
  atualizandoStatus?: boolean
  onAtualizarStatus?: () => void
  onClose: () => void
  onConfirm: (pagamento: PagarVendaRequest) => void
}

export function PagamentoModal({
  venda,
  open,
  submitting,
  error,
  aguardandoExterno,
  atualizandoStatus,
  onAtualizarStatus,
  onClose,
  onConfirm,
}: PagamentoModalProps) {
  const total = venda?.valorTotal ?? 0
  const pagamento = usePagamentoFormState(total)
  const { reset } = pagamento
  const emAguardo = aguardandoExterno != null

  useEffect(() => {
    if (open && venda && !emAguardo) {
      reset()
    }
  }, [open, venda?.id, emAguardo, reset])

  if (!open || !venda) {
    return null
  }

  function handleConfirm() {
    if (!pagamento.validate()) return
    onConfirm(pagamento.buildRequest())
  }

  return (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pagamento-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.header}>
          <h2 id="pagamento-modal-title" className={styles.title}>
            Pagamento — Venda #{venda.id}
          </h2>
          <p className={styles.subtitle}>Total {formatPreco(venda.valorTotal)}</p>
        </header>

        {emAguardo ? (
          <AguardandoExperienciaPanel
            forma={aguardandoExterno.forma}
            urlExperiencia={aguardandoExterno.urlExperiencia}
            atualizando={atualizandoStatus}
            onAtualizarStatus={onAtualizarStatus ?? (() => undefined)}
            compact
          />
        ) : (
          <PagamentoPanel
            total={venda.valorTotal}
            disabled={submitting}
            forma={pagamento.forma}
            onFormaChange={pagamento.setForma}
            valorRecebido={pagamento.valorRecebido}
            onValorRecebidoChange={pagamento.setValorRecebido}
            parcelas={pagamento.parcelas}
            onParcelasChange={pagamento.setParcelas}
            error={error ?? pagamento.error}
            compact
          />
        )}

        {emAguardo && error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelBtn}
            disabled={submitting && !emAguardo}
            onClick={onClose}
          >
            {emAguardo ? 'Fechar' : 'Cancelar'}
          </button>
          {!emAguardo && (
            <button
              type="button"
              className={styles.confirmBtn}
              disabled={submitting}
              onClick={handleConfirm}
            >
              {submitting ? 'Processando…' : 'Confirmar pagamento'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
