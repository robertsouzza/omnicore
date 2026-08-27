/** Validação de arquivo de imagem de produto (Sessão 11.5). */

export const PRODUTO_IMAGEM_MAX_BYTES = 5 * 1024 * 1024

export const PRODUTO_IMAGEM_TIPOS = ['image/jpeg', 'image/png', 'image/webp'] as const

export type ProdutoImagemTipo = (typeof PRODUTO_IMAGEM_TIPOS)[number]

export function validateProdutoImagemFile(file: File): string | null {
  if (!PRODUTO_IMAGEM_TIPOS.includes(file.type as ProdutoImagemTipo)) {
    return 'Formato não suportado. Use JPG, PNG ou WebP.'
  }
  if (file.size > PRODUTO_IMAGEM_MAX_BYTES) {
    return 'A imagem excede o tamanho máximo de 5 MB.'
  }
  return null
}

export function formatProdutoImagemSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
