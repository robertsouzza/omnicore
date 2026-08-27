import { describe, expect, it } from 'vitest'
import { calcularNivelEstoque, formatarTooltipIndicador } from './estoqueIndicador'

describe('calcularNivelEstoque', () => {
  it('retorna zerado quando saldo é 0', () => {
    expect(calcularNivelEstoque(0, 100)).toBe('zerado')
  })

  it('retorna cheio no pico ou acima', () => {
    expect(calcularNivelEstoque(100, 100)).toBe('cheio')
    expect(calcularNivelEstoque(120, 100)).toBe('cheio')
  })

  it('retorna medio entre 50% e 99%', () => {
    expect(calcularNivelEstoque(50, 100)).toBe('medio')
    expect(calcularNivelEstoque(75, 100)).toBe('medio')
  })

  it('retorna baixo entre 25% e 49%', () => {
    expect(calcularNivelEstoque(25, 100)).toBe('baixo')
    expect(calcularNivelEstoque(37, 100)).toBe('baixo')
  })

  it('retorna critico abaixo de 25% com saldo positivo', () => {
    expect(calcularNivelEstoque(3, 20)).toBe('critico')
    expect(calcularNivelEstoque(1, 100)).toBe('critico')
  })

  it('usa o saldo atual como referência mínima', () => {
    expect(calcularNivelEstoque(10, 0)).toBe('cheio')
  })
})

describe('formatarTooltipIndicador', () => {
  it('formata percentual do pico histórico', () => {
    expect(formatarTooltipIndicador(37, 100)).toBe('37 de 100 un. (37% do pico histórico)')
  })

  it('omite percentual quando saldo e referência são zero', () => {
    expect(formatarTooltipIndicador(0, 0)).toBe('0 un.')
  })

  it('usa saldo como referência quando pico histórico é zero', () => {
    expect(formatarTooltipIndicador(5, 0)).toBe('5 de 5 un. (100% do pico histórico)')
  })
})
