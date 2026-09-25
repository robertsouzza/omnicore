import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  atualizarColaborador,
  buscarColaboradorPorId,
  listarColaboradores,
} from '../api/colaboradores'
import { useAuth } from '../auth/AuthContext'
import {
  CATALOGO_PERMISSOES,
  matrizPermissoesPerfil,
  PERFIS_GERENCIAVEIS,
  ROTULO_PERFIL,
} from '../auth/permissoesCatalogo'
import type { PerfilColaborador } from '../types/auth'
import type { Colaborador } from '../types/colaborador'
import { Link } from 'react-router-dom'
import { getErrorMessage } from '../utils/validation'
import styles from './EquipePermissoesPage.module.css'

function perfilEditavel(colaborador: Colaborador | null): boolean {
  if (!colaborador || !colaborador.ativo) return false
  return colaborador.perfil !== 'GERENTE'
}

export function EquipePermissoesPage() {
  const { session } = useAuth()
  const token = session?.token ?? ''
  const queryClient = useQueryClient()

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [perfilDraft, setPerfilDraft] = useState<PerfilColaborador>('VENDEDOR')
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const listaQuery = useQuery({
    queryKey: ['colaboradores', 'equipe'],
    queryFn: () => listarColaboradores(token, { size: 100 }),
    enabled: Boolean(token),
  })

  const detalheQuery = useQuery({
    queryKey: ['colaboradores', selectedId],
    queryFn: () => buscarColaboradorPorId(token, selectedId!),
    enabled: Boolean(token && selectedId),
  })

  const colaboradores = listaQuery.data?.content ?? []
  const selecionado = detalheQuery.data ?? colaboradores.find((c) => c.id === selectedId) ?? null

  useEffect(() => {
    if (selecionado && PERFIS_GERENCIAVEIS.includes(selecionado.perfil as (typeof PERFIS_GERENCIAVEIS)[number])) {
      setPerfilDraft(selecionado.perfil)
    } else if (selecionado?.perfil === 'GERENTE') {
      setPerfilDraft('GERENTE')
    }
  }, [selecionado])

  useEffect(() => {
    if (selectedId == null && colaboradores.length > 0) {
      setSelectedId(colaboradores[0].id)
    }
  }, [colaboradores, selectedId])

  const matrizAtual = useMemo(
    () => (selecionado ? matrizPermissoesPerfil(selecionado.perfil) : null),
    [selecionado],
  )

  const matrizDraft = useMemo(() => matrizPermissoesPerfil(perfilDraft), [perfilDraft])

  const perfilMudou =
    selecionado != null &&
    perfilEditavel(selecionado) &&
    perfilDraft !== selecionado.perfil &&
    PERFIS_GERENCIAVEIS.includes(perfilDraft as (typeof PERFIS_GERENCIAVEIS)[number])

  const salvarPerfil = useCallback(async () => {
    if (!selecionado || !perfilEditavel(selecionado)) return
    if (!PERFIS_GERENCIAVEIS.includes(perfilDraft as (typeof PERFIS_GERENCIAVEIS)[number])) return

    setSaving(true)
    setFeedback(null)
    try {
      await atualizarColaborador(token, selecionado.id, {
        nome: selecionado.nome,
        cpf: selecionado.cpf,
        email: selecionado.email,
        perfil: perfilDraft,
        limiteDescontoAutonomo: selecionado.limiteDescontoAutonomo,
      })
      await queryClient.invalidateQueries({ queryKey: ['colaboradores'] })
      setFeedback({
        type: 'ok',
        text: `Perfil de ${selecionado.nome} atualizado para ${ROTULO_PERFIL[perfilDraft]}. A pessoa precisa entrar de novo para ver o menu novo.`,
      })
    } catch (err) {
      setFeedback({ type: 'err', text: getErrorMessage(err) })
    } finally {
      setSaving(false)
    }
  }, [perfilDraft, queryClient, selecionado, token])

  const aplicarModelo = useCallback(
    (modelo: PerfilColaborador) => {
      if (!PERFIS_GERENCIAVEIS.includes(modelo as (typeof PERFIS_GERENCIAVEIS)[number])) return
      setPerfilDraft(modelo)
      setFeedback({
        type: 'ok',
        text: `Modelo ${ROTULO_PERFIL[modelo]} selecionado — clique em "Salvar perfil" para aplicar à pessoa.`,
      })
    },
    [],
  )

  if (listaQuery.isLoading) {
    return <p className={styles.empty}>Carregando equipe…</p>
  }

  if (listaQuery.isError) {
    return <p className={styles.error}>{getErrorMessage(listaQuery.error)}</p>
  }

  return (
    <div className={styles.page}>
      <header>
        <Link to="/equipe" className={styles.linkBack}>
          ← Voltar para colaboradores
        </Link>
        <h1>Equipe e permissões</h1>
        <p className={styles.intro}>
          Cada colaborador recebe um <strong>perfil</strong> (Vendedor, Caixa, Conferente ou Gerente).
          O menu e a API seguem a matriz abaixo. Para dar ou tirar acesso, altere o perfil da pessoa ou
          aplique um modelo pronto.
        </p>
      </header>

      <div className={styles.grid}>
        <section className={styles.panel} aria-labelledby="equipe-lista">
          <h2 id="equipe-lista" className={styles.panelTitle}>
            Colaboradores
          </h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Perfil</th>
                </tr>
              </thead>
              <tbody>
                {colaboradores.map((c) => (
                  <tr
                    key={c.id}
                    className={`${styles.rowClickable}${selectedId === c.id ? ` ${styles.rowSelected}` : ''}`}
                    onClick={() => setSelectedId(c.id)}
                  >
                    <td>{c.nome}</td>
                    <td>
                      <span
                        className={`${styles.badge}${c.perfil === 'GERENTE' ? ` ${styles.badgeGerente}` : ''}`}
                      >
                        {c.perfil}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className={styles.panel} aria-labelledby="equipe-detalhe">
          <h2 id="equipe-detalhe" className={styles.panelTitle}>
            Acesso da pessoa selecionada
          </h2>
          {!selecionado ? (
            <p className={styles.empty}>Selecione alguém na lista.</p>
          ) : (
            <>
              <p className={styles.detailName}>{selecionado.nome}</p>
              <p className={styles.detailEmail}>{selecionado.email}</p>

              {perfilEditavel(selecionado) ? (
                <label>
                  <span className={styles.panelTitle}>Perfil</span>
                  <select
                    className={styles.perfilSelect}
                    value={PERFIS_GERENCIAVEIS.includes(perfilDraft as (typeof PERFIS_GERENCIAVEIS)[number]) ? perfilDraft : selecionado.perfil}
                    onChange={(e) => setPerfilDraft(e.target.value as PerfilColaborador)}
                  >
                    {PERFIS_GERENCIAVEIS.map((p) => (
                      <option key={p} value={p}>
                        {ROTULO_PERFIL[p]}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <p className={styles.hint}>
                  Perfil <strong>Gerente</strong> tem acesso total; não é alterável por esta tela.
                </p>
              )}

              <ul className={styles.permisList} aria-label="Permissões efetivas">
                {CATALOGO_PERMISSOES.map((item) => {
                  const ativo = perfilMudou ? matrizDraft[item.codigo] : matrizAtual?.[item.codigo]
                  return (
                    <li
                      key={item.codigo}
                      className={`${styles.permisRow}${!ativo ? ` ${styles.permisOff}` : ''}`}
                    >
                      <input type="checkbox" checked={Boolean(ativo)} readOnly aria-readonly />
                      <span>
                        {item.label}
                        {item.hint ? (
                          <>
                            <br />
                            <small>{item.hint}</small>
                          </>
                        ) : null}
                      </span>
                    </li>
                  )
                })}
              </ul>

              <p className={styles.hint}>
                As caixas de seleção mostram o pacote do perfil. Marque/desmarque indiretamente escolhendo
                outro perfil ou um modelo abaixo.
              </p>

              <div className={styles.actions}>
                {perfilEditavel(selecionado) && (
                  <button
                    type="button"
                    className={styles.primaryBtn}
                    disabled={!perfilMudou || saving}
                    onClick={() => void salvarPerfil()}
                  >
                    {saving ? 'Salvando…' : 'Salvar perfil'}
                  </button>
                )}
              </div>

              {feedback ? (
                <p className={feedback.type === 'ok' ? styles.success : styles.error}>{feedback.text}</p>
              ) : null}
            </>
          )}
        </section>
      </div>

      <section className={`${styles.panel} ${styles.matrizSection}`} aria-labelledby="modelos-perfil">
        <h2 id="modelos-perfil" className={styles.panelTitle}>
          Modelos por perfil
        </h2>
        <p className={styles.hint} style={{ marginTop: 0, marginBottom: '1rem' }}>
          Referência visual do que cada perfil enxerga no OmniCore (menu + regras da API).
        </p>
        <div className={styles.matrizGrid}>
          {PERFIS_GERENCIAVEIS.map((perfil) => {
            const matriz = matrizPermissoesPerfil(perfil)
            return (
              <div key={perfil} className={styles.matrizCard}>
                <h3 className={styles.matrizCardTitle}>{ROTULO_PERFIL[perfil]}</h3>
                <ul className={styles.permisList}>
                  {CATALOGO_PERMISSOES.map((item) => (
                    <li
                      key={item.codigo}
                      className={`${styles.permisRow}${!matriz[item.codigo] ? ` ${styles.permisOff}` : ''}`}
                    >
                      <input type="checkbox" checked={matriz[item.codigo]} readOnly />
                      <span>{item.label}</span>
                    </li>
                  ))}
                </ul>
                {selecionado && perfilEditavel(selecionado) ? (
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    style={{ marginTop: '0.75rem' }}
                    onClick={() => aplicarModelo(perfil)}
                  >
                    Aplicar a {selecionado.nome.split(' ')[0]}
                  </button>
                ) : null}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
