import { calcularSubtotalItem, formatPreco } from '../../types/venda'
import type { CartLine } from '../../utils/carrinhoVenda'
import { toItemRequest } from '../../utils/carrinhoVenda'
import styles from './PdvCupomPreview.module.css'

interface PdvCupomPreviewProps {
  cart: CartLine[]
  total: number
  operadorNome: string
  clienteResumo: string | null
  vendaNumero: number | null
}

function formatDataHora(date: Date): string {
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function truncarNome(nome: string, max = 28): string {
  if (nome.length <= max) return nome
  return `${nome.slice(0, max - 1)}…`
}

export function PdvCupomPreview({
  cart,
  total,
  operadorNome,
  clienteResumo,
  vendaNumero,
}: PdvCupomPreviewProps) {
  const agora = formatDataHora(new Date())

  return (
    <aside className={styles.panel} aria-label="Pré-visualização do cupom">
      <h2 className={styles.title}>Cupom (prévia)</h2>
      <div className={styles.receipt}>
        <p className={styles.storeName}>OMNICORE</p>
        <p className={styles.storeMeta}>Documento auxiliar de venda</p>
        <p className={styles.dashed} aria-hidden>
          --------------------------------
        </p>
        <p className={styles.line}>{agora}</p>
        <p className={styles.line}>Operador: {truncarNome(operadorNome, 24)}</p>
        {clienteResumo && <p className={styles.line}>Cliente: {truncarNome(clienteResumo, 24)}</p>}
        {vendaNumero && <p className={styles.line}>Venda #{vendaNumero}</p>}
        <p className={styles.dashed} aria-hidden>
          --------------------------------
        </p>

        {cart.length === 0 ? (
          <p className={styles.empty}>Aguardando itens…</p>
        ) : (
          <ul className={styles.items}>
            {cart.map((line) => {
              const subtotal = calcularSubtotalItem(toItemRequest(line))
              return (
                <li key={line.key} className={styles.item}>
                  <p className={styles.itemName}>{truncarNome(line.produtoNome, 32)}</p>
                  <p className={styles.itemDetail}>
                    {line.quantidade} x {formatPreco(line.precoUnitario)}
                    <span className={styles.itemSubtotal}>{formatPreco(subtotal)}</span>
                  </p>
                </li>
              )
            })}
          </ul>
        )}

        <p className={styles.dashed} aria-hidden>
          --------------------------------
        </p>
        <p className={styles.totalLine}>
          TOTAL<span>{formatPreco(total)}</span>
        </p>
        <p className={styles.dashed} aria-hidden>
          --------------------------------
        </p>
        <p className={styles.footer}>Obrigado pela preferência!</p>
        <p className={styles.footerMuted}>NFC-e / SAT — fase 14+</p>
      </div>
    </aside>
  )
}
