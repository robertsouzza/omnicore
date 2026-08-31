import { criarVenda, pagarVenda } from '../api/vendas'
import type { PagarVendaRequest } from '../types/pagamento'
import type { Venda, VendaRequest } from '../types/venda'

export type RegistrarVendaComPagamentoResult = {
  venda: Venda
  /** Pix/cartão/débito aguardando confirmação externa — venda permanece PENDENTE. */
  aguardandoExperiencia: boolean
}

/**
 * Cria venda PENDENTE (reserva estoque) e registra pagamento via PUT /pagar.
 * Usado no PDV e Nova Venda "Paga (caixa)".
 */
export async function registrarVendaComPagamento(
  token: string,
  dados: Omit<VendaRequest, 'status'>,
  pagamento: PagarVendaRequest,
): Promise<RegistrarVendaComPagamentoResult> {
  const venda = await criarVenda(token, { ...dados, status: 'PENDENTE' })
  const atualizada = await pagarVenda(token, venda.id, pagamento)

  return {
    venda: atualizada,
    aguardandoExperiencia: atualizada.status === 'PENDENTE',
  }
}
