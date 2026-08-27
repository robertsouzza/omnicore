import type { SaldoStatus } from '../hooks/useProdutoSaldos'
import { calcularNivelEstoque, formatarTooltipIndicador } from '../utils/estoqueIndicador'
import styles from './SaldoCell.module.css'

const NIVEL_CLASS: Record<ReturnType<typeof calcularNivelEstoque>, string> = {
  cheio: styles.saldoCheio,
  medio: styles.saldoMedio,
  baixo: styles.saldoBaixo,
  critico: styles.saldoCritico,
  zerado: styles.saldoZerado,
}

interface SaldoCellProps {
  status: SaldoStatus
  /** Cores por faixa (% do pico histórico) — use na listagem de Produtos. */
  indicador?: boolean
}

function SaldoContent({ status, indicador }: SaldoCellProps) {
  if (status.state === 'loading') {
    return <span className={styles.saldoLoading}>…</span>
  }
  if (status.state === 'error') {
    return <span className={styles.saldoError}>—</span>
  }
  if (status.state !== 'loaded') {
    return <span className={styles.saldoLoading}>…</span>
  }

  const { saldo, referencia } = status

  if (!indicador || referencia == null) {
    return (
      <span className={saldo === 0 ? styles.saldoZerado : styles.saldoValue} title={`${saldo} un.`}>
        {saldo}
      </span>
    )
  }

  const nivel = calcularNivelEstoque(saldo, referencia)
  return (
    <span className={NIVEL_CLASS[nivel]} title={formatarTooltipIndicador(saldo, referencia)}>
      {saldo}
    </span>
  )
}

export function SaldoCell({ status, indicador = false }: SaldoCellProps) {
  return (
    <div className={styles.saldoWrap}>
      <SaldoContent status={status} indicador={indicador} />
    </div>
  )
}

export function SaldoKitPlaceholder() {
  return (
    <div className={styles.saldoWrap}>
      <span
        className={styles.saldoKit}
        title="Kits usam o estoque dos componentes — veja em Produtos → Kit"
      >
        —
      </span>
    </div>
  )
}
