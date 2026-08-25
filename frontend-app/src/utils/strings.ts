/** Remove tudo que não for dígito (CPF, CEP, EAN, telefone, etc.). */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '')
}
