/** Converte `YYYY-MM-DD` (input date) para início/fim do dia em ISO local (API Spring). */
export function dataInicioPeriodoParaApi(dia: string): string {
  return `${dia}T00:00:00`
}

export function dataFimPeriodoParaApi(dia: string): string {
  return `${dia}T23:59:59`
}

export function temFiltroPeriodo(dataInicio: string, dataFim: string): boolean {
  return dataInicio.trim() !== '' || dataFim.trim() !== ''
}
