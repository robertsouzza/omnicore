import type { Page } from './produto'

export type { Page }

export interface Cliente {
  id: number
  nomeCompleto: string
  cpf: string
  email: string
  codigoPais: string
  celular: string
  cep: string | null
  logradouro: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cidade: string | null
  estado: string | null
  ativo: boolean
  createdAt: string
  updatedAt: string
}

export interface ClienteRequest {
  nomeCompleto: string
  cpf: string
  email: string
  /** Código ISO do país do celular (ex.: BR, US, PT). */
  codigoPais: string
  celular: string
  cep?: string | null
  logradouro?: string | null
  numero?: string | null
  complemento?: string | null
  bairro?: string | null
  cidade?: string | null
  estado?: string | null
}

export interface CepConsulta {
  cep: string
  logradouro: string
  bairro: string
  cidade: string
  estado: string
}

export type { PaisTelefoneOption } from '../utils/telefone'
export { PAISES_TELEFONE, PAIS_PADRAO } from '../utils/telefone'
