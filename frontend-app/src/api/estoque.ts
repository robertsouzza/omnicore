import { apiFetch } from './client'
import type {
  MovimentacaoEstoque,
  MovimentacaoEstoqueRequest,
  Page,
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
