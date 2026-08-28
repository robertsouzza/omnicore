import { describe, expect, it } from 'vitest'
import {
  detalheComponentesKit,
  rotuloSaldoProduto,
  type ProdutoComSaldo,
} from './produtoEstoque'
import type { Produto } from '../types/produto'

const baseProduto: Produto = {
  id: 1,
  codigoBarras: '7891234567890',
  nome: 'Teste',
  descricao: null,
  precoVenda: 10,
  categoria: 'X',
  urlImagem: null,
  tipoProduto: 'UNITARIO',
  indicadorTamanho: 'MEDIO',
  ativo: true,
}

describe('rotuloSaldoProduto', () => {
  it('unitário mostra estoque direto', () => {
    const p: ProdutoComSaldo = { ...baseProduto, saldo: 50, saldoPorComponentes: false }
    expect(rotuloSaldoProduto(p)).toBe('Estoque: 50')
  })

  it('pacote mostra kits montáveis (mínimo), não estoque de um filho', () => {
    const p: ProdutoComSaldo = {
      ...baseProduto,
      tipoProduto: 'PACOTE',
      saldo: 294,
      saldoPorComponentes: true,
      componentesEstoque: [
        { nome: 'Desinfetante Multiuso Lavanda 1L', saldo: 297 },
        { nome: 'Sabão em Pó Concentrado 1kg', saldo: 297 },
        { nome: 'Amaciante Concentrado Floral 500ml', saldo: 294 },
      ],
    }
    expect(rotuloSaldoProduto(p)).toBe('Até 294 kits')
  })
})

describe('detalheComponentesKit', () => {
  it('lista saldo de cada componente', () => {
    const p: ProdutoComSaldo = {
      ...baseProduto,
      tipoProduto: 'PACOTE',
      saldo: 294,
      saldoPorComponentes: true,
      componentesEstoque: [
        { nome: 'Desinfetante Multiuso Lavanda 1L', saldo: 297 },
        { nome: 'Sabão em Pó Concentrado 1kg', saldo: 297 },
        { nome: 'Amaciante Concentrado Floral 500ml', saldo: 294 },
      ],
    }
    expect(detalheComponentesKit(p)).toBe('Comp.: Desinf. 297 · Sabão 297 · Amaciante 294')
  })

  it('retorna null para unitário', () => {
    const p: ProdutoComSaldo = { ...baseProduto, saldo: 10, saldoPorComponentes: false }
    expect(detalheComponentesKit(p)).toBeNull()
  })
})
