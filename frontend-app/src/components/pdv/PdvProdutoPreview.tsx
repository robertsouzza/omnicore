import { formatPreco } from '../../types/venda'
import { inicialProduto, resolveImagemUrl } from '../../utils/produtoImagem'
import styles from './PdvProdutoPreview.module.css'

export interface PdvProdutoPreviewData {
  nome: string
  urlImagem: string | null
  codigoBarras: string
  precoVenda: number
  saldo: number
}

interface PdvProdutoPreviewProps {
  produto: PdvProdutoPreviewData | null
}

export function PdvProdutoPreview({ produto }: PdvProdutoPreviewProps) {
  const src = produto ? resolveImagemUrl(produto.urlImagem) : null

  return (
    <aside className={styles.panel} aria-label="Pré-visualização do produto">
      <h2 className={styles.title}>Produto</h2>
      {!produto ? (
        <div className={styles.placeholder}>
          <span className={styles.placeholderIcon} aria-hidden>
            ⧉
          </span>
          <p className={styles.placeholderText}>Escaneie um código para ver a imagem</p>
        </div>
      ) : (
        <div className={styles.content}>
          <div className={styles.imageFrame}>
            {src ? (
              <img
                src={src}
                alt={produto.nome}
                className={styles.image}
                loading="lazy"
              />
            ) : (
              <span className={styles.imageFallback} aria-hidden>
                {inicialProduto(produto.nome)}
              </span>
            )}
          </div>
          <p className={styles.nome}>{produto.nome}</p>
          <p className={styles.meta}>{formatPreco(produto.precoVenda)}</p>
          <p className={styles.meta}>EAN {produto.codigoBarras}</p>
          <p className={styles.stock}>Estoque disp.: {produto.saldo}</p>
        </div>
      )}
    </aside>
  )
}
