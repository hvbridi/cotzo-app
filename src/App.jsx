import { Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import Fazendas from './pages/Fazendas'
import DetalhesFazenda from './pages/DetalhesFazenda'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import NovoFechamento from './pages/NovoFechamento'
import Cadastros from './pages/Cadastros'
import CadastrarFazenda from './pages/CadastrarFazenda'
import Produtores from './pages/Produtores'
import Empresas from './pages/Empresas'
import CadastrarEmpresa from './pages/CadastrarEmpresa'
import DetalhesEmpresa from './pages/DetalhesEmpresa'
import Relatorios from './pages/Relatorios'
import Configuracoes from './pages/Configuracoes'
import Ofertas from './pages/Ofertas'
import DetalhesContrato from './pages/DetalhesContrato'
import ProtectedRoute from './components/ProtectedRoute'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        {/* Rota Pública */}
        <Route path="/" element={<Login />} />

        {/* Rotas Protegidas */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/fechamento" element={<NovoFechamento />} />
          <Route path="/cadastros" element={<Cadastros />} />
          
          {/* Fazendas */}
          <Route path="/fazendas" element={<Fazendas />} />
          <Route path="/cadastrar-fazenda" element={<CadastrarFazenda />} />
          <Route path="/detalhes-fazenda" element={<DetalhesFazenda />} />

          {/* Produtores */}
          <Route path="/produtores" element={<Produtores />} />

          {/* Empresas */}
          <Route path="/empresas" element={<Empresas />} />
          <Route path="/cadastrar-empresa" element={<CadastrarEmpresa />} />
          <Route path="/detalhes-empresa" element={<DetalhesEmpresa />} />

          {/* Relatórios, Ofertas e Configurações */}
          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="/ofertas" element={<Ofertas />} />
          <Route path="/detalhes-contrato" element={<DetalhesContrato />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
        </Route>
      </Routes>
    </QueryClientProvider>
  )
}