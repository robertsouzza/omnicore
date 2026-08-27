import { describe, expect, it } from 'vitest'
import { formatCpf, isCpfValido } from './cpf'

describe('formatCpf', () => {
  it('aplica máscara progressiva', () => {
    expect(formatCpf('123')).toBe('123')
    expect(formatCpf('12345678901')).toBe('123.456.789-01')
  })

  it('limita a 11 dígitos', () => {
    expect(formatCpf('123456789012345')).toBe('123.456.789-01')
  })
})

describe('isCpfValido', () => {
  it('aceita CPF válido conhecido', () => {
    expect(isCpfValido('529.982.247-25')).toBe(true)
  })

  it('rejeita CPF com todos dígitos iguais', () => {
    expect(isCpfValido('111.111.111-11')).toBe(false)
  })

  it('rejeita CPF com tamanho incorreto', () => {
    expect(isCpfValido('123')).toBe(false)
  })
})
