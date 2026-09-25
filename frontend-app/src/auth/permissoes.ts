import type { PerfilColaborador } from '../types/auth'

/** Rotas principais do Layout admin (não inclui /salao). */
export type RotaApp =
  | '/salao'
  | '/produtos'
  | '/clientes'
  | '/estoque'
  | '/vendas'
  | '/pdv'
  | '/caixa'

const ROTAS_POR_PERFIL: Record<PerfilColaborador, RotaApp[]> = {
  VENDEDOR: ['/salao', '/produtos', '/clientes', '/estoque', '/vendas', '/pdv'],
  CAIXA: ['/caixa', '/pdv', '/clientes', '/produtos', '/estoque'],
  CONFERENTE: ['/produtos', '/estoque'],
  GERENTE: ['/salao', '/produtos', '/clientes', '/estoque', '/vendas', '/pdv', '/caixa'],
}

export function rotasPermitidas(perfil: PerfilColaborador): RotaApp[] {
  return ROTAS_POR_PERFIL[perfil]
}

function rotaExigeEditarCatalogo(path: string): boolean {
  return (
    path === '/produtos/novo' ||
    /^\/produtos\/\d+\/editar/.test(path) ||
    /^\/produtos\/\d+\/kit/.test(path)
  )
}

export function podeAcessarRota(perfil: PerfilColaborador, path: string): boolean {
  if (rotaExigeEditarCatalogo(path) && !podeEditarCatalogo(perfil)) {
    return false
  }
  const rotas = rotasPermitidas(perfil)
  return rotas.some((rota) => path === rota || path.startsWith(`${rota}/`))
}

export function rotaInicialPorPerfil(perfil: PerfilColaborador): string {
  switch (perfil) {
    case 'VENDEDOR':
      return '/salao'
    case 'CAIXA':
      return '/caixa'
    case 'CONFERENTE':
      return '/produtos'
    case 'GERENTE':
      return '/vendas'
    default:
      return '/produtos'
  }
}

export function podeEditarCatalogo(perfil: PerfilColaborador): boolean {
  return perfil === 'CONFERENTE' || perfil === 'GERENTE'
}

export function podeMovimentarEstoque(perfil: PerfilColaborador): boolean {
  return perfil === 'CONFERENTE' || perfil === 'GERENTE'
}

export function podeFiltrarVendasPorVendedor(perfil: PerfilColaborador): boolean {
  return perfil === 'GERENTE'
}

export function podeAcessarSalao(perfil: PerfilColaborador): boolean {
  return perfil === 'VENDEDOR' || perfil === 'GERENTE'
}
