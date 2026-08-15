import { apiFetch } from './client'
import type { Page, Produto } from '../types/produto'

export interface ListarProdutosParams {
  page?: number
  size?: number
  incluirInativos?: boolean
}

export function listarProdutos(
  token: string,
  params: ListarProdutosParams = {},
): Promise<Page<Produto>> {
  const search = new URLSearchParams()
  search.set('page', String(params.page ?? 0))
  search.set('size', String(params.size ?? 20))
  if (params.incluirInativos) {
    search.set('incluirInativos', 'true')
  }

  return apiFetch<Page<Produto>>(`/api/produtos?${search}`, {}, token)
}
