import { apiFetch } from './client'
import type { Colaborador, ColaboradorRequest, Page } from '../types/colaborador'

export function listarColaboradores(
  token: string,
  params: { page?: number; size?: number; incluirInativos?: boolean } = {},
): Promise<Page<Colaborador>> {
  const search = new URLSearchParams()
  search.set('page', String(params.page ?? 0))
  search.set('size', String(params.size ?? 100))
  search.set('sort', 'nome,ASC')
  if (params.incluirInativos) {
    search.set('incluirInativos', 'true')
  }

  return apiFetch<Page<Colaborador>>(`/api/colaboradores?${search}`, {}, token)
}

export function buscarColaboradorPorId(token: string, id: number): Promise<Colaborador> {
  return apiFetch<Colaborador>(`/api/colaboradores/${id}`, {}, token)
}

export function criarColaborador(token: string, body: ColaboradorRequest): Promise<Colaborador> {
  return apiFetch<Colaborador>(
    '/api/colaboradores',
    { method: 'POST', body: JSON.stringify(body) },
    token,
  )
}

export function atualizarColaborador(
  token: string,
  id: number,
  body: ColaboradorRequest,
): Promise<Colaborador> {
  return apiFetch<Colaborador>(
    `/api/colaboradores/${id}`,
    { method: 'PUT', body: JSON.stringify(body) },
    token,
  )
}

export function inativarColaborador(token: string, id: number): Promise<void> {
  return apiFetch<void>(`/api/colaboradores/${id}`, { method: 'DELETE' }, token)
}
