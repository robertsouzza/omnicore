import type { Page } from './produto'
import type { Produto } from './produto'

export type { Page }

export type StatusVenda =
  | 'PENDENTE'
  | 'PAGA'
  | 'AGUARDANDO_RETIRADA'
  | 'CONCLUIDA'
  | 'CANCELADA'

export interface ItemVenda {
  id: number
  produto: Produto
  quantidade: number
  precoUnitario: number
  desconto: number | null
}

export interface Venda {
  id: number
  dataHora: string
  valorTotal: number
  status: StatusVenda
  vendedorId: number | null
  clienteId: number | null
  nomeClienteOcasional: string | null
  motivoCancelamento: string | null
  canceladoPorColaboradorId: number | null
  autorizadoPorColaboradorId: number | null
  itens: ItemVenda[]
}

export interface CancelarVendaRequest {
  motivo?: string
  autorizadorEmail?: string
  autorizadorSenha?: string
}

export interface ItemVendaRequest {
  produtoId: number
  quantidade: number
  precoUnitario: number
  desconto?: number | null
}

export interface VendaRequest {
  status: StatusVenda
  vendedorId?: number | null
  clienteId?: number | null
  nomeClienteOcasional?: string | null
  itens: ItemVendaRequest[]
}

export const STATUS_VENDA: { value: StatusVenda; label: string }[] = [
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'PAGA', label: 'Paga' },
  { value: 'AGUARDANDO_RETIRADA', label: 'Aguardando retirada' },
  { value: 'CONCLUIDA', label: 'Concluída' },
  { value: 'CANCELADA', label: 'Cancelada' },
]

/** Status usados ao registrar venda no frontend (MVP). */
export const STATUS_NOVA_VENDA: { value: StatusVenda; label: string; hint: string }[] = [
  {
    value: 'PENDENTE',
    label: 'Pendente (salão)',
    hint: 'Padrão: encaminha ao caixa. Você também pode pagar agora (Pix/cartão) no painel abaixo.',
  },
  {
    value: 'PAGA',
    label: 'Paga (caixa)',
    hint: 'Pagamento na hora ou encaminhar ao caixa se a maquininha falhar.',
  },
]

export function labelStatusVenda(status: StatusVenda): string {
  return STATUS_VENDA.find((s) => s.value === status)?.label ?? status
}

export function formatPreco(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatDataHoraVenda(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function calcularSubtotalItem(item: ItemVendaRequest): number {
  const desconto = item.desconto ?? 0
  return (item.precoUnitario - desconto) * item.quantidade
}

export function calcularTotalItens(itens: ItemVendaRequest[]): number {
  return itens.reduce((acc, item) => acc + calcularSubtotalItem(item), 0)
}

export function resumoClienteVenda(venda: Venda): string {
  if (venda.nomeClienteOcasional?.trim()) return venda.nomeClienteOcasional.trim()
  if (venda.clienteId != null) return `Cliente #${venda.clienteId}`
  return 'Consumidor'
}

export function vendaPodeCancelar(venda: Venda): boolean {
  return venda.status !== 'CANCELADA'
}

export function vendaPodePagar(venda: Venda): boolean {
  return venda.status === 'PENDENTE'
}

export function vendaExigeAutorizacaoGerente(status: Venda['status']): boolean {
  return status === 'PAGA' || status === 'CONCLUIDA'
}
