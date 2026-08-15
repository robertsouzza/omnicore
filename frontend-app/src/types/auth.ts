export type PerfilColaborador = 'VENDEDOR' | 'CAIXA' | 'CONFERENTE' | 'GERENTE'

export interface LoginRequest {
  email: string
  senha: string
}

export interface LoginResponse {
  token: string
  tipoToken: string
  colaboradorId: number
  nome: string
  email: string
  perfil: PerfilColaborador
}

export interface AuthSession {
  token: string
  colaboradorId: number
  nome: string
  email: string
  perfil: PerfilColaborador
}
