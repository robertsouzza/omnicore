import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '../api/client'
import { atualizarProduto, buscarProduto, criarProduto } from '../api/produtos'
import { ComposicaoPacoteSection } from '../components/ComposicaoPacoteSection'
import { useAuth } from '../auth/AuthContext'
import {
  INDICADORES_TAMANHO,
  TIPOS_PRODUTO,
  type IndicadorTamanho,
  type ProdutoRequest,
  type TipoProduto,
} from '../types/produto'
import { getErrorMessage, getFieldErrors } from '../utils/validation'
import styles from './ProdutoFormPage.module.css'

interface FormState {
  codigoBarras: string
  nome: string
  descricao: string
  precoVenda: string
  categoria: string
  urlImagem: string
  tipoProduto: TipoProduto
  indicadorTamanho: IndicadorTamanho
}

const INITIAL_FORM: FormState = {
  codigoBarras: '',
  nome: '',
  descricao: '',
  precoVenda: '',
  categoria: '',
  urlImagem: '',
  tipoProduto: 'UNITARIO',
  indicadorTamanho: 'MEDIO',
}

function toRequest(form: FormState): ProdutoRequest {
  return {
    codigoBarras: form.codigoBarras.trim(),
    nome: form.nome.trim(),
    descricao: form.descricao.trim() || null,
    precoVenda: Number(form.precoVenda),
    categoria: form.categoria.trim(),
    urlImagem: form.urlImagem.trim() || null,
    tipoProduto: form.tipoProduto,
    indicadorTamanho: form.indicadorTamanho,
  }
}

function fromProduto(produto: {
  codigoBarras: string
  nome: string
  descricao: string | null
  precoVenda: number
  categoria: string
  urlImagem: string | null
  tipoProduto: TipoProduto
  indicadorTamanho: IndicadorTamanho
}): FormState {
  return {
    codigoBarras: produto.codigoBarras,
    nome: produto.nome,
    descricao: produto.descricao ?? '',
    precoVenda: String(produto.precoVenda),
    categoria: produto.categoria,
    urlImagem: produto.urlImagem ?? '',
    tipoProduto: produto.tipoProduto,
    indicadorTamanho: produto.indicadorTamanho,
  }
}

export function ProdutoFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session, logout } = useAuth()
  const isEditing = Boolean(id)

  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(isEditing)
  const [submitting, setSubmitting] = useState(false)

  const handleUnauthorized = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && err.status === 401) {
        logout()
        return true
      }
      return false
    },
    [logout],
  )

  useEffect(() => {
    if (!isEditing || !session || !id) return

    setLoading(true)
    setError(null)

    buscarProduto(session.token, Number(id))
      .then((produto) => setForm(fromProduto(produto)))
      .catch((err) => {
        if (handleUnauthorized(err)) return
        setError(getErrorMessage(err, 'Produto não encontrado.'))
      })
      .finally(() => setLoading(false))
  }, [id, isEditing, session, handleUnauthorized])

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
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

    const payload = toRequest(form)

    try {
      if (isEditing && id) {
        await atualizarProduto(session.token, Number(id), payload)
        navigate('/produtos')
      } else {
        const criado = await criarProduto(session.token, payload)
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
            Código de barras *
            <input
              className={fieldErrors.codigoBarras ? styles.inputError : styles.input}
              value={form.codigoBarras}
              onChange={(e) => updateField('codigoBarras', e.target.value)}
              maxLength={50}
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

          <label className={`${styles.label} ${styles.fullWidth}`}>
            URL da imagem
            <input
              type="url"
              className={fieldErrors.urlImagem ? styles.inputError : styles.input}
              value={form.urlImagem}
              onChange={(e) => updateField('urlImagem', e.target.value)}
              placeholder="https://..."
              disabled={submitting}
            />
            {fieldErrors.urlImagem && (
              <span className={styles.fieldError}>{fieldErrors.urlImagem}</span>
            )}
          </label>
        </div>

        {error && <p className={styles.error}>{error}</p>}
      </form>

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
