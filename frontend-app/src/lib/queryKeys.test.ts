import { describe, expect, it } from 'vitest'
import { queryKeys } from './queryKeys'

describe('queryKeys', () => {
  it('gera chaves estáveis para listagem de produtos', () => {
    const filters = {
      page: 0,
      incluirInativos: false,
      nome: 'coca',
    }

    expect(queryKeys.produtos.list(filters)).toEqual([
      'produtos',
      'list',
      { page: 0, incluirInativos: false, nome: 'coca' },
    ])
  })

  it('diferencia filtros distintos', () => {
    const a = queryKeys.produtos.list({ page: 0, incluirInativos: false })
    const b = queryKeys.produtos.list({ page: 1, incluirInativos: false })
    expect(a).not.toEqual(b)
  })

  it('expõe chaves de estoque por produto', () => {
    expect(queryKeys.estoque.indicador(8)).toEqual(['estoque', 'indicador', 8])
  })
})
