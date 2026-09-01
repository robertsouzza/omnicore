import type { FormaPagamento } from '../types/pagamento'
import { FORMAS_PAGAMENTO } from '../types/pagamento'

/** Teclas 1–4 na ordem de FORMAS_PAGAMENTO (PDV sem mouse). */
export const ATALHO_TECLAS_FORMA = ['1', '2', '3', '4'] as const

export function formaPagamentoPorTecla(tecla: string): FormaPagamento | null {
  const index = ATALHO_TECLAS_FORMA.indexOf(tecla as (typeof ATALHO_TECLAS_FORMA)[number])
  if (index < 0 || index >= FORMAS_PAGAMENTO.length) return null
  return FORMAS_PAGAMENTO[index].value
}

export function teclaFormaPagamento(forma: FormaPagamento): string | null {
  const index = FORMAS_PAGAMENTO.findIndex((f) => f.value === forma)
  if (index < 0) return null
  return ATALHO_TECLAS_FORMA[index]
}
