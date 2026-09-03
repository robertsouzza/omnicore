import type { FormaPagamento, OpcaoPagamento, PagarVendaRequest } from '../types/pagamento'
import { isDeferCaixa, isFormaPagamento } from '../types/pagamento'

export function calcularTroco(valorRecebido: number, total: number): number {
  return Math.max(0, valorRecebido - total)
}

export function validarPagamentoForm(
  forma: OpcaoPagamento,
  total: number,
  valorRecebidoRaw: string,
  parcelas: number,
): string | null {
  if (isDeferCaixa(forma)) {
    return null
  }

  if (total <= 0) {
    return 'Total inválido para pagamento.'
  }

  if (forma === 'DINHEIRO') {
    const valorRecebido = parseValorMonetario(valorRecebidoRaw)
    if (valorRecebido == null || valorRecebido <= 0) {
      return 'Informe o valor recebido em dinheiro.'
    }
    if (valorRecebido < total) {
      return 'Valor recebido insuficiente.'
    }
    return null
  }

  if (forma === 'CREDITO' && (parcelas < 1 || parcelas > 12)) {
    return 'Parcelas devem ser entre 1 e 12.'
  }

  return null
}

export function buildPagarVendaRequest(
  forma: OpcaoPagamento,
  total: number,
  valorRecebidoRaw: string,
  parcelas: number,
): PagarVendaRequest | null {
  if (isDeferCaixa(forma)) {
    return null
  }

  const formaPagamento = forma as FormaPagamento
  const base: PagarVendaRequest = {
    forma: formaPagamento,
    valor: roundMoney(total),
  }

  if (formaPagamento === 'DINHEIRO') {
    const valorRecebido = parseValorMonetario(valorRecebidoRaw) ?? total
    return { ...base, valorRecebido: roundMoney(valorRecebido) }
  }

  if (formaPagamento === 'CREDITO') {
    return { ...base, parcelas }
  }

  return base
}

export function formaPagamentoFromOpcao(forma: OpcaoPagamento): FormaPagamento | null {
  return isFormaPagamento(forma) ? forma : null
}

function parseValorMonetario(raw: string): number | null {
  const normalized = raw.trim().replace(/\./g, '').replace(',', '.')
  if (!normalized) return null
  const value = Number(normalized)
  return Number.isFinite(value) ? value : null
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}
