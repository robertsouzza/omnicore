import { apiFetch } from './client'
import type {
  MovimentacaoEstoque,
  MovimentacaoEstoqueRequest,
  Page,
  SaldoIndicador,
  SaldoIndicadorLoteItem,
} from '../types/estoque'

export interface ListarHistoricoParams {
  page?: number
  size?: number
}

export function registrarEntrada(
  token: string,
  dados: MovimentacaoEstoqueRequest,
): Promise<void> {
  return apiFetch<void>(
    '/api/estoque/entrada',
    { method: 'POST', body: JSON.stringify(dados) },
    token,
  )
}

export function registrarSaida(
  token: string,
  dados: MovimentacaoEstoqueRequest,
): Promise<void> {
  return apiFetch<void>(
    '/api/estoque/saida',
    { method: 'POST', body: JSON.stringify(dados) },
    token,
  )
}

export function obterSaldo(token: string, produtoId: number): Promise<number> {
  return apiFetch<number>(`/api/estoque/saldo/${produtoId}`, {}, token)
}

export function obterSaldoIndicador(token: string, produtoId: number): Promise<SaldoIndicador> {
  return apiFetch<SaldoIndicador>(`/api/estoque/saldo/${produtoId}/indicador`, {}, token)
}

export function obterSaldosIndicadorLote(
  token: string,
  produtoIds: number[],
): Promise<SaldoIndicadorLoteItem[]> {
  if (produtoIds.length === 0) {
    return Promise.resolve([])
  }
  const search = new URLSearchParams()
  for (const id of produtoIds) {
    search.append('ids', String(id))
  }
  return apiFetch<SaldoIndicadorLoteItem[]>(`/api/estoque/saldos/indicador?${search}`, {}, token)
}

export function listarHistorico(
  token: string,
  produtoId: number,
  params: ListarHistoricoParams = {},
): Promise<Page<MovimentacaoEstoque>> {
  const search = new URLSearchParams()
  search.set('page', String(params.page ?? 0))
  search.set('size', String(params.size ?? 20))

  return apiFetch<Page<MovimentacaoEstoque>>(
    `/api/estoque/historico/${produtoId}?${search}`,
    {},
    token,
  )
}
