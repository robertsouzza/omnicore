import { useEffect, useId, useRef, useState } from 'react'
import { uploadProdutoImagem } from '../api/produtos'
import { validateProdutoImagemFile } from '../utils/produtoImagem'
import styles from './ProdutoImagemSection.module.css'

interface ProdutoImagemSectionProps {
  token: string | undefined
  urlImagem: string
  onUrlImagemChange: (url: string) => void
  fieldError?: string
  disabled?: boolean
  onUnauthorized?: (err: unknown) => boolean
}

export function ProdutoImagemSection({
  token,
  urlImagem,
  onUrlImagemChange,
  fieldError,
  disabled = false,
  onUnauthorized,
}: ProdutoImagemSectionProps) {
  const inputId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [localPreview, setLocalPreview] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview)
    }
  }, [localPreview])

  const displayUrl = localPreview ?? previewUrl ?? (urlImagem.trim() || null)

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !token) return

    const validationError = validateProdutoImagemFile(file)
    if (validationError) {
      setUploadError(validationError)
      return
    }

    if (localPreview) URL.revokeObjectURL(localPreview)
    const objectUrl = URL.createObjectURL(file)
    setLocalPreview(objectUrl)
    setUploadError(null)
    setUploading(true)

    try {
      const { url } = await uploadProdutoImagem(token, file)
      onUrlImagemChange(url)
      setPreviewUrl(url)
      URL.revokeObjectURL(objectUrl)
      setLocalPreview(null)
    } catch (err) {
      if (onUnauthorized?.(err)) return
      setUploadError(err instanceof Error ? err.message : 'Falha ao enviar imagem.')
      URL.revokeObjectURL(objectUrl)
      setLocalPreview(null)
    } finally {
      setUploading(false)
    }
  }

  function handleClear() {
    onUrlImagemChange('')
    setPreviewUrl(null)
    setUploadError(null)
    if (localPreview) {
      URL.revokeObjectURL(localPreview)
      setLocalPreview(null)
    }
  }

  return (
    <div className={`${styles.section} ${styles.fullWidth}`}>
      <span className={styles.label}>Imagem do produto</span>

      <div className={styles.row}>
        {displayUrl ? (
          <img className={styles.preview} src={displayUrl} alt="Pré-visualização do produto" />
        ) : (
          <div className={styles.placeholder} aria-hidden="true">
            Sem imagem
          </div>
        )}

        <div className={styles.actions}>
          <input
            ref={fileInputRef}
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className={styles.fileInput}
            disabled={disabled || uploading || !token}
            onChange={(e) => void handleFileChange(e)}
          />
          <label htmlFor={inputId} className={styles.uploadBtn}>
            {uploading ? 'Enviando…' : 'Escolher arquivo'}
          </label>
          {(urlImagem || displayUrl) && (
            <button
              type="button"
              className={styles.clearBtn}
              disabled={disabled || uploading}
              onClick={handleClear}
            >
              Remover
            </button>
          )}
          <p className={styles.hint}>JPG, PNG ou WebP · máx. 5 MB</p>
        </div>
      </div>

      <label className={styles.urlLabel}>
        Ou informe uma URL
        <input
          type="url"
          className={fieldError ? styles.inputError : styles.urlInput}
          value={urlImagem}
          onChange={(e) => {
            onUrlImagemChange(e.target.value)
            setPreviewUrl(null)
            setUploadError(null)
          }}
          placeholder="https://..."
          disabled={disabled || uploading}
        />
      </label>

      {fieldError && <span className={styles.fieldError}>{fieldError}</span>}
      {uploadError && <span className={styles.fieldError}>{uploadError}</span>}
    </div>
  )
}
