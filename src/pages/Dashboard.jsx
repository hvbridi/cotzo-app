import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../services/api'

export default function Dashboard() {
  const navigate = useNavigate()

  // Perfil do Usuário Logado
  const [perfil, setPerfil] = useState({
    nome: '',
    cargo: '',
  })

  const getIniciais = (nome) => {
    if (!nome) return 'LR'
    const partes = nome.trim().split(' ')
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase()
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
  }

  // Formatação de data segura (DD/MM/AAAA)
  const formatarData = (dataStr) => {
    if (!dataStr) return 'N/A'
    const dataPura = dataStr.split('T')[0]
    const partes = dataPura.split('-')
    if (partes.length === 3) {
      const [ano, mes, dia] = partes
      return `${dia}/${mes}/${ano}`
    }
    return dataStr
  }

  useEffect(() => {
    async function carregarPerfil() {
      try {
        const resMe = await apiFetch('/usuarios/me')
        if (resMe.ok) {
          const meData = await resMe.json()
          setPerfil(meData)
        } else {
          const token = localStorage.getItem('token')
          if (token) {
            const payloadBase64 = token.split('.')[1]
            const payloadJson = JSON.parse(atob(payloadBase64))
            const emailLogado = payloadJson.sub || ''
            const resListaU = await apiFetch('/usuarios/')
            if (resListaU.ok) {
              const listaU = await resListaU.json()
              const uEncontrado = listaU.find(
                (item) => item.email.toLowerCase() === emailLogado.toLowerCase()
              )
              if (uEncontrado) setPerfil(uEncontrado)
            }
          }
        }
      } catch (e) {
        console.error('Erro ao buscar perfil:', e)
      }
    }

    carregarPerfil()
  }, [])

  // Busca contratos com cache automático do React Query
  const {
    data: contratos = [],
    isLoading: carregando,
    isError,
    error,
  } = useQuery({
    queryKey: ['contratos'],
    queryFn: async () => {
      const resposta = await apiFetch('/contratos/')
      if (!resposta.ok) {
        throw new Error('Falha ao buscar contratos no banco de dados.')
      }
      return resposta.json()
    },
  })

  // Métricas Calculadas Dinamicamente
  const totalContratos = contratos.length
  const volumeTotalSacas = contratos.reduce(
    (acc, c) => acc + (Number(c.volume) || 0),
    0
  )
  const comissaoTotal = contratos.reduce(
    (acc, c) => acc + (Number(c.valor_comissao) || 0),
    0
  )
  const valorTotalMovimentado = contratos.reduce(
    (acc, c) => acc + (Number(c.valor_total) || 0),
    0
  )

  // Função utilitária para aplicar o estilo ativo/inativo nos links de navegação
  const getNavLinkClass = ({ isActive }) =>
    `flex items-center px-4 py-3 rounded-lg font-body text-label-lg active:scale-95 transition-all duration-150 ${
      isActive
        ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
        : 'text-on-surface-variant hover:bg-surface-variant/50'
    }`

  return (
    <div className="bg-background text-on-background antialiased h-screen overflow-hidden flex animate-fade-in font-body">
      {/* SideNavBar Fixa Padronizada */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen flex-col p-4 border-r border-outline-variant/20 bg-surface-container dark:bg-surface-container-lowest w-72 z-20">
        <div className="mb-6 px-2 pt-4 shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-on-primary text-xl">
                eco
              </span>
            </div>
            <h2 className="font-headline text-xl font-bold text-on-surface">
              Terra Nova
            </h2>
          </div>
          <p className="font-body text-label-md text-on-surface-variant ml-10">
            AgroCapital
          </p>
        </div>

       <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
  <NavLink to="/dashboard" className={getNavLinkClass}>
    <span className="material-symbols-outlined mr-3">dashboard</span>
    Dashboard
  </NavLink>

  <NavLink to="/fechamento" className={getNavLinkClass}>
    <span className="material-symbols-outlined mr-3">handshake</span>
    Novo Fechamento
  </NavLink>

  <NavLink to="/cadastros" className={getNavLinkClass}>
    <span className="material-symbols-outlined mr-3">person_book</span>
    Cadastros
  </NavLink>

  <NavLink to="/ofertas" className={getNavLinkClass}>
    <span className="material-symbols-outlined mr-3">campaign</span>
    Ofertas
  </NavLink>

  <NavLink to="/relatorios" className={getNavLinkClass}>
    <span className="material-symbols-outlined mr-3">assessment</span>
    Relatórios
  </NavLink>

  <NavLink to="/configuracoes" className={getNavLinkClass}>
    <span className="material-symbols-outlined mr-3">settings</span>
    Configurações
  </NavLink>
</nav>

        <div className="mt-auto space-y-1 pt-4 border-t border-outline-variant/20 shrink-0">
          <button
            onClick={() => {
              localStorage.removeItem('token')
              navigate('/')
            }}
            className="w-full flex items-center px-4 py-3 text-on-surface-variant hover:bg-surface-variant/50 rounded-lg font-body text-label-lg active:scale-95 transition-transform duration-150 text-left cursor-pointer"
          >
            <span className="material-symbols-outlined mr-3">logout</span>
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col h-full md:ml-72 overflow-hidden">
        {/* TopAppBar */}
        <header className="fixed top-0 right-0 h-16 z-40 bg-background/80 backdrop-blur-md border-b border-outline-variant/20 md:left-72">
          <div className="flex justify-between items-center px-8 h-full w-full">
            <h1 className="font-headline font-bold text-lg text-on-surface">
              Visão Geral de Negócios
            </h1>

            <div className="flex items-center gap-4">
              <NavLink
                to="/fechamento"
                className="bg-primary text-on-primary px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary/90 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Novo Fechamento
              </NavLink>

              {/* Badge do Usuário Logado */}
              <div className="flex items-center gap-3 ml-2 cursor-pointer">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-bold text-on-surface leading-tight">
                    {perfil.nome || 'Luís miguel Ravanello'}
                  </p>
                  <p className="text-xs text-on-surface-variant capitalize">
                    {perfil.cargo || 'Admin'}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-[#dbd8ce] flex items-center justify-center font-bold text-xs text-[#4a5043] shrink-0 border border-outline-variant/30">
                  {getIniciais(perfil.nome || 'Luís miguel Ravanello')}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Canvas */}
        <main className="flex-1 mt-16 p-8 overflow-y-auto bg-surface-container-lowest">
          <div className="max-w-7xl mx-auto space-y-8 pb-16">
            <div>
              <h2 className="text-3xl font-headline font-bold text-on-surface">
                Painel Principal
              </h2>
              <p className="text-secondary text-sm mt-1">
                Acompanhe o volume acumulado e as comissões geradas no sistema.
              </p>
            </div>

            {/* CARDS DE KPIS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-surface-bright p-6 rounded-2xl border border-outline-variant/20 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-secondary">
                  <span className="text-xs font-bold uppercase">Contratos Fechados</span>
                  <span className="material-symbols-outlined text-primary">description</span>
                </div>
                <div className="mt-4">
                  <span className="text-3xl font-bold font-mono text-on-surface">
                    {carregando ? '-' : totalContratos}
                  </span>
                </div>
              </div>

              <div className="bg-surface-bright p-6 rounded-2xl border border-outline-variant/20 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-secondary">
                  <span className="text-xs font-bold uppercase">Volume Negociado</span>
                  <span className="material-symbols-outlined text-primary">grain</span>
                </div>
                <div className="mt-4">
                  <span className="text-3xl font-bold font-mono text-on-surface">
                    {carregando ? '-' : `${volumeTotalSacas.toLocaleString('pt-BR')} sc`}
                  </span>
                </div>
              </div>

              <div className="bg-surface-bright p-6 rounded-2xl border border-outline-variant/20 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-secondary">
                  <span className="text-xs font-bold uppercase">Valor Total do Grão</span>
                  <span className="material-symbols-outlined text-primary">payments</span>
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-bold font-mono text-primary">
                    {carregando ? '-' : `R$ ${valorTotalMovimentado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  </span>
                </div>
              </div>

              <div className="bg-surface-bright p-6 rounded-2xl border border-outline-variant/20 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-secondary">
                  <span className="text-xs font-bold uppercase">Comissão Gerada</span>
                  <span className="material-symbols-outlined text-tertiary">savings</span>
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-bold font-mono text-tertiary">
                    {carregando ? '-' : `R$ ${comissaoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  </span>
                </div>
              </div>
            </div>

            {/* TABELA DE CONTRATOS RECENTES */}
            <div className="bg-surface-bright rounded-2xl border border-outline-variant/20 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center">
                <h3 className="font-headline font-bold text-lg text-on-surface">
                  Contratos Recentes
                </h3>
              </div>

              <div className="overflow-x-auto">
                {carregando ? (
                  <div className="p-12 text-center text-secondary">
                    Carregando dados financeiros...
                  </div>
                ) : isError ? (
                  <div className="p-12 text-center text-error font-medium">
                    {error.message}
                  </div>
                ) : contratos.length === 0 ? (
                  <div className="p-12 text-center text-secondary">
                    Nenhum contrato cadastrado ainda. Clique em "Novo Fechamento" para começar.
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low text-secondary text-xs font-bold uppercase">
                        <th className="py-3 px-6 border-b border-outline-variant/20">ID</th>
                        <th className="py-3 px-6 border-b border-outline-variant/20">Data</th>
                        <th className="py-3 px-6 border-b border-outline-variant/20">Commodity</th>
                        <th className="py-3 px-6 border-b border-outline-variant/20">Safra</th>
                        <th className="py-3 px-6 border-b border-outline-variant/20">Volume</th>
                        <th className="py-3 px-6 border-b border-outline-variant/20">Preço Unit.</th>
                        <th className="py-3 px-6 border-b border-outline-variant/20">Total</th>
                        <th className="py-3 px-6 border-b border-outline-variant/20">Comissão</th>
                        <th className="py-3 px-6 border-b border-outline-variant/20">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {contratos.map((c) => (
                        <tr
                          key={c.id}
                          className="border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors"
                        >
                          <td className="py-4 px-6 font-mono text-secondary">#{c.id}</td>
                          <td className="py-4 px-6 text-on-surface">{formatarData(c.data_fechamento)}</td>
                          <td className="py-4 px-6 font-semibold text-on-surface">{c.commodity}</td>
                          <td className="py-4 px-6 text-secondary">{c.safra}</td>
                          <td className="py-4 px-6 font-mono text-on-surface">
                            {Number(c.volume).toLocaleString('pt-BR')} {c.tipo_medida}
                          </td>
                          <td className="py-4 px-6 font-mono text-on-surface">
                            {c.moeda === 'USD' ? '$' : 'R$'} {Number(c.preco_unitario).toFixed(2)}
                          </td>
                          <td className="py-4 px-6 font-mono font-bold text-primary">
                            {c.moeda === 'USD' ? '$' : 'R$'}{' '}
                            {Number(c.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-4 px-6 font-mono font-bold text-tertiary">
                            {c.moeda === 'USD' ? '$' : 'R$'}{' '}
                            {Number(c.valor_comissao).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-4 px-6">
                            <span className="px-3 py-1 bg-primary-container text-on-primary-container text-xs font-bold rounded-full">
                              {c.status || 'Fechado'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}