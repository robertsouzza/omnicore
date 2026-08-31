export type FormaPagamento = 'DINHEIRO' | 'PIX' | 'CREDITO' | 'DEBITO_BANCARIO'

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

export function labelFormaPagamento(forma: FormaPagamento): string {
  return FORMAS_PAGAMENTO.find((f) => f.value === forma)?.label ?? forma
}
