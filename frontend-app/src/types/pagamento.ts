export type FormaPagamento = 'DINHEIRO' | 'PIX' | 'CREDITO' | 'DEBITO_BANCARIO'

/** Opção só na UI — encaminha venda pendente para o caixa confirmar depois. */
export type OpcaoPagamento = FormaPagamento | 'PAGA_NO_CAIXA'

export function isDeferCaixa(forma: OpcaoPagamento): forma is 'PAGA_NO_CAIXA' {
  return forma === 'PAGA_NO_CAIXA'
}

export function isFormaPagamento(forma: OpcaoPagamento): forma is FormaPagamento {
  return forma !== 'PAGA_NO_CAIXA'
}

export type StatusPagamento = 'PENDENTE' | 'APROVADO' | 'RECUSADO' | 'ESTORNADO'

export interface PagarVendaRequest {
  forma: FormaPagamento
  valor: number
  valorRecebido?: number | null
  parcelas?: number | null
}

export interface PagamentoVenda {
  id: number
  vendaId: number
  forma: FormaPagamento
  valor: number
  valorRecebido: number | null
  troco: number | null
  status: StatusPagamento
  provider: string
  referenciaExterna: string | null
  nsu: string | null
  experienciaPagamentoId: string | null
  urlExperiencia: string | null
  pixCopiaECola: string | null
  qrCodeBase64: string | null
  dataHora: string
}

export const FORMAS_PAGAMENTO: { value: FormaPagamento; label: string; hint: string }[] = [
  {
    value: 'DINHEIRO',
    label: 'Dinheiro',
    hint: 'Informe o valor recebido para calcular o troco.',
  },
  {
    value: 'PIX',
    label: 'Pix',
    hint: 'O sistema de pagamento externo será acionado para o cliente concluir o Pix.',
  },
  {
    value: 'CREDITO',
    label: 'Cartão de crédito',
    hint: 'Pagamento via sistema externo (simulador ou pinpad em produção).',
  },
  {
    value: 'DEBITO_BANCARIO',
    label: 'Débito bancário',
    hint: 'Débito em conta — experiência conduzida pelo sistema externo.',
  },
]

export const OPCAO_PAGA_NO_CAIXA = {
  value: 'PAGA_NO_CAIXA' as const,
  label: 'Paga no caixa',
  hint: 'Encaminha para a fila do /caixa — confirme Pix, cartão ou dinheiro depois.',
}

export function labelFormaPagamento(forma: FormaPagamento): string {
  return FORMAS_PAGAMENTO.find((f) => f.value === forma)?.label ?? forma
}

export function labelOpcaoPagamento(forma: OpcaoPagamento): string {
  if (forma === 'PAGA_NO_CAIXA') return OPCAO_PAGA_NO_CAIXA.label
  return labelFormaPagamento(forma)
}
