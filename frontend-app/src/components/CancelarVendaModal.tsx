import { type FormEvent, useEffect, useState } from 'react'
import type { PerfilColaborador } from '../types/auth'
import type { CancelarVendaRequest, Venda } from '../types/venda'
import { formatPreco, vendaExigeAutorizacaoGerente } from '../types/venda'
import styles from './CancelarVendaModal.module.css'

interface CancelarVendaModalProps {
  venda: Venda
  perfilLogado: PerfilColaborador
  open: boolean
  submitting: boolean
  error: string | null
  onClose: () => void
  onConfirm: (payload: CancelarVendaRequest) => void | Promise<void>
}

export function CancelarVendaModal({
  venda,
  perfilLogado,
  open,
  submitting,
  error,
  onClose,
  onConfirm,
}: CancelarVendaModalProps) {
  const exigeGerente = vendaExigeAutorizacaoGerente(venda.status)
  const gerenteLogado = perfilLogado === 'GERENTE'

  const [motivo, setMotivo] = useState('')
  const [autorizadorEmail, setAutorizadorEmail] = useState('')
  const [autorizadorSenha, setAutorizadorSenha] = useState('')

  useEffect(() => {
    if (!open) return
    setMotivo('')
    setAutorizadorEmail('')
    setAutorizadorSenha('')
  }, [open, venda.id])

  if (!open) return null

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const payload: CancelarVendaRequest = {}

    if (exigeGerente) {
      payload.motivo = motivo.trim()
      if (!gerenteLogado) {
        payload.autorizadorEmail = autorizadorEmail.trim()
        payload.autorizadorSenha = autorizadorSenha
      }
    }

    void onConfirm(payload)
  }

  return (
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancelar-venda-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.header}>
          <h2 id="cancelar-venda-title" className={styles.title}>
            Cancelar venda #{venda.id}
          </h2>
          <p className={styles.subtitle}>
            Total: {formatPreco(venda.valorTotal)}
            {exigeGerente && ' · venda já liquidada — exige autorização de gerente.'}
          </p>
        </header>

        <form className={styles.form} onSubmit={handleSubmit}>
          {exigeGerente ? (
            <>
              <label className={styles.field}>
                Motivo do cancelamento *
                <textarea
                  className={styles.textarea}
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ex.: Produto com defeito — cliente solicitou devolução"
                  rows={3}
                  maxLength={255}
                  required
                  disabled={submitting}
                />
              </label>

              {!gerenteLogado && (
                <>
                  <p className={styles.hint}>
                    Solicite ao gerente em loja e informe as credenciais dele para autorizar o
                    cancelamento e o estorno de estoque.
                  </p>
                  <label className={styles.field}>
                    E-mail do gerente *
                    <input
                      type="email"
                      className={styles.input}
                      value={autorizadorEmail}
                      onChange={(e) => setAutorizadorEmail(e.target.value)}
                      placeholder="Ex.: ana.gerente@omnicore.local"
                      autoComplete="username"
                      required
                      disabled={submitting}
                    />
                  </label>
                  <label className={styles.field}>
                    Senha do gerente *
                    <input
                      type="password"
                      className={styles.input}
                      value={autorizadorSenha}
                      onChange={(e) => setAutorizadorSenha(e.target.value)}
                      autoComplete="current-password"
                      required
                      disabled={submitting}
                    />
                  </label>
                </>
              )}

              {gerenteLogado && (
                <p className={styles.hint}>
                  Você está logado como gerente — basta informar o motivo para confirmar.
                </p>
              )}
            </>
          ) : (
            <p className={styles.hint}>
              Venda ainda não liquidada — o cancelamento não altera o estoque.
            </p>
          )}

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            <button type="button" className={styles.secondaryBtn} onClick={onClose} disabled={submitting}>
              Voltar
            </button>
            <button type="submit" className={styles.dangerBtn} disabled={submitting}>
              {submitting ? 'Cancelando…' : 'Confirmar cancelamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
