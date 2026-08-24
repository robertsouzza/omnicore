import { listarComposicao } from '../api/composicao'
import { obterSaldo } from '../api/estoque'
import type { Produto } from '../types/produto'

export interface ProdutoComSaldo extends Produto {
  /** Unitários: unidades em estoque. Pacotes: kits montáveis pelos componentes. */
  saldo: number
  saldoPorComponentes: boolean
}

async function obterSaldoSeguro(token: string, produtoId: number): Promise<number> {
  try {
    return await obterSaldo(token, produtoId)
  } catch {
    return 0
  }
}

/** Espelha VendaService: qtd do filho × 1 kit deve ser inteira. */
function quantidadeFilhoParaUmKit(quantidadePorUnidade: number): number | null {
  const total = quantidadePorUnidade * 1
  if (!Number.isFinite(total) || total <= 0) return null
  const arredondado = Math.round(total)
  if (Math.abs(total - arredondado) > 1e-9) return null
  return arredondado
}

/**
 * Quantos kits de 1 unidade podem ser vendidos com base no estoque dos filhos.
 * Mesma regra do backend (menor limite entre componentes).
 */
async function calcularKitsDisponiveis(token: string, pacoteId: number): Promise<number> {
  try {
    const componentes = await listarComposicao(token, pacoteId)
    if (componentes.length === 0) return 0

    let minKits = Infinity

    for (const componente of componentes) {
      const qtdNecessaria = quantidadeFilhoParaUmKit(componente.quantidade)
      if (qtdNecessaria === null) return 0

      const saldoFilho = await obterSaldoSeguro(token, componente.produtoFilho.id)
      const kitsPossiveis = Math.floor(saldoFilho / qtdNecessaria)
      minKits = Math.min(minKits, kitsPossiveis)
    }

    return minKits === Infinity ? 0 : minKits
  } catch {
    return 0
  }
}

async function calcularSaldoDisponivel(token: string, produto: Produto): Promise<ProdutoComSaldo> {
  if (produto.tipoProduto === 'PACOTE') {
    const saldo = await calcularKitsDisponiveis(token, produto.id)
    return { ...produto, saldo, saldoPorComponentes: true }
  }

  const saldo = await obterSaldoSeguro(token, produto.id)
  return { ...produto, saldo, saldoPorComponentes: false }
}

/** Mantém produtos vendáveis: unitário com saldo > 0; pacote com ≥ 1 kit pelos componentes. */
export async function filtrarProdutosComSaldoPositivo(
  token: string,
  produtos: Produto[],
): Promise<ProdutoComSaldo[]> {
  if (produtos.length === 0) return []

  const resultados = await Promise.all(
    produtos.map((produto) => calcularSaldoDisponivel(token, produto)),
  )

  return resultados.filter((produto) => produto.saldo > 0)
}

export function rotuloSaldoProduto(produto: ProdutoComSaldo): string {
  return produto.saldoPorComponentes
    ? `Kits disp.: ${produto.saldo}`
    : `Estoque: ${produto.saldo}`
}
