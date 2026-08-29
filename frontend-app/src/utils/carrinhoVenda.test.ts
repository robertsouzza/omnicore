import { describe, expect, it } from 'vitest'
import { clampQuantidade, parseQuantidadeInput, validarCarrinho } from './carrinhoVenda'

describe('carrinhoVenda', () => {
  it('clampQuantidade limita ao saldo máximo', () => {
    expect(clampQuantidade(50, 45)).toBe(45)
    expect(clampQuantidade(0, 45)).toBe(1)
    expect(clampQuantidade(10, 45)).toBe(10)
  })

  it('parseQuantidadeInput interpreta digitação do usuário', () => {
    expect(parseQuantidadeInput('46', 45)).toBe(45)
    expect(parseQuantidadeInput('', 45)).toBe(1)
    expect(parseQuantidadeInput('12', 45)).toBe(12)
  })

  it('validarCarrinho rejeita quantidade acima do estoque', () => {
    const erro = validarCarrinho([
      {
        key: 'a',
        produtoId: 1,
        produtoNome: 'Coca-Cola',
        quantidade: 46,
        precoUnitario: 4.5,
        desconto: 0,
        saldoMax: 45,
      },
    ])
    expect(erro).toMatch(/excede estoque/)
  })
})
