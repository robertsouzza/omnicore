import { describe, expect, it } from 'vitest'
import { calcularPrecoSugerido, precoAbaixoMargem } from './precificacao'

describe('precificacao', () => {
  it('calcula preço sugerido com margem 25%', () => {
    expect(calcularPrecoSugerido(10, 25)).toBe(13.33)
  })

  it('detecta venda abaixo do sugerido', () => {
    expect(precoAbaixoMargem(12, 13.33)).toBe(true)
    expect(precoAbaixoMargem(14, 13.33)).toBe(false)
  })
})
