export type NivelEstoque = 'cheio' | 'medio' | 'baixo' | 'critico' | 'zerado'

export interface SaldoIndicador {
  saldo: number
  referencia: number
}

/**
 * Percentual em relação ao pico histórico (referência = 100%).
 * Faixas: cheio ≥100% · médio ≥50% · baixo ≥25% · crítico >0 · zerado = 0.
 */
export function calcularNivelEstoque(saldo: number, referencia: number): NivelEstoque {
  if (saldo <= 0) return 'zerado'

  const ref = Math.max(referencia, saldo)
  const percentual = (saldo / ref) * 100

  if (percentual >= 100) return 'cheio'
  if (percentual >= 50) return 'medio'
  if (percentual >= 25) return 'baixo'
  return 'critico'
}

export function formatarTooltipIndicador(saldo: number, referencia: number): string {
  const ref = Math.max(referencia, saldo)
  if (ref <= 0) return `${saldo} un.`
  const pct = Math.round((saldo / ref) * 100)
  return `${saldo} de ${ref} un. (${pct}% do pico histórico)`
}
