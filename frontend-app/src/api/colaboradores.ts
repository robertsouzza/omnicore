import { apiFetch } from './client'
import type { Colaborador, Page } from '../types/colaborador'

export function listarColaboradores(
  token: string,
  params: { page?: number; size?: number } = {},
): Promise<Page<Colaborador>> {
  const search = new URLSearchParams()
  search.set('page', String(params.page ?? 0))
  search.set('size', String(params.size ?? 100))
  search.set('sort', 'nome,ASC')

  return apiFetch<Page<Colaborador>>(`/api/colaboradores?${search}`, {}, token)
}
