export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '')
}

export function formatCpf(value: string): string {
  const digits = onlyDigits(value).slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

export function maskCpfInput(value: string): string {
  return formatCpf(value)
}

export function isCpfValido(value: string): boolean {
  const cpf = onlyDigits(value)
  if (cpf.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cpf)) return false

  const calcularDigito = (base: string, pesoInicial: number): number => {
    let soma = 0
    for (let i = 0; i < base.length; i++) {
      soma += Number(base[i]) * (pesoInicial - i)
    }
    const resto = soma % 11
    return resto < 2 ? 0 : 11 - resto
  }

  const digito1 = calcularDigito(cpf.slice(0, 9), 10)
  if (digito1 !== Number(cpf[9])) return false

  const digito2 = calcularDigito(cpf.slice(0, 10), 11)
  return digito2 === Number(cpf[10])
}
