import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { buscarProduto } from '../api/produtos'
import { useAuth } from '../auth/AuthContext'
import { ComposicaoPacoteSection } from '../components/ComposicaoPacoteSection'
import { useUnauthorizedHandler } from '../hooks'
import type { Produto } from '../types/produto'
import { getErrorMessage } from '../utils/validation'
import styles from './ProdutoKitPage.module.css'

export function ProdutoKitPage() {
  const { id } = useParams()
  const { session } = useAuth()
  const handleUnauthorized = useUnauthorizedHandler()
  const [produto, setProduto] = useState<Produto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session || !id) return

    setLoading(true)
    setError(null)

    buscarProduto(session.token, Number(id))
      .then(setProduto)
      .catch((err) => {
        if (handleUnauthorized(err)) return
        setError(getErrorMessage(err, 'Produto não encontrado.'))
      })
      .finally(() => setLoading(false))
  }, [id, session, handleUnauthorized])

  if (loading) {
    return <p className={styles.status}>Carregando kit…</p>
  }

  if (error || !produto) {
    return (
      <section className={styles.page}>
        <p className={styles.error}>{error ?? 'Produto não encontrado.'}</p>
        <Link to="/produtos" className={styles.backLink}>
          ← Voltar para produtos
        </Link>
      </section>
    )
  }

  if (produto.tipoProduto !== 'PACOTE') {
    return <Navigate to={`/produtos/${produto.id}/editar`} replace />
  }

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Composição do kit</h1>
          <p className={styles.subtitle}>
            <strong>{produto.nome}</strong> · código {produto.codigoBarras}
          </p>
        </div>
        <Link to="/produtos" className={styles.backLink}>
          ← Voltar
        </Link>
      </div>

      {session && (
        <ComposicaoPacoteSection
          pacoteId={produto.id}
          token={session.token}
          onUnauthorized={handleUnauthorized}
          hideHeader
        />
      )}

      <div className={styles.footer}>
        <Link to="/produtos" className={styles.backBtn}>
          Voltar para produtos
        </Link>
        <Link to={`/produtos/${produto.id}/editar`} className={styles.editLink}>
          Editar dados do produto
        </Link>
      </div>
    </section>
  )
}
