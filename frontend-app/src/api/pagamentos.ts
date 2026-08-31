import { apiFetch } from './client'
import type { PagamentoVenda } from '../types/pagamento'

export function listarPagamentosVenda(token: string, vendaId: number): Promise<PagamentoVenda[]> {
  return apiFetch<PagamentoVenda[]>(`/api/pagamentos/venda/${vendaId}`, {}, token)
}
