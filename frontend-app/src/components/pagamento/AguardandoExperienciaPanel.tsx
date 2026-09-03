import { useState } from 'react'
import type { FormaPagamento } from '../../types/pagamento'
import { labelFormaPagamento } from '../../types/pagamento'
import styles from './AguardandoExperienciaPanel.module.css'

interface AguardandoExperienciaPanelProps {
  forma: FormaPagamento
  urlExperiencia: string
  pixCopiaECola?: string | null
  qrCodeBase64?: string | null
  atualizando?: boolean
  onAtualizarStatus: () => void
  compact?: boolean
}

export function AguardandoExperienciaPanel({
  forma,
  urlExperiencia,
  pixCopiaECola,
  qrCodeBase64,
  atualizando,
  onAtualizarStatus,
  compact,
}: AguardandoExperienciaPanelProps) {
  const rotuloForma = labelFormaPagamento(forma)
  const [copiado, setCopiado] = useState(false)
  const exibirQrPix = forma === 'PIX' && (qrCodeBase64 || pixCopiaECola)

  async function copiarPix() {
    if (!pixCopiaECola) return
    try {
      await navigator.clipboard.writeText(pixCopiaECola)
      setCopiado(true)
      window.setTimeout(() => setCopiado(false), 2000)
    } catch {
      setCopiado(false)
    }
  }

  return (
    <div className={`${styles.panel}${compact ? ` ${styles.compact}` : ''}`} role="status">
      <p className={styles.title}>Aguardando {rotuloForma}</p>
      <p className={styles.text}>
        {exibirQrPix
          ? 'Escaneie o QR Code ou copie o Pix abaixo. A página atualiza sozinha a cada poucos segundos.'
          : 'O pagamento foi iniciado no sistema externo. Abra a tela do cliente para aprovar ou recusar — esta página atualiza sozinha a cada poucos segundos.'}
      </p>

      {exibirQrPix && (
        <div className={styles.pixBlock}>
          {qrCodeBase64 && (
            <img
              className={styles.qrImage}
              src={`data:image/png;base64,${qrCodeBase64}`}
              alt="QR Code Pix"
              width={200}
              height={200}
            />
          )}
          {pixCopiaECola && (
            <div className={styles.copiaBlock}>
              <p className={styles.copiaLabel}>Pix copia e cola</p>
              <code className={styles.copiaCode}>{pixCopiaECola}</code>
              <button type="button" className={styles.copyBtn} onClick={() => void copiarPix()}>
                {copiado ? 'Copiado!' : 'Copiar código Pix'}
              </button>
            </div>
          )}
        </div>
      )}

      <div className={styles.actions}>
        {urlExperiencia && (
          <a
            className={styles.linkBtn}
            href={urlExperiencia}
            target="_blank"
            rel="noopener noreferrer"
          >
            Abrir tela de {rotuloForma}
          </a>
        )}
        <button
          type="button"
          className={styles.refreshBtn}
          disabled={atualizando}
          onClick={onAtualizarStatus}
        >
          {atualizando ? 'Atualizando…' : 'Atualizar status'}
        </button>
      </div>
    </div>
  )
}
