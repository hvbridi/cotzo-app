import { Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import { FeedbackProvider } from './components/ui/Feedback'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import NovoFechamento from './pages/NovoFechamento'
import Cadastros from './pages/Cadastros'
import Produtores from './pages/Produtores'
import Fazendas from './pages/Fazendas'
import CadastrarFazenda from './pages/CadastrarFazenda'
import DetalhesFazenda from './pages/DetalhesFazenda'
import Empresas from './pages/Empresas'
import CadastrarEmpresa from './pages/CadastrarEmpresa'
import DetalhesEmpresa from './pages/DetalhesEmpresa'
import Ofertas from './pages/Ofertas'
import Relatorios from './pages/Relatorios'
import DetalhesContrato from './pages/DetalhesContrato'
import Configuracoes from './pages/Configuracoes'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <FeedbackProvider>
        <Routes>
          {/* Pública */}
          <Route path="/" element={<Login />} />

          {/* Todas as telas internas ficam dentro do Layout compartilhado */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/fechamento" element={<NovoFechamento />} />

              {/* Cadastros */}
              <Route path="/cadastros" element={<Cadastros />} />
              <Route path="/produtores" element={<Produtores />} />
              <Route path="/fazendas" element={<Fazendas />} />
              <Route path="/cadastrar-fazenda" element={<CadastrarFazenda />} />
              <Route path="/detalhes-fazenda" element={<DetalhesFazenda />} />
              <Route path="/empresas" element={<Empresas />} />
              <Route path="/cadastrar-empresa" element={<CadastrarEmpresa />} />
              <Route path="/detalhes-empresa" element={<DetalhesEmpresa />} />

              {/* Operação */}
              <Route path="/ofertas" element={<Ofertas />} />
              <Route path="/relatorios" element={<Relatorios />} />
              <Route path="/detalhes-contrato" element={<DetalhesContrato />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
            </Route>
          </Route>

          {/* Rota desconhecida: manda para o dashboard.
              Quem não estiver logado é barrado pelo ProtectedRoute e cai no login. */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </FeedbackProvider>
    </QueryClientProvider>
  )
}