import { describe, expect, it } from 'vitest'
import {
  buildPagarVendaRequest,
  calcularTroco,
  validarPagamentoForm,
} from './pagamentoForm'

describe('pagamentoForm', () => {
  it('calcularTroco retorna diferença positiva', () => {
    expect(calcularTroco(50, 42.5)).toBe(7.5)
    expect(calcularTroco(40, 42.5)).toBe(0)
  })

  it('validarPagamentoForm exige valor recebido em dinheiro', () => {
    expect(validarPagamentoForm('DINHEIRO', 10, '', 1)).toMatch(/valor recebido/)
    expect(validarPagamentoForm('DINHEIRO', 10, '5', 1)).toMatch(/insuficiente/)
    expect(validarPagamentoForm('DINHEIRO', 10, '10', 1)).toBeNull()
    expect(validarPagamentoForm('DINHEIRO', 10, '15,50', 1)).toBeNull()
  })

  it('validarPagamentoForm aceita Pix, débito e paga no caixa', () => {
    expect(validarPagamentoForm('PIX', 25, '', 1)).toBeNull()
    expect(validarPagamentoForm('DEBITO_BANCARIO', 25, '', 1)).toBeNull()
    expect(validarPagamentoForm('PAGA_NO_CAIXA', 25, '', 1)).toBeNull()
  })

  it('buildPagarVendaRequest monta payload por forma', () => {
    expect(buildPagarVendaRequest('DINHEIRO', 10, '20', 1)).toEqual({
      forma: 'DINHEIRO',
      valor: 10,
      valorRecebido: 20,
    })
    expect(buildPagarVendaRequest('CREDITO', 99.99, '', 3)).toEqual({
      forma: 'CREDITO',
      valor: 99.99,
      parcelas: 3,
    })
    expect(buildPagarVendaRequest('PIX', 50, '', 1)).toEqual({
      forma: 'PIX',
      valor: 50,
    })
    expect(buildPagarVendaRequest('PAGA_NO_CAIXA', 50, '', 1)).toBeNull()
  })
})
