import { apiFetch } from './client'
import type { Cliente, ClienteRequest, Page } from '../types/cliente'

export interface ListarClientesParams {
  page?: number
  size?: number
  incluirInativos?: boolean
}

export function listarClientes(
  token: string,
  params: ListarClientesParams = {},
): Promise<Page<Cliente>> {
  const search = new URLSearchParams()
  search.set('page', String(params.page ?? 0))
  search.set('size', String(params.size ?? 20))
  if (params.incluirInativos) {
    search.set('incluirInativos', 'true')
  }

  return apiFetch<Page<Cliente>>(`/api/clientes?${search}`, {}, token)
}

export function buscarCliente(token: string, id: number): Promise<Cliente> {
  return apiFetch<Cliente>(`/api/clientes/${id}`, {}, token)
}

export function buscarClientePorCpf(token: string, cpf: string): Promise<Cliente> {
  const encoded = encodeURIComponent(cpf)
  return apiFetch<Cliente>(`/api/clientes/cpf/${encoded}`, {}, token)
}

export function criarCliente(token: string, dados: ClienteRequest): Promise<Cliente> {
  return apiFetch<Cliente>(
    '/api/clientes',
    { method: 'POST', body: JSON.stringify(dados) },
    token,
  )
}

export function atualizarCliente(
  token: string,
  id: number,
  dados: ClienteRequest,
): Promise<Cliente> {
  return apiFetch<Cliente>(
    `/api/clientes/${id}`,
    { method: 'PUT', body: JSON.stringify(dados) },
    token,
  )
}

export function inativarCliente(token: string, id: number): Promise<void> {
  return apiFetch<void>(`/api/clientes/${id}`, { method: 'DELETE' }, token)
}
