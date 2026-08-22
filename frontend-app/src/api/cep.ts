import { apiFetch } from './client'
import type { CepConsulta } from '../types/cliente'
import { onlyDigits } from '../utils/cpf'

export function consultarCep(token: string, cep: string): Promise<CepConsulta> {
  const digits = onlyDigits(cep)
  return apiFetch<CepConsulta>(`/api/cep/${digits}`, {}, token)
}
