import { useEffect, useRef, useState } from 'react'
import styles from './BarcodeScannerModal.module.css'

interface BarcodeScannerModalProps {
  open: boolean
  onClose: () => void
  onDetected: (code: string) => void
}

export function BarcodeScannerModal({ open, onClose, onDetected }: BarcodeScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [supported, setSupported] = useState<boolean | null>(null)

  useEffect(() => {
    if (!open) {
      setError(null)
      return
    }

    const video = videoRef.current
    if (!video) return

    let stream: MediaStream | null = null
    let rafId = 0
    let stopped = false

    void (async () => {
      if (!('BarcodeDetector' in window)) {
        setSupported(false)
        setError('Leitura por câmera não disponível neste navegador. Use o leitor USB ou digite o código.')
        return
      }

      setSupported(true)

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        })
        if (stopped) return

        video.srcObject = stream
        await video.play()

        const detector = new BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e'],
        })

        const scan = async () => {
          if (stopped || !video || video.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA) {
            if (!stopped) rafId = requestAnimationFrame(() => void scan())
            return
          }

          try {
            const barcodes = await detector.detect(video)
            if (barcodes.length > 0 && barcodes[0].rawValue) {
              onDetected(barcodes[0].rawValue)
              onClose()
              return
            }
          } catch {
            /* continua escaneando */
          }

          if (!stopped) rafId = requestAnimationFrame(() => void scan())
        }

        rafId = requestAnimationFrame(() => void scan())
      } catch {
        setError('Não foi possível acessar a câmera. Verifique a permissão ou digite o código.')
      }
    })()

    return () => {
      stopped = true
      cancelAnimationFrame(rafId)
      if (stream) {
        for (const track of stream.getTracks()) track.stop()
      }
      video.srcObject = null
    }
  }, [open, onClose, onDetected])

  if (!open) return null

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Leitor de código de barras">
      <div className={styles.panel}>
        <div className={styles.header}>
          <h2 className={styles.title}>Escanear código</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </div>

        <div className={styles.videoWrap}>
          <video ref={videoRef} className={styles.video} playsInline muted />
          {supported && <div className={styles.guide} aria-hidden="true" />}
        </div>

        <div className={styles.footer}>
          <p className={styles.hint}>Aponte para o código de barras do produto.</p>
          {error && <p className={styles.error}>{error}</p>}
        </div>
      </div>
    </div>
  )
}
