import { useQueryClient } from '@tanstack/react-query'
import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { atualizarProduto, buscarProduto, buscarProdutoCodigos, criarProduto } from '../api/produtos'
import { queryKeys } from '../lib/queryKeys'
import { ComposicaoPacoteSection } from '../components/ComposicaoPacoteSection'
import { ProdutoCodigosSection } from '../components/ProdutoCodigosSection'
import { ProdutoImagemSection } from '../components/ProdutoImagemSection'
import { useAuth } from '../auth/AuthContext'
import { useUnauthorizedHandler } from '../hooks'
import {
  INDICADORES_TAMANHO,
  TIPOS_PRODUTO,
  type IndicadorTamanho,
  type ProdutoRequest,
  type TipoProduto,
} from '../types/produto'
import { getErrorMessage, getFieldErrors } from '../utils/validation'
import { calcularPrecoSugerido, precoAbaixoMargem } from '../utils/precificacao'
import { onlyDigits } from '../utils/strings'
import styles from './ProdutoFormPage.module.css'

/** Espelha `application.yml` — margem efetiva vem da API ao editar. */
const MARGEM_PADRAO_PERCENT = 30
const MARGEM_POR_CATEGORIA: Record<string, number> = {
  Bebidas: 25,
  Mercearia: 28,
  Limpeza: 35,
}

interface FormState {
  codigoBarras: string
  nome: string
  descricao: string
  precoVenda: string
  precoCusto: string
  margemMinimaPercent: string
  categoria: string
  urlImagem: string
  imagemCodigoBarras: string
  imagemQrCode: string
  tipoProduto: TipoProduto
  indicadorTamanho: IndicadorTamanho
}

const INITIAL_FORM: FormState = {
  codigoBarras: '',
  nome: '',
  descricao: '',
  precoVenda: '',
  precoCusto: '',
  margemMinimaPercent: '',
  categoria: '',
  urlImagem: '',
  imagemCodigoBarras: '',
  imagemQrCode: '',
  tipoProduto: 'UNITARIO',
  indicadorTamanho: 'MEDIO',
}

function parsePrecoVenda(value: string): number | null {
  const normalized = value.trim().replace(',', '.')
  if (!normalized) return null
  const n = Number(normalized)
  return Number.isFinite(n) ? n : null
}

function parseMargemPercent(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const n = Number.parseInt(trimmed, 10)
  if (!Number.isFinite(n) || n < 0 || n > 99) return null
  return n
}

function margemEfetivaPreview(categoria: string, margemProduto: string): number {
  const custom = parseMargemPercent(margemProduto)
  if (custom != null) return custom
  const cat = categoria.trim()
  if (cat && MARGEM_POR_CATEGORIA[cat] != null) return MARGEM_POR_CATEGORIA[cat]
  return MARGEM_PADRAO_PERCENT
}

function toRequest(form: FormState): ProdutoRequest | null {
  const precoVenda = parsePrecoVenda(form.precoVenda)
  if (precoVenda == null) return null

  const precoCustoRaw = parsePrecoVenda(form.precoCusto)
  const margemRaw = parseMargemPercent(form.margemMinimaPercent)

  return {
    codigoBarras: onlyDigits(form.codigoBarras),
    nome: form.nome.trim(),
    descricao: form.descricao.trim() || null,
    precoVenda,
    precoCusto: precoCustoRaw,
    margemMinimaPercent: margemRaw,
    categoria: form.categoria.trim(),
    urlImagem: form.urlImagem.trim() || null,
    imagemCodigoBarras: form.imagemCodigoBarras.trim() || null,
    imagemQrCode: form.imagemQrCode.trim() || null,
    tipoProduto: form.tipoProduto,
    indicadorTamanho: form.indicadorTamanho,
  }
}

