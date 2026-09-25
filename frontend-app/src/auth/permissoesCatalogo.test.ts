import { describe, expect, it } from 'vitest'
import { matrizPermissoesPerfil } from './permissoesCatalogo'

describe('permissoesCatalogo', () => {
  it('vendedor tem salão e não tem caixa', () => {
    const m = matrizPermissoesPerfil('VENDEDOR')
    expect(m.salao).toBe(true)
    expect(m.caixa).toBe(false)
    expect(m.colaboradores).toBe(false)
  })

  it('conferente edita produtos e não acessa clientes', () => {
    const m = matrizPermissoesPerfil('CONFERENTE')
    expect(m.produtos_editar).toBe(true)
    expect(m.clientes).toBe(false)
    expect(m.vendas).toBe(false)
  })

  it('gerente gerencia equipe', () => {
    const m = matrizPermissoesPerfil('GERENTE')
    expect(m.colaboradores).toBe(true)
    expect(m.vendas_filtro_vendedor).toBe(true)
  })
})
