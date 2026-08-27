import { useCallback, useRef, useState } from 'react'
import type { TipoProduto } from '../types/produto'
import {
  barcodeValueForFormat,
  buildProdutoQrPayload,
  resolveBarcodeFormat,
} from '../utils/produtoCodigos'
import styles from './ProdutoCodigosSection.module.css'

interface ProdutoCodigosSectionProps {
  produtoId?: number
  codigoBarras: string
  nome: string
  descricao: string
  precoVenda: string
  categoria: string
  tipoProduto: TipoProduto
  imagemCodigoBarras: string | null
  imagemQrCode: string | null
  onImagemCodigoBarrasChange: (value: string | null) => void
  onImagemQrCodeChange: (value: string | null) => void
  disabled?: boolean
}

export function ProdutoCodigosSection({
  produtoId,
  codigoBarras,
  nome,
  descricao,
  precoVenda,
  categoria,
  tipoProduto,
  imagemCodigoBarras,
  imagemQrCode,
  onImagemCodigoBarrasChange,
  onImagemQrCodeChange,
  disabled = false,
}: ProdutoCodigosSectionProps) {
  const barcodeCanvasRef = useRef<HTMLCanvasElement>(null)
  const [barcodeError, setBarcodeError] = useState<string | null>(null)
  const [qrError, setQrError] = useState<string | null>(null)
  const [generatingBarcode, setGeneratingBarcode] = useState(false)
  const [generatingQr, setGeneratingQr] = useState(false)

  const canGenerateBarcode = codigoBarras.trim().length > 0
  const canGenerateQr = nome.trim().length > 0 && codigoBarras.trim().length > 0

  const handleGenerateBarcode = useCallback(async () => {
    const canvas = barcodeCanvasRef.current
    if (!canvas || !canGenerateBarcode) return

    setBarcodeError(null)
    setGeneratingBarcode(true)
    onImagemCodigoBarrasChange(null)

    const format = resolveBarcodeFormat(codigoBarras)
    const value = barcodeValueForFormat(codigoBarras, format)

    try {
      const { default: JsBarcode } = await import('jsbarcode')
      try {
        JsBarcode(canvas, value, {
          format,
          displayValue: true,
          fontSize: 14,
          textMargin: 4,
          margin: 8,
          width: 2,
          height: 72,
        })
      } catch {
        if (format !== 'CODE128') {
          JsBarcode(canvas, codigoBarras.trim(), {
            format: 'CODE128',
            displayValue: true,
            fontSize: 14,
            textMargin: 4,
            margin: 8,
            width: 2,
            height: 72,
          })
        } else {
          throw new Error('barcode')
        }
      }
      onImagemCodigoBarrasChange(canvas.toDataURL('image/png'))
    } catch {
      setBarcodeError(
        'Não foi possível gerar o código de barras. Verifique se o EAN é válido (13 dígitos) ou use outro formato.',
      )
    } finally {
      setGeneratingBarcode(false)
    }
  }, [canGenerateBarcode, codigoBarras, onImagemCodigoBarrasChange])

  const handleGenerateQr = useCallback(async () => {
    if (!canGenerateQr) return

    setQrError(null)
    setGeneratingQr(true)
    onImagemQrCodeChange(null)

    try {
      const payload = buildProdutoQrPayload({
        produtoId,
        codigoBarras,
        nome,
        descricao,
        precoVenda,
        categoria,
        tipoProduto,
      })
      const QRCode = await import('qrcode')
      const dataUrl = await QRCode.toDataURL(payload, {
        width: 256,
        margin: 2,
        errorCorrectionLevel: 'M',
      })
      onImagemQrCodeChange(dataUrl)
    } catch {
      setQrError('Não foi possível gerar o QR Code.')
    } finally {
      setGeneratingQr(false)
    }
  }, [
    canGenerateQr,
    produtoId,
    codigoBarras,
    nome,
    descricao,
    precoVenda,
    categoria,
    tipoProduto,
    onImagemQrCodeChange,
  ])

  function downloadImage(dataUrl: string, filename: string) {
    const link = document.createElement('a')
    link.download = filename
    link.href = dataUrl
    link.click()
  }

  return (
    <section className={styles.codigosPanel} aria-labelledby="produto-codigos-title">
      <h2 id="produto-codigos-title" className={styles.title}>
        Códigos do produto
      </h2>
      <p className={styles.subtitle}>
        Gere e salve as imagens junto com o produto. Ao reabrir o cadastro, os códigos já
        aparecem — regenere se alterar EAN, nome ou preço.
      </p>

      <div className={styles.grid}>
        <article className={styles.card}>
          <h3 className={styles.cardTitle}>Código de barras</h3>
          <p className={styles.cardHint}>
            Usa o campo <strong>Código de barras</strong> (EAN-13 quando tiver 13 dígitos).
          </p>
          <button
            type="button"
            className={styles.generateBtn}
            disabled={disabled || !canGenerateBarcode || generatingBarcode}
            onClick={() => void handleGenerateBarcode()}
          >
            {generatingBarcode ? 'Gerando…' : 'Gerar código de barras'}
          </button>
          <div className={styles.previewBox}>
            {!imagemCodigoBarras && !barcodeError && (
              <p className={styles.previewEmpty}>A imagem aparecerá aqui</p>
            )}
            {imagemCodigoBarras && (
              <img
                src={imagemCodigoBarras}
                alt="Código de barras do produto"
                className={styles.barcodeImage}
              />
            )}
            <canvas ref={barcodeCanvasRef} className={styles.hiddenCanvas} aria-hidden="true" />
          </div>
          {barcodeError && <p className={styles.error}>{barcodeError}</p>}
          {imagemCodigoBarras && (
            <button
              type="button"
              className={styles.downloadLink}
              onClick={() =>
                downloadImage(imagemCodigoBarras, `barcode-${codigoBarras.trim() || 'produto'}.png`)
              }
            >
              Baixar PNG
            </button>
          )}
        </article>

        <article className={styles.card}>
          <h3 className={styles.cardTitle}>QR Code</h3>
          <p className={styles.cardHint}>
            JSON com id, EAN, nome, preço, categoria e tipo — legível por apps de QR.
          </p>
          <button
            type="button"
            className={styles.generateBtn}
            disabled={disabled || !canGenerateQr || generatingQr}
            onClick={() => void handleGenerateQr()}
          >
            {generatingQr ? 'Gerando…' : 'Gerar QR Code'}
          </button>
          <div className={styles.previewBox}>
            {!imagemQrCode && !qrError && (
              <p className={styles.previewEmpty}>A imagem aparecerá aqui</p>
            )}
            {imagemQrCode && (
              <img
                src={imagemQrCode}
                alt="QR Code com dados do produto"
                className={styles.qrImage}
              />
            )}
          </div>
          {qrError && <p className={styles.error}>{qrError}</p>}
          {imagemQrCode && (
            <button
              type="button"
              className={styles.downloadLink}
              onClick={() =>
                downloadImage(imagemQrCode, `qrcode-${codigoBarras.trim() || 'produto'}.png`)
              }
            >
              Baixar PNG
            </button>
          )}
        </article>
      </div>
    </section>
  )
}
