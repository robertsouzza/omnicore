import { type FormEvent, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { getLoginErrorMessage, useAuth } from '../auth/AuthContext'
import { Button, StatusMessage, TextField } from '../components/ui'
import styles from './LoginPage.module.css'

export function LoginPage() {
  const { isAuthenticated, login } = useAuth()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (isAuthenticated) {
    return <Navigate to="/produtos" replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await login({ email, senha })
    } catch (err) {
      setError(getLoginErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>OmniCore</h1>
          <p className={styles.subtitle}>Entre com sua conta de colaborador</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <TextField
            label="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
            disabled={loading}
          />

          <TextField
            label="Senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoComplete="current-password"
            required
            disabled={loading}
          />

          {error && <StatusMessage variant="error">{error}</StatusMessage>}

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>

        <p className={styles.hint}>Dev: carlos.vendedor@omnicore.local · senha123</p>
      </div>
    </div>
  )
}
