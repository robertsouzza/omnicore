import { describe, expect, it } from 'vitest'
import {
  dataFimPeriodoParaApi,
  dataInicioPeriodoParaApi,
  temFiltroPeriodo,
} from './vendaPeriodo'

describe('vendaPeriodo', () => {
  it('monta início e fim do dia para a API', () => {
    expect(dataInicioPeriodoParaApi('2026-09-25')).toBe('2026-09-25T00:00:00')
    expect(dataFimPeriodoParaApi('2026-09-25')).toBe('2026-09-25T23:59:59')
  })

  it('detecta filtro de período preenchido', () => {
    expect(temFiltroPeriodo('', '')).toBe(false)
    expect(temFiltroPeriodo('2026-09-01', '')).toBe(true)
    expect(temFiltroPeriodo('', '2026-09-30')).toBe(true)
  })
})
