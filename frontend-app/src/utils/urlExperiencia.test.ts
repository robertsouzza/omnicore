import { describe, expect, it } from 'vitest'
import {
  aguardandoFromPagamentos,
  buildUrlExperiencia,
  ultimoPagamentoExternoPendente,
} from './urlExperiencia'
import type { PagamentoVenda } from '../types/pagamento'

function pagamento(partial: Partial<PagamentoVenda> & Pick<PagamentoVenda, 'id'>): PagamentoVenda {
  return {
    id: partial.id,
    vendaId: partial.vendaId ?? 1,
    forma: partial.forma ?? 'PIX',
    valor: partial.valor ?? 10,
    valorRecebido: partial.valorRecebido ?? null,
    troco: partial.troco ?? null,
    status: partial.status ?? 'PENDENTE',
    provider: partial.provider ?? 'EXPERIENCIA',
    referenciaExterna: partial.referenciaExterna ?? null,
    nsu: partial.nsu ?? null,
    experienciaPagamentoId: partial.experienciaPagamentoId ?? 'exp-1',
    urlExperiencia: partial.urlExperiencia ?? null,
    dataHora: partial.dataHora ?? '2026-08-31T12:00:00',
  }
}

describe('urlExperiencia', () => {
  it('buildUrlExperiencia monta rotas do simulador', () => {
    expect(buildUrlExperiencia('PIX', 'exp-abc')).toBe('http://localhost:9090/pix/exp-abc')
    expect(buildUrlExperiencia('CREDITO', 'exp-x', 3)).toBe(
      'http://localhost:9090/credito/exp-x?parcelas=3',
    )
    expect(buildUrlExperiencia('DEBITO_BANCARIO', 'exp-d')).toBe(
      'http://localhost:9090/debito/exp-d',
    )
  })

  it('ultimoPagamentoExternoPendente pega o mais recente', () => {
    const lista = [
      pagamento({ id: 1, dataHora: '2026-08-31T10:00:00', experienciaPagamentoId: 'a' }),
      pagamento({ id: 2, dataHora: '2026-08-31T11:00:00', experienciaPagamentoId: 'b' }),
    ]
    expect(ultimoPagamentoExternoPendente(lista)?.experienciaPagamentoId).toBe('b')
  })

  it('aguardandoFromPagamentos ignora dinheiro e aprovados', () => {
    expect(
      aguardandoFromPagamentos([
        pagamento({ id: 1, forma: 'DINHEIRO', status: 'APROVADO' }),
      ]),
    ).toBeNull()
    expect(
      aguardandoFromPagamentos([
        pagamento({ id: 2, forma: 'PIX', status: 'PENDENTE', experienciaPagamentoId: 'exp-z' }),
      ]),
    ).toEqual({
      urlExperiencia: 'http://localhost:9090/pix/exp-z',
      forma: 'PIX',
    })
  })
})
