import { apiFetch } from './client'
import type { Page, Produto, ProdutoRequest } from '../types/produto'

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

export function buscarProduto(token: string, id: number): Promise<Produto> {
  return apiFetch<Produto>(`/api/produtos/${id}`, {}, token)
}

export function criarProduto(token: string, dados: ProdutoRequest): Promise<Produto> {
  return apiFetch<Produto>(
    '/api/produtos',
    { method: 'POST', body: JSON.stringify(dados) },
    token,
  )
}

export function atualizarProduto(
  token: string,
  id: number,
  dados: ProdutoRequest,
): Promise<Produto> {
  return apiFetch<Produto>(
    `/api/produtos/${id}`,
    { method: 'PUT', body: JSON.stringify(dados) },
    token,
  )
}

export function inativarProduto(token: string, id: number): Promise<void> {
  return apiFetch<void>(`/api/produtos/${id}`, { method: 'DELETE' }, token)
}
