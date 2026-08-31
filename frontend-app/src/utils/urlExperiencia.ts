import type { FormaPagamento, PagamentoVenda } from '../types/pagamento'

const DEFAULT_BASE = 'http://localhost:9090'

export function baseUrlExperienciaPagamento(): string {
  const fromEnv = import.meta.env.VITE_PAGAMENTO_EXPERIENCE_BASE_URL
  if (typeof fromEnv === 'string' && fromEnv.trim()) {
    return fromEnv.trim().replace(/\/$/, '')
  }
  return DEFAULT_BASE
}

export function buildUrlExperiencia(
  forma: FormaPagamento,
  experienciaPagamentoId: string,
  parcelas?: number | null,
): string | null {
  const base = baseUrlExperienciaPagamento()
  switch (forma) {
    case 'PIX':
      return `${base}/pix/${experienciaPagamentoId}`
    case 'CREDITO': {
      const n = parcelas != null && parcelas > 0 ? parcelas : 1
      return `${base}/credito/${experienciaPagamentoId}?parcelas=${n}`
    }
    case 'DEBITO_BANCARIO':
      return `${base}/debito/${experienciaPagamentoId}`
    default:
      return null
  }
}

export function ultimoPagamentoExternoPendente(
  pagamentos: PagamentoVenda[],
): PagamentoVenda | null {
  return (
    pagamentos
      .filter(
        (p) =>
          p.status === 'PENDENTE' &&
          p.experienciaPagamentoId &&
          (p.forma === 'PIX' || p.forma === 'CREDITO' || p.forma === 'DEBITO_BANCARIO'),
      )
      .sort((a, b) => b.dataHora.localeCompare(a.dataHora))[0] ?? null
  )
}

export function urlExperienciaFromPagamento(pagamento: PagamentoVenda): string | null {
  if (!pagamento.experienciaPagamentoId) return null
  return buildUrlExperiencia(pagamento.forma, pagamento.experienciaPagamentoId)
}

export type AguardandoPagamentoExterno = {
  urlExperiencia: string
  forma: FormaPagamento
}

export function aguardandoFromPagamentos(
  pagamentos: PagamentoVenda[],
): AguardandoPagamentoExterno | null {
  const pendente = ultimoPagamentoExternoPendente(pagamentos)
  if (!pendente) return null
  const urlExperiencia = urlExperienciaFromPagamento(pendente)
  if (!urlExperiencia) return null
  return { urlExperiencia, forma: pendente.forma }
}
