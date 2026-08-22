import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { consultarCep } from '../api/cep'
import { ApiError } from '../api/client'
import { atualizarCliente, buscarCliente, criarCliente } from '../api/clientes'
import { useAuth } from '../auth/AuthContext'
import { PAISES_TELEFONE, PAIS_PADRAO, type ClienteRequest } from '../types/cliente'
import { cepToDigits, formatCep, maskCepInput } from '../utils/cep'
import { formatCpf, maskCpfInput, onlyDigits } from '../utils/cpf'
import {
  celularToNationalDigits,
  formatCelularDisplay,
  formatCelularForInput,
  maskCelularInput,
  normalizePaisIso,
} from '../utils/telefone'
import { getErrorMessage, getFieldErrors } from '../utils/validation'
import styles from './ClienteFormPage.module.css'

interface FormState {
  nomeCompleto: string
  cpf: string
  email: string
  codigoPais: string
  celular: string
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
}

const INITIAL_FORM: FormState = {
  nomeCompleto: '',
  cpf: '',
  email: '',
  codigoPais: PAIS_PADRAO,
  celular: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function toRequest(form: FormState): ClienteRequest {
  return {
    nomeCompleto: form.nomeCompleto.trim(),
    cpf: onlyDigits(form.cpf),
    email: form.email.trim(),
    codigoPais: normalizePaisIso(form.codigoPais),
    celular: celularToNationalDigits(normalizePaisIso(form.codigoPais), form.celular),
    cep: cepToDigits(form.cep),
    logradouro: emptyToNull(form.logradouro),
    numero: emptyToNull(form.numero),
    complemento: emptyToNull(form.complemento),
    bairro: emptyToNull(form.bairro),
    cidade: emptyToNull(form.cidade),
    estado: emptyToNull(form.estado)?.toUpperCase() ?? null,
  }
}

function fromCliente(cliente: {
  nomeCompleto: string
  cpf: string
  email: string
  codigoPais: string
  celular: string
  cep: string | null
  logradouro: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cidade: string | null
  estado: string | null
}): FormState {
  const paisIso = normalizePaisIso(cliente.codigoPais)
  return {
    nomeCompleto: cliente.nomeCompleto,
    cpf: formatCpf(cliente.cpf),
    email: cliente.email,
    codigoPais: paisIso,
    celular: formatCelularForInput(paisIso, cliente.celular),
    cep: cliente.cep ? formatCep(cliente.cep) : '',
    logradouro: cliente.logradouro ?? '',
    numero: cliente.numero ?? '',
    complemento: cliente.complemento ?? '',
    bairro: cliente.bairro ?? '',
    cidade: cliente.cidade ?? '',
    estado: cliente.estado ?? '',
  }
}

export function ClienteFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session, logout } = useAuth()
  const isEditing = Boolean(id)

  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(isEditing)
  const [submitting, setSubmitting] = useState(false)
  const [buscandoCep, setBuscandoCep] = useState(false)

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

    buscarCliente(session.token, Number(id))
      .then((cliente) => setForm(fromCliente(cliente)))
      .catch((err) => {
        if (handleUnauthorized(err)) return
        setError(getErrorMessage(err, 'Cliente não encontrado.'))
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

  async function handleBuscarCep() {
    if (!session) return

    const digits = onlyDigits(form.cep)
    if (digits.length !== 8) {
      setError('Informe um CEP com 8 dígitos para buscar o endereço.')
      return
    }

    setBuscandoCep(true)
    setError(null)

    try {
      const endereco = await consultarCep(session.token, digits)
      setForm((current) => ({
        ...current,
        cep: formatCep(endereco.cep),
        logradouro: endereco.logradouro ?? '',
        bairro: endereco.bairro ?? '',
        cidade: endereco.cidade ?? '',
        estado: endereco.estado ?? '',
      }))
    } catch (err) {
      if (handleUnauthorized(err)) return
      setError(getErrorMessage(err, 'Não foi possível consultar o CEP.'))
    } finally {
      setBuscandoCep(false)
    }
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
        await atualizarCliente(session.token, Number(id), payload)
      } else {
        await criarCliente(session.token, payload)
      }
      navigate('/clientes')
    } catch (err) {
      if (handleUnauthorized(err)) return
      setFieldErrors(getFieldErrors(err))
      setError(getErrorMessage(err, 'Não foi possível salvar o cliente.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <p className={styles.status}>Carregando cliente…</p>
  }

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{isEditing ? 'Editar cliente' : 'Novo cliente'}</h1>
          <p className={styles.subtitle}>
            {isEditing
              ? 'Atualize os dados cadastrais do cliente.'
              : 'Preencha os campos para cadastrar um novo cliente.'}
          </p>
        </div>
        <Link to="/clientes" className={styles.backLink}>
          ← Voltar
        </Link>
      </div>

      <form className={styles.form} id="cliente-form" onSubmit={handleSubmit}>
        <h2 className={styles.sectionTitle}>Dados pessoais</h2>
        <div className={styles.grid}>
          <label className={`${styles.label} ${styles.fullWidth}`}>
            Nome completo *
            <input
              className={fieldErrors.nomeCompleto ? styles.inputError : styles.input}
              value={form.nomeCompleto}
              onChange={(e) => updateField('nomeCompleto', e.target.value)}
              maxLength={150}
              required
              disabled={submitting}
            />
            {fieldErrors.nomeCompleto && (
              <span className={styles.fieldError}>{fieldErrors.nomeCompleto}</span>
            )}
          </label>

          <label className={styles.label}>
            CPF *
            <input
              className={fieldErrors.cpf ? styles.inputError : styles.input}
              value={form.cpf}
              onChange={(e) => updateField('cpf', maskCpfInput(e.target.value))}
              placeholder="000.000.000-00"
              inputMode="numeric"
              maxLength={14}
              required
              disabled={submitting}
            />
            {fieldErrors.cpf && <span className={styles.fieldError}>{fieldErrors.cpf}</span>}
          </label>

          <label className={styles.label}>
            E-mail *
            <input
              type="email"
              className={fieldErrors.email ? styles.inputError : styles.input}
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              maxLength={150}
              required
              disabled={submitting}
            />
            {fieldErrors.email && <span className={styles.fieldError}>{fieldErrors.email}</span>}
          </label>
        </div>

        <h2 className={styles.sectionTitle}>Contato</h2>
        <div className={styles.phoneRow}>
          <label className={styles.label}>
            País *
            <select
              className={fieldErrors.codigoPais ? styles.inputError : styles.input}
              value={form.codigoPais}
              onChange={(e) => {
                const pais = normalizePaisIso(e.target.value)
                updateField('codigoPais', pais)
                updateField('celular', '')
              }}
              disabled={submitting}
            >
              {PAISES_TELEFONE.map((pais) => (
                <option key={pais.iso} value={pais.iso}>
                  {pais.label}
                </option>
              ))}
            </select>
            {fieldErrors.codigoPais && (
              <span className={styles.fieldError}>{fieldErrors.codigoPais}</span>
            )}
          </label>

          <label className={styles.label}>
            Celular *
            <input
              className={fieldErrors.celular ? styles.inputError : styles.input}
              value={form.celular}
              onChange={(e) =>
                updateField('celular', maskCelularInput(normalizePaisIso(form.codigoPais), e.target.value))
              }
              placeholder="Digite DDD + número"
              inputMode="tel"
              required
              disabled={submitting}
            />
            {fieldErrors.celular && (
              <span className={styles.fieldError}>{fieldErrors.celular}</span>
            )}
            {form.celular && (
              <span className={styles.hint}>
                Ex.:{' '}
                {formatCelularDisplay(
                  normalizePaisIso(form.codigoPais),
                  celularToNationalDigits(normalizePaisIso(form.codigoPais), form.celular),
                )}
              </span>
            )}
          </label>
        </div>

        <h2 className={styles.sectionTitle}>Endereço de entrega</h2>
        <div className={styles.cepRow}>
          <label className={styles.label}>
            CEP
            <input
              className={fieldErrors.cep ? styles.inputError : styles.input}
              value={form.cep}
              onChange={(e) => updateField('cep', maskCepInput(e.target.value))}
              placeholder="00000-000"
              inputMode="numeric"
              maxLength={9}
              disabled={submitting || buscandoCep}
            />
            {fieldErrors.cep && <span className={styles.fieldError}>{fieldErrors.cep}</span>}
          </label>
          <button
            type="button"
            className={styles.cepBtn}
            onClick={() => void handleBuscarCep()}
            disabled={submitting || buscandoCep}
          >
            {buscandoCep ? 'Buscando…' : 'Buscar CEP'}
          </button>
        </div>

        <div className={styles.grid}>
          <label className={`${styles.label} ${styles.fullWidth}`}>
            Endereço
            <input
              className={fieldErrors.logradouro ? styles.inputError : styles.input}
              value={form.logradouro}
              onChange={(e) => updateField('logradouro', e.target.value)}
              maxLength={150}
              disabled={submitting}
            />
            {fieldErrors.logradouro && (
              <span className={styles.fieldError}>{fieldErrors.logradouro}</span>
            )}
          </label>

          <label className={styles.label}>
            Nº
            <input
              className={fieldErrors.numero ? styles.inputError : styles.input}
              value={form.numero}
              onChange={(e) => updateField('numero', e.target.value)}
              maxLength={20}
              disabled={submitting}
            />
            {fieldErrors.numero && <span className={styles.fieldError}>{fieldErrors.numero}</span>}
          </label>

          <label className={styles.label}>
            Complemento
            <input
              className={fieldErrors.complemento ? styles.inputError : styles.input}
              value={form.complemento}
              onChange={(e) => updateField('complemento', e.target.value)}
              maxLength={100}
              disabled={submitting}
            />
            {fieldErrors.complemento && (
              <span className={styles.fieldError}>{fieldErrors.complemento}</span>
            )}
          </label>

          <label className={styles.label}>
            Bairro
            <input
              className={fieldErrors.bairro ? styles.inputError : styles.input}
              value={form.bairro}
              onChange={(e) => updateField('bairro', e.target.value)}
              maxLength={100}
              disabled={submitting}
            />
            {fieldErrors.bairro && <span className={styles.fieldError}>{fieldErrors.bairro}</span>}
          </label>

          <label className={styles.label}>
            Cidade
            <input
              className={fieldErrors.cidade ? styles.inputError : styles.input}
              value={form.cidade}
              onChange={(e) => updateField('cidade', e.target.value)}
              maxLength={100}
              disabled={submitting}
            />
            {fieldErrors.cidade && <span className={styles.fieldError}>{fieldErrors.cidade}</span>}
          </label>

          <label className={styles.label}>
            Estado
            <input
              className={fieldErrors.estado ? styles.inputError : styles.input}
              value={form.estado}
              onChange={(e) => updateField('estado', e.target.value.toUpperCase())}
              maxLength={2}
              placeholder="UF"
              disabled={submitting}
            />
            {fieldErrors.estado && <span className={styles.fieldError}>{fieldErrors.estado}</span>}
          </label>
        </div>

        {error && <p className={styles.error}>{error}</p>}
      </form>

      <div className={styles.footerActions}>
        <Link to="/clientes" className={styles.cancelBtn}>
          Cancelar
        </Link>
        <button
          type="submit"
          form="cliente-form"
          className={styles.submitBtn}
          disabled={submitting}
        >
          {submitting ? 'Salvando…' : isEditing ? 'Salvar alterações' : 'Cadastrar cliente'}
        </button>
      </div>
    </section>
  )
}
