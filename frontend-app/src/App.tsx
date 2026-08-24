import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { ClienteFormPage } from './pages/ClienteFormPage'
import { ClientesPage } from './pages/ClientesPage'
import { EstoquePage } from './pages/EstoquePage'
import { EstoqueProdutoPage } from './pages/EstoqueProdutoPage'
import { LoginPage } from './pages/LoginPage'
import { ProdutoFormPage } from './pages/ProdutoFormPage'
import { ProdutoKitPage } from './pages/ProdutoKitPage'
import { ProdutosPage } from './pages/ProdutosPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route index element={<Navigate to="/produtos" replace />} />
              <Route path="/produtos" element={<ProdutosPage />} />
              <Route path="/produtos/novo" element={<ProdutoFormPage />} />
              <Route path="/produtos/:id/kit" element={<ProdutoKitPage />} />
              <Route path="/produtos/:id/editar" element={<ProdutoFormPage />} />
              <Route path="/clientes" element={<ClientesPage />} />
              <Route path="/clientes/novo" element={<ClienteFormPage />} />
              <Route path="/clientes/:id/editar" element={<ClienteFormPage />} />
              <Route path="/estoque" element={<EstoquePage />} />
              <Route path="/estoque/:produtoId" element={<EstoqueProdutoPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/produtos" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
