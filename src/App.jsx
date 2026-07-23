import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import NovoFechamento from './pages/NovoFechamento'
import Cadastros from './pages/Cadastros'
import Relatorios from './pages/Relatorios'
import Configuracoes from './pages/Configuracoes'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/fechamento" element={<NovoFechamento />} />
      <Route path="/cadastros" element={<Cadastros />} />
      <Route path="/relatorios" element={<Relatorios />} />
      <Route path="/configuracoes" element={<Configuracoes />} />
    </Routes>
  )
}