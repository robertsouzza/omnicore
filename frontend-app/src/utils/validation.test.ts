import { describe, expect, it } from 'vitest'
import { ApiError } from '../api/client'
import { getErrorMessage, getFieldErrors } from './validation'

describe('getErrorMessage', () => {
  it('retorna message de ApiError', () => {
    const err = new ApiError('Token inválido', 401)
    expect(getErrorMessage(err, 'fallback')).toBe('Token inválido')
  })

  it('retorna message de Error genérico', () => {
    expect(getErrorMessage(new Error('Falha de rede'), 'fallback')).toBe('Falha de rede')
  })

  it('retorna fallback para valor desconhecido', () => {
    expect(getErrorMessage('oops', 'Erro ao carregar')).toBe('Erro ao carregar')
  })
})

describe('getFieldErrors', () => {
  it('extrai fields de ApiError com body de validação', () => {
    const err = new ApiError('Validação', 400, {
      fields: { nome: 'Obrigatório', precoVenda: 'Deve ser positivo' },
    })
    expect(getFieldErrors(err)).toEqual({
      nome: 'Obrigatório',
      precoVenda: 'Deve ser positivo',
    })
  })

  it('retorna objeto vazio para erro sem fields', () => {
    expect(getFieldErrors(new ApiError('Erro', 500))).toEqual({})
    expect(getFieldErrors(new Error('x'))).toEqual({})
  })
})
