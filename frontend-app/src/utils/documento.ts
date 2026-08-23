export type TipoDocumento = 'CPF' | 'PASSAPORTE' | 'DOCUMENTO_ESTRANGEIRO'

export const TIPOS_DOCUMENTO: { value: TipoDocumento; label: string }[] = [
  { value: 'CPF', label: 'CPF (Brasil)' },
  { value: 'PASSAPORTE', label: 'Passaporte' },
  { value: 'DOCUMENTO_ESTRANGEIRO', label: 'Documento estrangeiro' },
]

export const TIPO_DOCUMENTO_PADRAO: TipoDocumento = 'CPF'

export function isTipoDocumento(value: string): value is TipoDocumento {
  return TIPOS_DOCUMENTO.some((tipo) => tipo.value === value)
}

export function labelTipoDocumento(tipo: TipoDocumento): string {
  return TIPOS_DOCUMENTO.find((item) => item.value === tipo)?.label ?? tipo
}

export function normalizeNumeroDocumento(tipo: TipoDocumento, value: string): string {
  if (tipo === 'CPF') {
    return value.replace(/\D/g, '')
  }
  return value.replace(/\s+/g, '').toUpperCase()
}

export function maskDocumentoInput(tipo: TipoDocumento, value: string): string {
  if (tipo === 'CPF') {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
  }

  return value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 30)
}

export function formatDocumentoDisplay(tipo: TipoDocumento, numero: string): string {
  if (tipo === 'CPF') {
    return maskDocumentoInput('CPF', numero)
  }
  return `${labelTipoDocumento(tipo)} · ${numero.toUpperCase()}`
}

export function documentoEstrangeiro(tipo: TipoDocumento): boolean {
  return tipo !== 'CPF'
}
