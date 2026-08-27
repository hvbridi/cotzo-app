import { useState, useEffect, useRef } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { usePerfil } from '../services/queries'
import { getIniciais } from '../utils/formatters'
import { limparTodosRascunhos } from '../hooks/useRascunho'
import AvisoSessao from './AvisoSessao'

/**
 * Chrome único da aplicação: sidebar + topo + área de conteúdo.
 * Antes isso estava copiado em 13 páginas — e já havia dessincronizado
 * (a sidebar de Empresas.jsx não tinha o link de Ofertas).
 */

const ITENS_NAV = [
  { rota: '/dashboard', icone: 'dashboard', texto: 'Dashboard' },
  { rota: '/fechamento', icone: 'handshake', texto: 'Novo Fechamento' },
  {
    rota: '/cadastros',
    icone: 'person_book',
    texto: 'Cadastros',
    // Sub-rotas que devem manter "Cadastros" destacado na sidebar
    inclui: [
      '/produtores',
      '/fazendas',
      '/empresas',
      '/cadastrar-fazenda',
      '/cadastrar-empresa',
      '/detalhes-fazenda',
      '/detalhes-empresa',
    ],
  },
  { rota: '/ofertas', icone: 'campaign', texto: 'Ofertas' },
  {
    rota: '/relatorios',
    icone: 'assessment',
    texto: 'Relatórios',
    inclui: ['/detalhes-contrato'],
  },
  { rota: '/configuracoes', icone: 'settings', texto: 'Configurações' },
]

const TITULOS = {
  '/dashboard': 'Dashboard',
  '/fechamento': 'Novo Fechamento',
  '/cadastros': 'Central de Cadastros',
  '/produtores': 'Produtores',
  '/fazendas': 'Fazendas',
  '/cadastrar-fazenda': 'Nova Fazenda',
  '/detalhes-fazenda': 'Detalhes da Fazenda',
  '/empresas': 'Empresas',
  '/cadastrar-empresa': 'Nova Empresa',
  '/detalhes-empresa': 'Detalhes da Empresa',
  '/ofertas': 'Mural de Ofertas',
  '/relatorios': 'Relatórios',
  '/detalhes-contrato': 'Detalhes do Contrato',
  '/configuracoes': 'Configurações',
}

function estaAtivo(item, caminho) {
  if (caminho === item.rota || caminho.startsWith(`${item.rota}/`)) return true
  return (item.inclui || []).some((p) => caminho.startsWith(p))
}

function ConteudoSidebar({ aoNavegar }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const sair = () => {
    localStorage.removeItem('token')
    // Limpa o cache: sem isso, o próximo login veria os dados do usuário anterior.
    queryClient.clear()
    // Saída voluntária apaga os rascunhos. Expiração de sessão não apaga —
    // ali o trabalho em andamento precisa sobreviver ao novo login.
    limparTodosRascunhos()
    navigate('/', { replace: true })
  }

  return (
    <>
      <div className="mb-6 px-2 pt-4 shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-on-primary text-xl">eco</span>
          </div>
          <h2 className="font-headline text-xl font-bold text-on-surface">Terra Nova</h2>
        </div>
        <p className="font-body text-label-md text-on-surface-variant ml-10">
          AgroCapital
        </p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
        {ITENS_NAV.map((item) => {
          const ativo = estaAtivo(item, pathname)
          return (
            <Link
              key={item.rota}
              to={item.rota}
              onClick={aoNavegar}
              aria-current={ativo ? 'page' : undefined}
              className={`flex items-center px-4 py-3 rounded-lg font-body text-label-lg active:scale-95 transition-all duration-150 ${
                ativo
                  ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-variant/50'
              }`}
            >
              <span
                className="material-symbols-outlined mr-3"
                style={ativo ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icone}
              </span>
              {item.texto}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-outline-variant/20 shrink-0">
        <button
          onClick={sair}
          className="w-full flex items-center px-4 py-3 text-on-surface-variant hover:bg-surface-variant/50 rounded-lg font-body text-label-lg active:scale-95 transition-transform duration-150 text-left cursor-pointer"
        >
          <span className="material-symbols-outlined mr-3">logout</span>
          Sair
        </button>
      </div>
    </>
  )
}

export default function Layout() {
  const [menuAberto, setMenuAberto] = useState(false)
  const { pathname } = useLocation()
  const { perfil } = usePerfil()
  const areaConteudo = useRef(null)

  // Fecha o menu do celular ao trocar de tela
  useEffect(() => setMenuAberto(false), [pathname])

  // Sem isso, ir de uma lista longa para outra tela mantém o scroll no meio da página
  useEffect(() => {
    areaConteudo.current?.scrollTo({ top: 0 })
  }, [pathname])

  const titulo = TITULOS[pathname] || ''

  return (
    <div className="h-screen flex bg-background text-on-background antialiased font-body">
      {/* Sidebar fixa — desktop */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-72 flex-col p-4 border-r border-outline-variant/20 bg-surface-container z-20">
        <ConteudoSidebar />
      </aside>

      {/* Drawer — celular */}
      {menuAberto && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
          onClick={() => setMenuAberto(false)}
        >
          <aside
            className="h-full w-72 flex flex-col p-4 bg-surface-container shadow-2xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <ConteudoSidebar aoNavegar={() => setMenuAberto(false)} />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 md:ml-72">
        <AvisoSessao />

        {/* Topo — sem busca, sino e engrenagem (nenhum deles fazia nada) */}
        <header className="h-16 shrink-0 flex items-center justify-between px-4 md:px-8 bg-background/80 backdrop-blur-md border-b border-outline-variant/20">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMenuAberto(true)}
              aria-label="Abrir menu"
              className="md:hidden p-2 -ml-2 rounded-full text-on-surface-variant hover:bg-surface-variant/50 cursor-pointer"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h1 className="font-headline text-lg font-semibold text-on-surface truncate">
              {titulo}
            </h1>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-on-surface leading-tight">
                {perfil.nome || 'Carregando...'}
              </p>
              <p className="text-xs text-on-surface-variant capitalize">
                {perfil.cargo}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-surface-dim flex items-center justify-center font-bold text-xs text-on-surface-variant shrink-0 border border-outline-variant/30">
              {getIniciais(perfil.nome)}
            </div>
          </div>
        </header>

        {/* Único elemento com scroll — o index.css trava o scroll do body */}
        <main ref={areaConteudo} className="flex-1 overflow-y-auto p-4 md:p-8">
          {/* A key faz o React remontar o bloco a cada rota, o que reinicia o fade */}
          <div key={pathname} className="w-full max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}