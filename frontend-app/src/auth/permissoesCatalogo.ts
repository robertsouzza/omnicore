import type { PerfilColaborador } from '../types/auth'
import {
  podeAcessarRota,
  podeAcessarSalao,
  podeEditarCatalogo,
  podeFiltrarVendasPorVendedor,
  podeMovimentarEstoque,
} from './permissoes'

/** Chaves estáveis para exibir na matriz (gerente). */
export type CodigoPermissao =
  | 'salao'
  | 'produtos_consulta'
  | 'produtos_editar'
  | 'clientes'
  | 'estoque_consulta'
  | 'estoque_movimentar'
  | 'vendas'
  | 'pdv'
  | 'caixa'
  | 'colaboradores'
  | 'vendas_filtro_vendedor'

export interface ItemPermissaoCatalogo {
  codigo: CodigoPermissao
  label: string
  hint?: string
}

export const CATALOGO_PERMISSOES: ItemPermissaoCatalogo[] = [
  { codigo: 'salao', label: 'Salão (PWA vendedor)' },
  { codigo: 'produtos_consulta', label: 'Produtos — consulta' },
  { codigo: 'produtos_editar', label: 'Produtos — cadastro / kit' },
  { codigo: 'clientes', label: 'Clientes' },
  { codigo: 'estoque_consulta', label: 'Estoque — consulta' },
  { codigo: 'estoque_movimentar', label: 'Estoque — entrada e saída' },
  { codigo: 'vendas', label: 'Vendas (registrar, listar, pagar)' },
  { codigo: 'pdv', label: 'PDV' },
  { codigo: 'caixa', label: 'Caixa (fila pagamentos)' },
  { codigo: 'colaboradores', label: 'Equipe e colaboradores' },
  {
    codigo: 'vendas_filtro_vendedor',
    label: 'Vendas — filtrar por vendedor',
    hint: 'Somente gerente na listagem de vendas.',
  },
]

export const PERFIS_GERENCIAVEIS: PerfilColaborador[] = ['VENDEDOR', 'CAIXA', 'CONFERENTE']

export const ROTULO_PERFIL: Record<PerfilColaborador, string> = {
  VENDEDOR: 'Vendedor',
  CAIXA: 'Caixa',
  CONFERENTE: 'Conferente',
  GERENTE: 'Gerente',
}

export function matrizPermissoesPerfil(perfil: PerfilColaborador): Record<CodigoPermissao, boolean> {
  return {
    salao: podeAcessarSalao(perfil),
    produtos_consulta: podeAcessarRota(perfil, '/produtos'),
    produtos_editar: podeEditarCatalogo(perfil),
    clientes: podeAcessarRota(perfil, '/clientes'),
    estoque_consulta: podeAcessarRota(perfil, '/estoque'),
    estoque_movimentar: podeMovimentarEstoque(perfil),
    vendas: podeAcessarRota(perfil, '/vendas'),
    pdv: podeAcessarRota(perfil, '/pdv'),
    caixa: podeAcessarRota(perfil, '/caixa'),
    colaboradores: perfil === 'GERENTE',
    vendas_filtro_vendedor: podeFiltrarVendasPorVendedor(perfil),
  }
}
