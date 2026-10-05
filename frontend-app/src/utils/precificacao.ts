/** Preço sugerido: custo ÷ (1 − margem%/100), alinhado ao backend. */
export function calcularPrecoSugerido(precoCusto: number, margemPercent: number): number | null {
  if (!Number.isFinite(precoCusto) || precoCusto < 0) return null
  const margem = Math.min(99, Math.max(0, margemPercent))
  if (margem >= 99) return null
  const divisor = 1 - margem / 100
  if (divisor <= 0) return null
  return Math.round((precoCusto / divisor) * 100) / 100
}

export function precoAbaixoMargem(precoVenda: number, precoSugerido: number | null): boolean {
  if (precoSugerido == null || !Number.isFinite(precoVenda)) return false
  return precoVenda < precoSugerido
}