function fromProduto(
  produto: {
    codigoBarras: string
    nome: string
    descricao: string | null
    precoVenda: number
    precoCusto?: number | null
    margemMinimaPercent?: number | null
    categoria: string
    urlImagem: string | null
    tipoProduto: TipoProduto
    indicadorTamanho: IndicadorTamanho
  },
  codigos?: { imagemCodigoBarras: string | null; imagemQrCode: string | null },
): FormState {
  return {
    codigoBarras: produto.codigoBarras,
    nome: produto.nome,
    descricao: produto.descricao ?? '',
    precoVenda: String(produto.precoVenda),
    precoCusto: produto.precoCusto != null ? String(produto.precoCusto) : '',
    margemMinimaPercent:
      produto.margemMinimaPercent != null ? String(produto.margemMinimaPercent) : '',
    categoria: produto.categoria,
    urlImagem: produto.urlImagem ?? '',
    imagemCodigoBarras: codigos?.imagemCodigoBarras ?? '',
    imagemQrCode: codigos?.imagemQrCode ?? '',
    tipoProduto: produto.tipoProduto,
    indicadorTamanho: produto.indicadorTamanho,
  }
}

export function ProdutoFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const isEditing = Boolean(id)
  const handleUnauthorized = useUnauthorizedHandler()

  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(isEditing)
  const [submitting, setSubmitting] = useState(false)

  const margemPreview = useMemo(
    () => margemEfetivaPreview(form.categoria, form.margemMinimaPercent),
    [form.categoria, form.margemMinimaPercent],
  )

  const precoSugeridoPreview = useMemo(() => {
    const custo = parsePrecoVenda(form.precoCusto)
    if (custo == null) return null
    return calcularPrecoSugerido(custo, margemPreview)
  }, [form.precoCusto, margemPreview])

  const alertaMargemPreview = useMemo(() => {
    const venda = parsePrecoVenda(form.precoVenda)
    if (venda == null) return false
    return precoAbaixoMargem(venda, precoSugeridoPreview)
  }, [form.precoVenda, precoSugeridoPreview])

  useEffect(() => {
    if (!isEditing || !session || !id) return

    setLoading(true)
    setError(null)

    Promise.all([
      buscarProduto(session.token, Number(id)),
      buscarProdutoCodigos(session.token, Number(id)),
    ])
      .then(([produto, codigos]) => setForm(fromProduto(produto, codigos)))
      .catch((err) => {
        if (handleUnauthorized(err)) return
        setError(getErrorMessage(err, 'Produto não encontrado.'))
      })
      .finally(() => setLoading(false))
  }, [id, isEditing, session, handleUnauthorized])

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => {
      const next = { ...current, [key]: value }
      if (key === 'codigoBarras' && value !== current.codigoBarras) {
        next.imagemCodigoBarras = ''
        next.imagemQrCode = ''
      }
      return next
    })
    setFieldErrors((current) => {
      if (!(key in current)) return current
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!session) return

    setError(null)
    setFieldErrors({})
    setSubmitting(true)

    if (form.margemMinimaPercent.trim() && parseMargemPercent(form.margemMinimaPercent) == null) {
      setFieldErrors({ margemMinimaPercent: 'Informe uma margem entre 0 e 99.' })
      setSubmitting(false)
      return
    }

    const payload = toRequest(form)
    if (!payload) {
      setFieldErrors({ precoVenda: 'Informe um preço de venda válido.' })
      setSubmitting(false)
      return
    }

    try {
      if (isEditing && id) {
        await atualizarProduto(session.token, Number(id), payload)
        await queryClient.invalidateQueries({ queryKey: queryKeys.produtos.all })
        navigate('/produtos')
      } else {
        const criado = await criarProduto(session.token, payload)
        await queryClient.invalidateQueries({ queryKey: queryKeys.produtos.all })
        if (payload.tipoProduto === 'PACOTE') {
          const montarAgora = window.confirm(
            'Você escolheu um produto tipo Pacote.\n\nDeseja montar a composição do kit agora?',
          )
          if (montarAgora) {
            navigate(`/produtos/${criado.id}/kit`)
          } else {
            navigate('/produtos')
          }
        } else {
          navigate('/produtos')
        }
      }
    } catch (err) {
      if (handleUnauthorized(err)) return
      setFieldErrors(getFieldErrors(err))
      setError(getErrorMessage(err, 'Não foi possível salvar o produto.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <p className={styles.status}>Carregando produto…</p>
  }

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{isEditing ? 'Editar produto' : 'Novo produto'}</h1>
          <p className={styles.subtitle}>
            {isEditing
              ? 'Atualize os dados cadastrais do item.'
              : 'Preencha os campos para cadastrar no catálogo.'}
          </p>
        </div>
        <Link to="/produtos" className={styles.backLink}>
          ← Voltar
        </Link>
      </div>

      <form className={styles.form} id="produto-form" onSubmit={handleSubmit}>
        <div className={styles.grid}>
          <label className={styles.label}>
            Código de barras (EAN) *
            <input
              className={fieldErrors.codigoBarras ? styles.inputError : styles.input}
              value={form.codigoBarras}
              onChange={(e) => updateField('codigoBarras', onlyDigits(e.target.value))}
              maxLength={50}
              inputMode="numeric"
              autoComplete="off"
              placeholder="Somente dígitos (ex.: 7891234567890)"
              required
              disabled={submitting}
            />
            {fieldErrors.codigoBarras && (
              <span className={styles.fieldError}>{fieldErrors.codigoBarras}</span>
            )}
          </label>

          <label className={styles.label}>
            Nome *
            <input
              className={fieldErrors.nome ? styles.inputError : styles.input}
              value={form.nome}
              onChange={(e) => updateField('nome', e.target.value)}
              maxLength={150}
              required
              disabled={submitting}
            />
            {fieldErrors.nome && <span className={styles.fieldError}>{fieldErrors.nome}</span>}
          </label>

          <label className={`${styles.label} ${styles.fullWidth}`}>
            Descrição
            <textarea
              className={styles.textarea}
              value={form.descricao}
              onChange={(e) => updateField('descricao', e.target.value)}
              rows={3}
              disabled={submitting}
            />
          </label>

          <label className={styles.label}>
            Preço de venda (R$) *
            <input
              type="number"
              step="0.01"
              min="0"
              className={fieldErrors.precoVenda ? styles.inputError : styles.input}
              value={form.precoVenda}
              onChange={(e) => updateField('precoVenda', e.target.value)}
              required
              disabled={submitting}
            />
            {fieldErrors.precoVenda && (
              <span className={styles.fieldError}>{fieldErrors.precoVenda}</span>
            )}
          </label>

          <div className={styles.precificacaoPanel}>
            <h2 className={styles.precificacaoTitle}>Formação de preço (custo + margem)</h2>
            <p className={styles.margemHint}>
              Custo manual por enquanto (compras/NF-e depois). Margem vazia usa a categoria (
              {MARGEM_PADRAO_PERCENT}% padrão; Bebidas 25%, Mercearia 28%, Limpeza 35%).
            </p>
            <div className={styles.precificacaoGrid}>
              <label className={styles.label}>
                Preço de custo (R$)
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className={fieldErrors.precoCusto ? styles.inputError : styles.input}
                  value={form.precoCusto}
                  onChange={(e) => updateField('precoCusto', e.target.value)}
                  disabled={submitting}
                  placeholder="Opcional"
                />
              </label>
              <label className={styles.label}>
                Margem mínima (%)
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="99"
                  className={fieldErrors.margemMinimaPercent ? styles.inputError : styles.input}
                  value={form.margemMinimaPercent}
                  onChange={(e) => updateField('margemMinimaPercent', e.target.value)}
                  disabled={submitting}
                  placeholder={`Padrão ${margemPreview}%`}
                />
                {fieldErrors.margemMinimaPercent && (
                  <span className={styles.fieldError}>{fieldErrors.margemMinimaPercent}</span>
                )}
              </label>
              <label className={styles.label}>
                Preço sugerido (R$)
                <input
                  className={styles.input}
                  value={
                    precoSugeridoPreview != null
                      ? precoSugeridoPreview.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : '—'
                  }
                  readOnly
                  disabled
                  aria-readonly
                />
              </label>
            </div>
            {alertaMargemPreview && precoSugeridoPreview != null && (
              <p className={styles.alertaMargem} role="status">
                O preço de venda está abaixo do sugerido ({precoSugeridoPreview.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
                ). Você pode salvar mesmo assim — o gerente/conferente decide.
              </p>
            )}
          </div>

          <label className={styles.label}>
            Categoria *
            <input
              className={fieldErrors.categoria ? styles.inputError : styles.input}
              value={form.categoria}
              onChange={(e) => updateField('categoria', e.target.value)}
              maxLength={50}
              required
              disabled={submitting}
            />
            {fieldErrors.categoria && (
              <span className={styles.fieldError}>{fieldErrors.categoria}</span>
            )}
          </label>

          <label className={styles.label}>
            Tipo *
            <select
              className={fieldErrors.tipoProduto ? styles.inputError : styles.input}
              value={form.tipoProduto}
              onChange={(e) => updateField('tipoProduto', e.target.value as TipoProduto)}
              disabled={submitting}
            >
              {TIPOS_PRODUTO.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {fieldErrors.tipoProduto && (
              <span className={styles.fieldError}>{fieldErrors.tipoProduto}</span>
            )}
            {!isEditing && form.tipoProduto === 'PACOTE' && (
              <span className={styles.hint}>
                Após cadastrar, perguntaremos se deseja montar a composição do kit.
              </span>
            )}
          </label>

          <label className={styles.label}>
            Tamanho *
            <select
              className={fieldErrors.indicadorTamanho ? styles.inputError : styles.input}
              value={form.indicadorTamanho}
              onChange={(e) =>
                updateField('indicadorTamanho', e.target.value as IndicadorTamanho)
              }
              disabled={submitting}
            >
              {INDICADORES_TAMANHO.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {fieldErrors.indicadorTamanho && (
              <span className={styles.fieldError}>{fieldErrors.indicadorTamanho}</span>
            )}
          </label>

          <ProdutoImagemSection
            token={session?.token}
            urlImagem={form.urlImagem}
            onUrlImagemChange={(value) => updateField('urlImagem', value)}
            fieldError={fieldErrors.urlImagem}
            disabled={submitting}
            onUnauthorized={handleUnauthorized}
          />
        </div>

        {error && <p className={styles.error}>{error}</p>}
      </form>

      <ProdutoCodigosSection
        produtoId={isEditing && id ? Number(id) : undefined}
        codigoBarras={form.codigoBarras}
        nome={form.nome}
        descricao={form.descricao}
        precoVenda={form.precoVenda}
        categoria={form.categoria}
        tipoProduto={form.tipoProduto}
        imagemCodigoBarras={form.imagemCodigoBarras || null}
        imagemQrCode={form.imagemQrCode || null}
        onImagemCodigoBarrasChange={(value) => updateField('imagemCodigoBarras', value ?? '')}
        onImagemQrCodeChange={(value) => updateField('imagemQrCode', value ?? '')}
        disabled={submitting}
      />

      {isEditing && id && form.tipoProduto === 'PACOTE' && session && (
        <ComposicaoPacoteSection
          pacoteId={Number(id)}
          token={session.token}
          onUnauthorized={handleUnauthorized}
        />
      )}

      <div className={styles.footerActions}>
        <Link to="/produtos" className={styles.cancelBtn}>
          Cancelar
        </Link>
        <button
          type="submit"
          form="produto-form"
          className={styles.submitBtn}
          disabled={submitting}
        >
          {submitting ? 'Salvando…' : isEditing ? 'Salvar alterações' : 'Cadastrar produto'}
        </button>
      </div>
    </section>
  )
}
