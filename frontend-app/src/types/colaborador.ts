import type { Page } from './produto'
import type { PerfilColaborador } from './auth'

export type { Page }

export interface Colaborador {
  id: number
  nome: string
  email: string
  perfil: PerfilColaborador
  ativo: boolean
}
