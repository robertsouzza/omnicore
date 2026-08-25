import { apiFetch } from './client'
import type { CancelarVendaRequest, Page, StatusVenda, Venda, VendaRequest } from '../types/venda'

export interface ListarVendasParams {
  page?: number
  size?: number
  status?: StatusVenda
  clienteId?: number
  dataInicio?: string
  dataFim?: string
}

export function listarVendas(
  token: string,
  params: ListarVendasParams = {},
): Promise<Page<Venda>> {
  const search = new URLSearchParams()
  search.set('page', String(params.page ?? 0))
  search.set('size', String(params.size ?? 20))
  if (params.status) {
    search.set('status', params.status)
  }
  if (params.clienteId != null) {
    search.set('clienteId', String(params.clienteId))
  }
  if (params.dataInicio) {
    search.set('dataInicio', params.dataInicio)
  }
  if (params.dataFim) {
    search.set('dataFim', params.dataFim)
  }

  return apiFetch<Page<Venda>>(`/api/vendas?${search}`, {}, token)
}

export function buscarVenda(token: string, id: number): Promise<Venda> {
  return apiFetch<Venda>(`/api/vendas/${id}`, {}, token)
}

export function criarVenda(token: string, dados: VendaRequest): Promise<Venda> {
  return apiFetch<Venda>(
    '/api/vendas',
    { method: 'POST', body: JSON.stringify(dados) },
    token,
  )
}

export function cancelarVenda(
  token: string,
  id: number,
  payload?: CancelarVendaRequest,
): Promise<Venda> {
  return apiFetch<Venda>(
    `/api/vendas/${id}/cancelar`,
    {
      method: 'PUT',
      body: JSON.stringify(payload ?? {}),
    },
    token,
  )
}
