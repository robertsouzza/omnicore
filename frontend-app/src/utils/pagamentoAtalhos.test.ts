import { describe, expect, it } from 'vitest'
import { formaPagamentoPorTecla, teclaFormaPagamento } from './pagamentoAtalhos'

describe('pagamentoAtalhos', () => {
  it('mapeia teclas 1–4 para formas na ordem do painel', () => {
    expect(formaPagamentoPorTecla('1')).toBe('DINHEIRO')
    expect(formaPagamentoPorTecla('2')).toBe('PIX')
    expect(formaPagamentoPorTecla('3')).toBe('CREDITO')
    expect(formaPagamentoPorTecla('4')).toBe('DEBITO_BANCARIO')
  })

  it('ignora teclas inválidas', () => {
    expect(formaPagamentoPorTecla('5')).toBeNull()
    expect(formaPagamentoPorTecla('a')).toBeNull()
  })

  it('retorna tecla inversa por forma', () => {
    expect(teclaFormaPagamento('PIX')).toBe('2')
    expect(teclaFormaPagamento('DEBITO_BANCARIO')).toBe('4')
  })
})
