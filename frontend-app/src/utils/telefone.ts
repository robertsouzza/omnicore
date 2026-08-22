import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
} from 'libphonenumber-js'
import type { CountryCode } from 'libphonenumber-js'

import { onlyDigits } from './cpf'

export const PAIS_PADRAO: CountryCode = 'BR'

export interface PaisTelefoneOption {
  iso: CountryCode
  dialCode: string
  label: string
}

const displayNames = new Intl.DisplayNames(['pt-BR'], { type: 'region' })

function buildCountryOptions(): PaisTelefoneOption[] {
  const options = getCountries().map((iso) => ({
    iso,
    dialCode: getCountryCallingCode(iso),
    label: `${displayNames.of(iso) ?? iso} (+${getCountryCallingCode(iso)})`,
  }))

  options.sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))

  const brIndex = options.findIndex((option) => option.iso === PAIS_PADRAO)
  if (brIndex > 0) {
    const [brasil] = options.splice(brIndex, 1)
    options.unshift(brasil)
  }

  return options
}

export const PAISES_TELEFONE: PaisTelefoneOption[] = buildCountryOptions()

export function normalizePaisIso(value: string | null | undefined): CountryCode {
  if (!value) return PAIS_PADRAO
  if (value === '55') return PAIS_PADRAO

  const upper = value.toUpperCase()
  if (getCountries().includes(upper as CountryCode)) {
    return upper as CountryCode
  }

  return PAIS_PADRAO
}

export function maskCelularInput(iso: CountryCode, value: string): string {
  const formatter = new AsYouType(iso)
  return formatter.input(onlyDigits(value))
}

export function formatCelularForInput(iso: CountryCode, nationalDigits: string): string {
  return maskCelularInput(iso, nationalDigits)
}

export function formatCelularDisplay(iso: CountryCode, nationalDigits: string): string {
  const formatted = formatCelularForInput(iso, nationalDigits)
  if (!formatted) return `+${getCountryCallingCode(iso)}`
  return `+${getCountryCallingCode(iso)} ${formatted}`
}

export function celularToNationalDigits(iso: CountryCode, maskedValue: string): string {
  const parsed = parsePhoneNumberFromString(maskedValue, iso)
  if (parsed) {
    return parsed.nationalNumber
  }
  return onlyDigits(maskedValue)
}

export function isCelularValido(iso: CountryCode, maskedValue: string): boolean {
  const parsed = parsePhoneNumberFromString(maskedValue, iso)
  return parsed?.isValid() ?? false
}
