import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiFetch } from '../services/api'

export default function Cadastros() {
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
        console.error('Erro ao carregar perfil:', e)
      }
    }

    carregarPerfil()
  }, [])

  return (
    <div className="bg-background text-on-background min-h-screen flex antialiased animate-fade-in font-body">
      {/* SideNavBar Padronizada */}
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
          <Link
            to="/dashboard"
            className="flex items-center px-4 py-3 text-on-surface-variant hover:bg-surface-variant/50 rounded-lg font-body text-label-lg active:scale-95 transition-transform duration-150"
          >
            <span className="material-symbols-outlined mr-3">dashboard</span>
            Dashboard
          </Link>
          <Link
            to="/fechamento"
            className="flex items-center px-4 py-3 text-on-surface-variant hover:bg-surface-variant/50 rounded-lg font-body text-label-lg active:scale-95 transition-transform duration-150"
          >
            <span className="material-symbols-outlined mr-3">handshake</span>
            Novo Fechamento
          </Link>
          <Link
            to="/cadastros"
            className="flex items-center px-4 py-3 bg-primary-container text-on-primary-container rounded-lg font-semibold font-body text-label-lg active:scale-95 transition-transform duration-150"
          >
            <span
              className="material-symbols-outlined mr-3"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              person_book
            </span>
            Cadastros
          </Link>
          <Link
            to="/relatorios"
            className="flex items-center px-4 py-3 text-on-surface-variant hover:bg-surface-variant/50 rounded-lg font-body text-label-lg active:scale-95 transition-transform duration-150"
          >
            <span className="material-symbols-outlined mr-3">assessment</span>
            Relatórios
          </Link>
          <Link
            to="/configuracoes"
            className="flex items-center px-4 py-3 text-on-surface-variant hover:bg-surface-variant/50 rounded-lg font-body text-label-lg active:scale-95 transition-transform duration-150"
          >
            <span className="material-symbols-outlined mr-3">settings</span>
            Configurações
          </Link>
        </nav>

        {/* Rodapé da Sidebar sem o Suporte */}
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

      {/* Main Wrapper */}
      <div className="flex-1 flex flex-col min-h-screen md:ml-72">
        {/* TopAppBar Padronizada com Perfil Dinâmico */}
        <header className="fixed top-0 right-0 h-16 z-40 bg-background/80 dark:bg-background/80 backdrop-blur-md border-b border-outline-variant/20 md:left-72">
          <div className="flex justify-between items-center px-8 h-full w-full">
            <div className="flex-1 flex items-center">
              <div className="relative w-64">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-sm">
                  search
                </span>
                <input
                  className="w-full bg-surface-container rounded-full py-1.5 pl-9 pr-4 text-sm border-none focus:ring-1 focus:ring-primary text-on-surface placeholder:text-secondary focus:outline-none"
                  placeholder="Buscar..."
                  type="text"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="text-secondary hover:text-primary cursor-pointer p-2 rounded-full hover:bg-surface-container-low">
                <span className="material-symbols-outlined">notifications</span>
              </button>
              <button className="text-secondary hover:text-primary cursor-pointer p-2 rounded-full hover:bg-surface-container-low">
                <span className="material-symbols-outlined">settings</span>
              </button>

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

        {/* Main Content Area */}
        <main className="flex-1 mt-16 p-8 overflow-y-auto bg-background">
          <div className="w-full max-w-7xl mx-auto space-y-8">
            {/* Section Header */}
            <div>
              <h2 className="text-3xl font-headline font-semibold text-on-background mb-1">
                Central de Cadastros
              </h2>
              <p className="text-secondary text-lg">
                Selecione a categoria desejada para gerenciar registros, atualizar
                informações ou adicionar novos dados à base.
              </p>
            </div>

            {/* Bento Grid - Hub Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Card 1: Produtores */}
              <Link
                to="/produtores"
                className="group block bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/20 hover:border-primary/40 shadow-[0_4px_20px_rgba(46,50,48,0.06)] hover:shadow-lg transition-all duration-300 active:scale-[0.98] flex flex-col items-center text-center aspect-square justify-center relative overflow-hidden cursor-pointer"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-container/20 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-500 ease-out pointer-events-none"></div>
                <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-6 group-hover:bg-primary-container transition-colors duration-300">
                  <span className="material-symbols-outlined text-4xl text-primary">
                    agriculture
                  </span>
                </div>
                <h3 className="font-headline text-2xl font-semibold text-on-surface mb-3 group-hover:text-primary transition-colors">
                  Produtores
                </h3>
                <p className="font-body text-on-surface-variant text-base leading-relaxed px-4">
                  Gerenciar base de agricultores parceiros e cooperados.
                </p>
              </Link>

              {/* Card 2: Fazendas */}
              <Link
                to="/fazendas"
                className="group block bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/20 hover:border-tertiary/40 shadow-[0_4px_20px_rgba(46,50,48,0.06)] hover:shadow-lg transition-all duration-300 active:scale-[0.98] flex flex-col items-center text-center aspect-square justify-center relative overflow-hidden cursor-pointer"
              >
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-tertiary-container/20 rounded-tr-full -ml-16 -mb-16 transition-transform group-hover:scale-150 duration-500 ease-out pointer-events-none"></div>
                <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-6 group-hover:bg-tertiary-container transition-colors duration-300">
                  <span className="material-symbols-outlined text-4xl text-tertiary">
                    map
                  </span>
                </div>
                <h3 className="font-headline text-2xl font-semibold text-on-surface mb-3 group-hover:text-tertiary transition-colors">
                  Fazendas
                </h3>
                <p className="font-body text-on-surface-variant text-base leading-relaxed px-4">
                  Propriedades rurais, geolocalização e infraestrutura logística.
                </p>
              </Link>

              {/* Card 3: Empresas */}
              <Link
                to="/empresas"
                className="group block bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/20 hover:border-secondary/40 shadow-[0_4px_20px_rgba(46,50,48,0.06)] hover:shadow-lg transition-all duration-300 active:scale-[0.98] flex flex-col items-center text-center aspect-square justify-center relative overflow-hidden cursor-pointer"
              >
                <div className="absolute inset-0 bg-secondary-container/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-6 group-hover:bg-secondary-container transition-colors duration-300">
                  <span className="material-symbols-outlined text-4xl text-secondary">
                    business
                  </span>
                </div>
                <h3 className="font-headline text-2xl font-semibold text-on-surface mb-3 group-hover:text-secondary transition-colors">
                  Empresas
                </h3>
                <p className="font-body text-on-surface-variant text-base leading-relaxed px-4">
                  Tradings, compradores, fornecedores e parceiros corporativos.
                </p>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}