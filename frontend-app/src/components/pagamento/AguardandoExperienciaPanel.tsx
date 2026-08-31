import type { FormaPagamento } from '../../types/pagamento'
import { labelFormaPagamento } from '../../types/pagamento'
import styles from './AguardandoExperienciaPanel.module.css'

interface AguardandoExperienciaPanelProps {
  forma: FormaPagamento
  urlExperiencia: string
  atualizando?: boolean
  onAtualizarStatus: () => void
  compact?: boolean
}

export function AguardandoExperienciaPanel({
  forma,
  urlExperiencia,
  atualizando,
  onAtualizarStatus,
  compact,
}: AguardandoExperienciaPanelProps) {
  const rotuloForma = labelFormaPagamento(forma)

  return (
    <div className={`${styles.panel}${compact ? ` ${styles.compact}` : ''}`} role="status">
      <p className={styles.title}>Aguardando {rotuloForma}</p>
      <p className={styles.text}>
        O pagamento foi iniciado no sistema externo. Abra a tela do cliente para aprovar ou
        recusar — esta página atualiza sozinha a cada poucos segundos.
      </p>
      <div className={styles.actions}>
        <a
          className={styles.linkBtn}
          href={urlExperiencia}
          target="_blank"
          rel="noopener noreferrer"
        >
          Abrir tela de {rotuloForma}
        </a>
        <button
          type="button"
          className={styles.refreshBtn}
          disabled={atualizando}
          onClick={onAtualizarStatus}
        >
          {atualizando ? 'Atualizando…' : 'Atualizar status'}
        </button>
      </div>
    </div>
  )
}
