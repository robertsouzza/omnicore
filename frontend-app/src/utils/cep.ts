import { onlyDigits } from './cpf'

export function maskCepInput(value: string): string {
  const digits = onlyDigits(value).slice(0, 8)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

export function formatCep(value: string): string {
  return maskCepInput(value)
}

export function cepToDigits(value: string): string | null {
  const digits = onlyDigits(value)
  return digits.length > 0 ? digits : null
}

export function formatEnderecoResumo(cliente: {
  logradouro: string | null
  numero: string | null
  bairro: string | null
  cidade: string | null
  estado: string | null
}): string | null {
  const partes = [
    cliente.logradouro,
    cliente.numero ? `nº ${cliente.numero}` : null,
    cliente.bairro,
    cliente.cidade && cliente.estado ? `${cliente.cidade}/${cliente.estado}` : cliente.cidade,
  ].filter(Boolean)

  return partes.length > 0 ? partes.join(' · ') : null
}
