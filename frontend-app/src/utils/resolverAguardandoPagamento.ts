import { listarPagamentosVenda } from '../api/pagamentos'
import {
  aguardandoFromPagamentos,
  type AguardandoPagamentoExterno,
} from './urlExperiencia'

export async function resolverAguardandoPagamentoExterno(
  token: string,
  vendaId: number,
): Promise<AguardandoPagamentoExterno | null> {
  const pagamentos = await listarPagamentosVenda(token, vendaId)
  return aguardandoFromPagamentos(pagamentos)
}
