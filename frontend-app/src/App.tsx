import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { Layout } from './components/Layout'
import { HomeRedirect } from './components/HomeRedirect'
import { ProtectedRoute } from './components/ProtectedRoute'
import { RequirePermissao } from './components/RequirePermissao'
import { SalaoLayout } from './components/SalaoLayout'
import { QueryProvider } from './providers/QueryProvider'
import { CaixaPage } from './pages/CaixaPage'
import { ClienteFormPage } from './pages/ClienteFormPage'
import { ClientesPage } from './pages/ClientesPage'
import { EstoquePage } from './pages/EstoquePage'
import { EstoqueProdutoPage } from './pages/EstoqueProdutoPage'
import { LoginPage } from './pages/LoginPage'
import { NovaVendaPage } from './pages/NovaVendaPage'
import { PdvPage } from './pages/PdvPage'
import { ProdutoFormPage } from './pages/ProdutoFormPage'
import { ProdutoKitPage } from './pages/ProdutoKitPage'
import { ProdutosPage } from './pages/ProdutosPage'
import { SalaoVendaPage } from './pages/SalaoVendaPage'
import { SalaoVendasPage } from './pages/SalaoVendasPage'
import { VendaDetalhePage } from './pages/VendaDetalhePage'
import { ColaboradorFormPage } from './pages/ColaboradorFormPage'
import { ColaboradoresPage } from './pages/ColaboradoresPage'
import { EquipePermissoesPage } from './pages/EquipePermissoesPage'
import { VendasPage } from './pages/VendasPage'

export default function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<RequirePermissao />}>
            <Route element={<SalaoLayout />}>
              <Route path="/salao" element={<SalaoVendaPage />} />
              <Route path="/salao/vendas" element={<SalaoVendasPage />} />
            </Route>
            <Route element={<Layout />}>
              <Route index element={<HomeRedirect />} />
              <Route path="/produtos" element={<ProdutosPage />} />
              <Route path="/produtos/novo" element={<ProdutoFormPage />} />
              <Route path="/produtos/:id/kit" element={<ProdutoKitPage />} />
              <Route path="/produtos/:id/editar" element={<ProdutoFormPage />} />
              <Route path="/clientes" element={<ClientesPage />} />
              <Route path="/clientes/novo" element={<ClienteFormPage />} />
              <Route path="/clientes/:id/editar" element={<ClienteFormPage />} />
              <Route path="/estoque" element={<EstoquePage />} />
              <Route path="/estoque/:produtoId" element={<EstoqueProdutoPage />} />
              <Route path="/vendas" element={<VendasPage />} />
              <Route path="/vendas/nova" element={<NovaVendaPage />} />
              <Route path="/vendas/:id" element={<VendaDetalhePage />} />
              <Route path="/pdv" element={<PdvPage />} />
              <Route path="/caixa" element={<CaixaPage />} />
              <Route path="/equipe" element={<ColaboradoresPage />} />
              <Route path="/equipe/novo" element={<ColaboradorFormPage />} />
              <Route path="/equipe/permissoes" element={<EquipePermissoesPage />} />
              <Route path="/equipe/:id/editar" element={<ColaboradorFormPage />} />
            </Route>
            </Route>
          </Route>
          <Route path="*" element={<HomeRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </QueryProvider>
  )
}
