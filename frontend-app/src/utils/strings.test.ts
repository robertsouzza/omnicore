import { describe, expect, it } from 'vitest'
import { onlyDigits } from './strings'

describe('onlyDigits', () => {
  it('remove caracteres não numéricos', () => {
    expect(onlyDigits('12.345.678/0001-90')).toBe('12345678000190')
  })

  it('retorna string vazia para entrada sem dígitos', () => {
    expect(onlyDigits('abc')).toBe('')
  })

  it('mantém dígitos já limpos', () => {
    expect(onlyDigits('7891234567890')).toBe('7891234567890')
  })
})
