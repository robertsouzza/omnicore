import type { Page } from './produto'
import type { TipoDocumento } from '../utils/documento'

export type { Page, TipoDocumento }

export interface Cliente {
  id: number
  nomeCompleto: string
  tipoDocumento: TipoDocumento
  numeroDocumento: string
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
  tipoDocumento: TipoDocumento
  numeroDocumento: string
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
export { TIPOS_DOCUMENTO, TIPO_DOCUMENTO_PADRAO } from '../utils/documento'
