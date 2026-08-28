import { listarComposicao } from '../api/composicao'
import { obterSaldo } from '../api/estoque'
import type { Produto } from '../types/produto'

export interface ComponenteEstoqueResumo {
  nome: string
  saldo: number
}

export interface ProdutoComSaldo extends Produto {
  /** Unitários: unidades em estoque. Pacotes: kits montáveis (mínimo entre componentes). */
  saldo: number
  saldoPorComponentes: boolean
  /** Preenchido em PACOTE — saldo de cada componente do kit. */
  componentesEstoque?: ComponenteEstoqueResumo[]
}

interface KitsDisponiveisResult {
  kits: number
  componentes: ComponenteEstoqueResumo[]
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
async function calcularKitsDisponiveis(token: string, pacoteId: number): Promise<KitsDisponiveisResult> {
  try {
    const componentes = await listarComposicao(token, pacoteId)
    if (componentes.length === 0) return { kits: 0, componentes: [] }

    let minKits = Infinity
    const resumo: ComponenteEstoqueResumo[] = []

    for (const componente of componentes) {
      const qtdNecessaria = quantidadeFilhoParaUmKit(componente.quantidade)
      if (qtdNecessaria === null) return { kits: 0, componentes: [] }

      const saldoFilho = await obterSaldoSeguro(token, componente.produtoFilho.id)
      resumo.push({ nome: componente.produtoFilho.nome, saldo: saldoFilho })
      const kitsPossiveis = Math.floor(saldoFilho / qtdNecessaria)
      minKits = Math.min(minKits, kitsPossiveis)
    }

    return {
      kits: minKits === Infinity ? 0 : minKits,
      componentes: resumo,
    }
  } catch {
    return { kits: 0, componentes: [] }
  }
}

async function calcularSaldoDisponivel(token: string, produto: Produto): Promise<ProdutoComSaldo> {
  if (produto.tipoProduto === 'PACOTE') {
    const { kits, componentes } = await calcularKitsDisponiveis(token, produto.id)
    return { ...produto, saldo: kits, saldoPorComponentes: true, componentesEstoque: componentes }
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

/** Rótulo principal na busca de venda. */
export function rotuloSaldoProduto(produto: ProdutoComSaldo): string {
  return produto.saldoPorComponentes
    ? `Até ${produto.saldo} kit${produto.saldo === 1 ? '' : 's'}`
    : `Estoque: ${produto.saldo}`
}

function abreviarNomeComponente(nome: string): string {
  const palavra = nome.trim().split(/\s+/)[0] ?? nome
  if (palavra.length <= 10) return palavra
  return `${palavra.slice(0, 6)}.`
}

/** Detalhe opcional: estoque de cada componente (não é soma — é referência). */
export function detalheComponentesKit(produto: ProdutoComSaldo): string | null {
  if (!produto.saldoPorComponentes || !produto.componentesEstoque?.length) return null
  const partes = produto.componentesEstoque.map(
    (c) => `${abreviarNomeComponente(c.nome)} ${c.saldo}`,
  )
  return `Comp.: ${partes.join(' · ')}`
}
