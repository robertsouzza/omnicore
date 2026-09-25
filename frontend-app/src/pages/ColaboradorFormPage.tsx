import { type FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  atualizarColaborador,
  buscarColaboradorPorId,
  criarColaborador,
} from '../api/colaboradores'
import { useAuth } from '../auth/AuthContext'
import { ROTULO_PERFIL } from '../auth/permissoesCatalogo'
import { useUnauthorizedHandler } from '../hooks'
import type { PerfilColaborador } from '../types/auth'
import type { ColaboradorRequest } from '../types/colaborador'
import { formatCpf, isCpfValido, maskCpfInput, onlyDigits } from '../utils/cpf'
import { getErrorMessage, getFieldErrors } from '../utils/validation'
import styles from './ClienteFormPage.module.css'

const PERFIS: PerfilColaborador[] = ['VENDEDOR', 'CAIXA', 'CONFERENTE', 'GERENTE']

interface FormState {
  nome: string
  cpf: string
  email: string
  senha: string
  perfil: PerfilColaborador
  limiteDescontoAutonomo: string
}

const INITIAL: FormState = {
  nome: '',
  cpf: '',
  email: '',
  senha: '',
  perfil: 'VENDEDOR',
  limiteDescontoAutonomo: '5.00',
}

function toRequest(form: FormState, isEdit: boolean): ColaboradorRequest {
  const body: ColaboradorRequest = {
    nome: form.nome.trim(),
    cpf: onlyDigits(form.cpf),
    email: form.email.trim(),
    perfil: form.perfil,
    limiteDescontoAutonomo: Number(form.limiteDescontoAutonomo),
  }
  const senha = form.senha.trim()
  if (!isEdit || senha.length > 0) {
    body.senha = senha
  }
  return body
}

export function ColaboradorFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { session } = useAuth()
  const handleUnauthorized = useUnauthorizedHandler()

  const [form, setForm] = useState<FormState>(INITIAL)
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!isEdit || !id || !session) return
    let cancelled = false
    setLoading(true)
    buscarColaboradorPorId(session.token, Number(id))
      .then((c) => {
        if (cancelled) return
        setForm({
          nome: c.nome,
          cpf: formatCpf(c.cpf),
          email: c.email,
          senha: '',
          perfil: c.perfil,
          limiteDescontoAutonomo: String(c.limiteDescontoAutonomo ?? 5),
        })
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err))
        handleUnauthorized(err)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [handleUnauthorized, id, isEdit, session])

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  function validateLocal(): boolean {
    const next: Record<string, string> = {}
    if (!form.nome.trim()) next.nome = 'Informe o nome.'
    const cpfDigits = onlyDigits(form.cpf)
    if (cpfDigits.length !== 11 || !isCpfValido(cpfDigits)) {
      next.cpf = 'Informe um CPF válido.'
    }
    if (!form.email.trim()) next.email = 'Informe o e-mail.'
    if (!isEdit && form.senha.trim().length < 6) {
      next.senha = 'Senha obrigatória (mín. 6 caracteres) no cadastro.'
    }
    if (isEdit && form.senha.trim().length > 0 && form.senha.trim().length < 6) {
      next.senha = 'Nova senha deve ter pelo menos 6 caracteres.'
    }
    const limite = Number(form.limiteDescontoAutonomo)
    if (Number.isNaN(limite) || limite < 0) {
      next.limiteDescontoAutonomo = 'Limite de desconto inválido.'
    }
    setFieldErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!session || !validateLocal()) return
    setSubmitting(true)
    setError(null)
    try {
      const body = toRequest(form, isEdit)
      if (isEdit && id) {
        await atualizarColaborador(session.token, Number(id), body)
      } else {
        await criarColaborador(session.token, body)
      }
      navigate('/equipe')
    } catch (err) {
      setError(getErrorMessage(err))
      setFieldErrors(getFieldErrors(err))
      handleUnauthorized(err)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <p className={styles.status}>Carregando colaborador…</p>
      </div>
    )
  }

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{isEdit ? 'Editar colaborador' : 'Novo colaborador'}</h1>
          <p className={styles.subtitle}>
            Login = e-mail. Inativar remove acesso sem apagar o registro no banco.
          </p>
        </div>
        <Link to="/equipe" className={styles.backLink}>
          ← Colaboradores
        </Link>
      </div>

      <form id="colaborador-form" className={styles.form} onSubmit={(e) => void handleSubmit(e)}>
        <div className={styles.grid}>
          <label className={styles.label}>
            Nome completo *
            <input
              className={fieldErrors.nome ? styles.inputError : styles.input}
              value={form.nome}
              onChange={(e) => updateField('nome', e.target.value)}
              maxLength={150}
              autoComplete="name"
            />
            {fieldErrors.nome ? <span className={styles.fieldError}>{fieldErrors.nome}</span> : null}
          </label>

          <label className={styles.label}>
            CPF *
            <input
              className={fieldErrors.cpf ? styles.inputError : styles.input}
              value={form.cpf}
              onChange={(e) => updateField('cpf', maskCpfInput(e.target.value))}
              inputMode="numeric"
              autoComplete="off"
            />
            {fieldErrors.cpf ? <span className={styles.fieldError}>{fieldErrors.cpf}</span> : null}
          </label>

          <label className={styles.label}>
            E-mail (login) *
            <input
              type="email"
              className={fieldErrors.email ? styles.inputError : styles.input}
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              maxLength={150}
              autoComplete="email"
            />
            {fieldErrors.email ? <span className={styles.fieldError}>{fieldErrors.email}</span> : null}
          </label>

          <label className={styles.label}>
            {isEdit ? 'Nova senha' : 'Senha *'}
            <input
              type="password"
              className={fieldErrors.senha ? styles.inputError : styles.input}
              value={form.senha}
              onChange={(e) => updateField('senha', e.target.value)}
              autoComplete="new-password"
              placeholder={isEdit ? 'Deixe em branco para manter a atual' : 'Mínimo 6 caracteres'}
            />
            {fieldErrors.senha ? <span className={styles.fieldError}>{fieldErrors.senha}</span> : null}
          </label>

          <label className={styles.label}>
            Perfil *
            <select
              className={styles.input}
              value={form.perfil}
              onChange={(e) => updateField('perfil', e.target.value as PerfilColaborador)}
            >
              {PERFIS.map((p) => (
                <option key={p} value={p}>
                  {ROTULO_PERFIL[p]} ({p})
                </option>
              ))}
            </select>
          </label>

          <label className={styles.label}>
            Limite desconto autônomo (%) *
            <input
              type="number"
              min={0}
              step={0.01}
              className={fieldErrors.limiteDescontoAutonomo ? styles.inputError : styles.input}
              value={form.limiteDescontoAutonomo}
              onChange={(e) => updateField('limiteDescontoAutonomo', e.target.value)}
            />
            {fieldErrors.limiteDescontoAutonomo ? (
              <span className={styles.fieldError}>{fieldErrors.limiteDescontoAutonomo}</span>
            ) : null}
          </label>
        </div>

        {error ? <p className={styles.error}>{error}</p> : null}

        <div className={styles.footerActions}>
          <Link to="/equipe" className={styles.cancelBtn}>
            Cancelar
          </Link>
          <button type="submit" className={styles.submitBtn} disabled={submitting}>
            {submitting ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Cadastrar'}
          </button>
        </div>
      </form>
    </section>
  )
}
