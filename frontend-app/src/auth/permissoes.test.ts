import { describe, expect, it } from 'vitest'
import {
  podeAcessarRota,
  podeEditarCatalogo,
  podeFiltrarVendasPorVendedor,
  rotaInicialPorPerfil,
} from './permissoes'

describe('permissoes', () => {
  it('vendedor não acessa caixa', () => {
    expect(podeAcessarRota('VENDEDOR', '/caixa')).toBe(false)
    expect(podeAcessarRota('VENDEDOR', '/salao')).toBe(true)
  })

  it('caixa acessa fila do caixa', () => {
    expect(podeAcessarRota('CAIXA', '/caixa')).toBe(true)
    expect(podeAcessarRota('CAIXA', '/vendas')).toBe(false)
  })

  it('conferente edita catálogo e não vende', () => {
    expect(podeEditarCatalogo('CONFERENTE')).toBe(true)
    expect(podeAcessarRota('CONFERENTE', '/vendas')).toBe(false)
  })

  it('gerente filtra vendas por vendedor', () => {
    expect(podeFiltrarVendasPorVendedor('GERENTE')).toBe(true)
    expect(podeFiltrarVendasPorVendedor('VENDEDOR')).toBe(false)
  })

  it('define home por perfil', () => {
    expect(rotaInicialPorPerfil('CAIXA')).toBe('/caixa')
    expect(rotaInicialPorPerfil('VENDEDOR')).toBe('/salao')
  })
})
