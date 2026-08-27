import { describe, expect, it, vi } from 'vitest'
import { ApiError, apiFetch } from './client'

describe('apiFetch', () => {
  it('retorna JSON em resposta 200', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ id: 1, nome: 'Teste' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await apiFetch<{ id: number; nome: string }>('/api/test', {}, 'token')

    expect(result).toEqual({ id: 1, nome: 'Teste' })
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        headers: expect.any(Headers),
      }),
    )
    const headers = fetchMock.mock.calls[0][1].headers as Headers
    expect(headers.get('Authorization')).toBe('Bearer token')
  })

  it('retorna undefined em 204 sem body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
        text: async () => '',
      }),
    )

    const result = await apiFetch<void>('/api/test', { method: 'DELETE' }, 'token')
    expect(result).toBeUndefined()
  })

  it('lança ApiError com message do body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({ message: 'Produto já existe' }),
      }),
    )

    await expect(apiFetch('/api/produtos', { method: 'POST' }, 'token')).rejects.toMatchObject({
      name: 'ApiError',
      message: 'Produto já existe',
      status: 409,
    })
  })

  it('usa mensagem amigável para 500 sem body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('not json')
        },
      }),
    )

    await expect(apiFetch('/api/test', {}, 'token')).rejects.toMatchObject({
      message: 'Erro interno do servidor. Tente novamente em instantes.',
      status: 500,
    })
  })

  it('ApiError expõe status e body', () => {
    const err = new ApiError('Conflito', 409, { fields: { nome: 'Obrigatório' } })
    expect(err).toBeInstanceOf(Error)
    expect(err.status).toBe(409)
    expect(err.body).toEqual({ fields: { nome: 'Obrigatório' } })
  })
})
