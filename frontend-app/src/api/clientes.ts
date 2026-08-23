import { apiFetch } from './client'
import type { Cliente, ClienteRequest, Page, TipoDocumento } from '../types/cliente'

export interface ListarClientesParams {
  page?: number
  size?: number
  incluirInativos?: boolean
  nome?: string
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
  const nome = params.nome?.trim()
  if (nome) {
    search.set('nome', nome)
  }

  return apiFetch<Page<Cliente>>(`/api/clientes?${search}`, {}, token)
}

export function buscarCliente(token: string, id: number): Promise<Cliente> {
  return apiFetch<Cliente>(`/api/clientes/${id}`, {}, token)
}

export function buscarClientePorDocumento(
  token: string,
  tipo: TipoDocumento,
  numero: string,
): Promise<Cliente> {
  const search = new URLSearchParams()
  search.set('tipo', tipo)
  search.set('numero', numero)
  return apiFetch<Cliente>(`/api/clientes/documento?${search}`, {}, token)
}

/** Atalho legado — equivalente a buscarClientePorDocumento(token, 'CPF', cpf). */
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
