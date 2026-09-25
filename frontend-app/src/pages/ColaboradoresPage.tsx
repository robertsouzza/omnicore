import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { inativarColaborador, listarColaboradores } from '../api/colaboradores'
import { useAuth } from '../auth/AuthContext'
import { ROTULO_PERFIL } from '../auth/permissoesCatalogo'
import { useAsyncAction, usePaginatedResource } from '../hooks'
import type { Colaborador } from '../types/colaborador'
import { formatCpf } from '../utils/cpf'
import styles from './ColaboradoresPage.module.css'

function StatusBadge({ ativo }: { ativo: boolean }) {
  return (
    <span className={ativo ? styles.badgeActive : styles.badgeInactive}>
      {ativo ? 'Ativo' : 'Inativo'}
    </span>
  )
}

function PerfilBadge({ perfil }: { perfil: Colaborador['perfil'] }) {
  return (
    <span className={`${styles.badge}${perfil === 'GERENTE' ? ` ${styles.badgeGerente}` : ''}`}>
      {perfil}
    </span>
  )
}

export function ColaboradoresPage() {
  const { session } = useAuth()
  const [pageNumber, setPageNumber] = useState(0)
  const [incluirInativos, setIncluirInativos] = useState(false)
  const fetchPage = useCallback(
    (page: number) => {
      if (!session) throw new Error('Sem sessão')
      return listarColaboradores(session.token, { page, incluirInativos })
    },
    [session, incluirInativos],
  )

  const {
    page,
    initialLoading,
    refreshing,
    loadError,
    setLoadError,
    load,
  } = usePaginatedResource(fetchPage, {
    enabled: !!session,
    errorMessage: 'Erro ao carregar colaboradores.',
    pageNumber,
    setPageNumber,
  })

  const { actionKey, execute } = useAsyncAction()

  const colaboradores = page?.content ?? []
  const totalPages = page?.totalPages ?? 0
  const isLastPage = page ? page.number >= page.totalPages - 1 : true

  async function handleInativar(c: Colaborador) {
    if (!session || !c.ativo) return
    if (c.id === session.colaboradorId) {
      window.alert('Você não pode inativar o próprio usuário logado.')
      return
    }
    const ok = window.confirm(
      `Inativar "${c.nome}"?\n\nExclusão lógica: o histórico de vendas permanece; a pessoa deixa de entrar no sistema.`,
    )
    if (!ok) return

    setLoadError(null)
    await execute(
      c.id,
      async () => {
        await inativarColaborador(session.token, c.id)
        await load()
      },
      setLoadError,
      'Não foi possível inativar o colaborador.',
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <h1>Colaboradores</h1>
          <p className={styles.status}>Cadastro da equipe — somente gerente</p>
        </div>
        <div className={styles.headerActions}>
          <Link to="/equipe/novo" className={styles.newBtn}>
            + Novo colaborador
          </Link>
          <Link to="/equipe/permissoes" className={styles.linkBtn}>
            Modelos de permissão
          </Link>
        </div>
      </header>

      <div className={styles.toolbar}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={incluirInativos}
            onChange={(e) => {
              setIncluirInativos(e.target.checked)
              setPageNumber(0)
            }}
          />
          Incluir inativos
        </label>
        {refreshing && !initialLoading ? (
          <span className={styles.status}>Atualizando…</span>
        ) : null}
      </div>

      {initialLoading ? <p className={styles.status}>Carregando…</p> : null}
      {loadError ? <p className={styles.error}>{loadError}</p> : null}

      {!initialLoading && !loadError ? (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>CPF</th>
                  <th>Perfil</th>
                  {incluirInativos ? <th>Status</th> : null}
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {colaboradores.length === 0 ? (
                  <tr>
                    <td colSpan={incluirInativos ? 6 : 5}>Nenhum colaborador encontrado.</td>
                  </tr>
                ) : (
                  colaboradores.map((c) => (
                    <tr key={c.id} className={!c.ativo ? styles.inactiveRow : undefined}>
                      <td>{c.nome}</td>
                      <td>{c.email}</td>
                      <td className={styles.mono}>{formatCpf(c.cpf)}</td>
                      <td>
                        <PerfilBadge perfil={c.perfil} />
                        <span className={styles.status} style={{ marginLeft: '0.35rem' }}>
                          {ROTULO_PERFIL[c.perfil]}
                        </span>
                      </td>
                      {incluirInativos ? (
                        <td>
                          <StatusBadge ativo={c.ativo} />
                        </td>
                      ) : null}
                      <td>
                        <div className={styles.rowActions}>
                          <Link to={`/equipe/${c.id}/editar`} className={styles.editLink}>
                            Editar
                          </Link>
                          {c.ativo ? (
                            <button
                              type="button"
                              className={styles.dangerBtn}
                              disabled={actionKey === c.id}
                              onClick={() => void handleInativar(c)}
                            >
                              {actionKey === c.id ? 'Inativando…' : 'Inativar'}
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 ? (
            <div className={styles.pagination}>
              <button
                type="button"
                disabled={pageNumber <= 0}
                onClick={() => setPageNumber((p) => Math.max(0, p - 1))}
              >
                Anterior
              </button>
              <span>
                Página {(page?.number ?? 0) + 1} de {totalPages}
              </span>
              <button
                type="button"
                disabled={isLastPage}
                onClick={() => setPageNumber((p) => p + 1)}
              >
                Próxima
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
