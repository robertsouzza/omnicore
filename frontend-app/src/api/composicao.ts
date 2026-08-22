import { apiFetch } from './client'
import type { ComposicaoPacote, ComposicaoPacoteRequest } from '../types/composicao'

export function listarComposicao(token: string, pacoteId: number): Promise<ComposicaoPacote[]> {
  return apiFetch<ComposicaoPacote[]>(`/api/produtos/${pacoteId}/composicao`, {}, token)
}

export function adicionarComponente(
  token: string,
  pacoteId: number,
  dados: ComposicaoPacoteRequest,
): Promise<ComposicaoPacote> {
  return apiFetch<ComposicaoPacote>(
    `/api/produtos/${pacoteId}/composicao`,
    { method: 'POST', body: JSON.stringify(dados) },
    token,
  )
}

export function removerComponente(
  token: string,
  pacoteId: number,
  composicaoId: number,
): Promise<void> {
  return apiFetch<void>(
    `/api/produtos/${pacoteId}/composicao/${composicaoId}`,
    { method: 'DELETE' },
    token,
  )
}
