import { describe, expect, it } from 'vitest'
import {
  PRODUTO_IMAGEM_MAX_BYTES,
  formatProdutoImagemSize,
  validateProdutoImagemFile,
} from './produtoImagem'

describe('validateProdutoImagemFile', () => {
  it('aceita PNG válido', () => {
    const file = new File([new Uint8Array(100)], 'foto.png', { type: 'image/png' })
    expect(validateProdutoImagemFile(file)).toBeNull()
  })

  it('rejeita tipo não suportado', () => {
    const file = new File([new Uint8Array(100)], 'doc.pdf', { type: 'application/pdf' })
    expect(validateProdutoImagemFile(file)).toMatch(/Formato não suportado/)
  })

  it('rejeita arquivo acima de 5 MB', () => {
    const file = new File([new Uint8Array(PRODUTO_IMAGEM_MAX_BYTES + 1)], 'grande.jpg', {
      type: 'image/jpeg',
    })
    expect(validateProdutoImagemFile(file)).toMatch(/5 MB/)
  })
})

describe('formatProdutoImagemSize', () => {
  it('formata bytes e kilobytes', () => {
    expect(formatProdutoImagemSize(512)).toBe('512 B')
    expect(formatProdutoImagemSize(2048)).toBe('2.0 KB')
    expect(formatProdutoImagemSize(2 * 1024 * 1024)).toBe('2.0 MB')
  })
})
