import type { Page } from './produto'
import type { PerfilColaborador } from './auth'

export type { Page }

export interface Colaborador {
  id: number
  nome: string
  cpf: string
  email: string
  perfil: PerfilColaborador
  limiteDescontoAutonomo: number
  ativo: boolean
}

export interface ColaboradorRequest {
  nome: string
  cpf: string
  email: string
  senha?: string
  perfil: PerfilColaborador
  limiteDescontoAutonomo: number
}
