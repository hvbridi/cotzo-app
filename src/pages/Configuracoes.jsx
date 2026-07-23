import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Configuracoes() {
  const navigate = useNavigate()
  const [abaAtiva, setAbaAtiva] = useState('usuarios')
  const [busca, setBusca] = useState('')

  return (
    <div className="bg-background text-on-background antialiased min-h-screen flex">
      {/* SideNavBar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full flex-col p-4 space-y-2 border-r border-outline-variant/20 bg-surface-container dark:bg-surface-container-lowest w-72 z-20">
        <div className="mb-8 px-2 pt-4">
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

        <nav className="flex-1 space-y-1">
          <Link
            to="/dashboard"
            className="flex items-center px-4 py-3 text-on-surface-variant hover:bg-surface-variant/50 rounded-lg font-body text-label-lg active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined mr-3">dashboard</span>
            Dashboard
          </Link>
          <Link
            to="/fechamento"
            className="flex items-center px-4 py-3 text-on-surface-variant hover:bg-surface-variant/50 rounded-lg font-body text-label-lg active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined mr-3">handshake</span>
            Novo Fechamento
          </Link>
          <Link
            to="/cadastros"
            className="flex items-center px-4 py-3 text-on-surface-variant hover:bg-surface-variant/50 rounded-lg font-body text-label-lg active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined mr-3">person_book</span>
            Cadastros
          </Link>
          <Link
            to="/relatorios"
            className="flex items-center px-4 py-3 text-on-surface-variant hover:bg-surface-variant/50 rounded-lg font-body text-label-lg active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined mr-3">assessment</span>
            Relatórios
          </Link>
          <Link
            to="/configuracoes"
            className="flex items-center px-4 py-3 bg-primary-container text-on-primary-container rounded-lg font-semibold font-body text-label-lg active:scale-95 transition-transform"
          >
            <span
              className="material-symbols-outlined mr-3"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              settings
            </span>
            Configurações
          </Link>
        </nav>

        <div className="mt-auto space-y-1 pt-4 border-t border-outline-variant/20">
          <a
            href="#"
            className="flex items-center px-4 py-3 text-on-surface-variant hover:bg-surface-variant/50 rounded-lg font-body text-label-lg active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined mr-3">help</span>
            Suporte
          </a>
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center px-4 py-3 text-on-surface-variant hover:bg-surface-variant/50 rounded-lg font-body text-label-lg active:scale-95 transition-transform text-left cursor-pointer"
          >
            <span className="material-symbols-outlined mr-3">logout</span>
            Sair
          </button>
        </div>
      </aside>

      {/* Main Wrapper */}
      <div className="flex-1 flex flex-col min-h-screen md:ml-72">
        {/* TopAppBar */}
        <header className="fixed top-0 right-0 h-16 z-40 bg-background/80 dark:bg-background/80 backdrop-blur-md border-b border-outline-variant/20 md:left-72">
          <div className="flex justify-between items-center px-8 h-full w-full">
            <div className="flex-1 flex items-center">
              <div className="relative w-64">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-sm">
                  search
                </span>
                <input
                  className="w-full bg-surface-container rounded-full py-1.5 pl-9 pr-4 text-sm border-none focus:ring-1 focus:ring-primary text-on-surface placeholder:text-secondary"
                  placeholder="Buscar no sistema..."
                  type="text"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="text-secondary hover:text-primary cursor-pointer p-2 rounded-full hover:bg-surface-container-low relative">
                <span className="material-symbols-outlined">
                  notifications
                </span>
                <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full"></span>
              </button>
              <button className="text-secondary hover:text-primary cursor-pointer p-2 rounded-full hover:bg-surface-container-low">
                <span className="material-symbols-outlined">settings</span>
              </button>
              <div className="flex items-center gap-3 ml-2 group cursor-pointer">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                    Admin Terra
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    Administrador
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-surface-variant overflow-hidden border border-outline-variant/30 group-hover:border-primary transition-colors">
                  <img
                    alt="User Profile"
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDhoef4fqgB-0WyVLHEoFmwZu7_TqLzLLFx6UBN8vLbPEdFb89RWGSL2_bpY31uGIOcH21vvJr_CM4D0drMxSrieFBwTzOS3tuSlnPwE4x_U5dcRZT1IiyEQvmT1JFvBJf4FbZGu4cn3fAMf4P6VbwUmJGrvu1Np5kpfcj9wdP3d3Tp5H1aNzEiWMFDEl423BYEHW2GOf8MNqWX9VKCQJ_BX1Q6YBss_KXNet7ln5J5cS3fUBLmWfe5hA8ocNzHA3R7Wg3rhQIqSr0"
                  />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Canvas */}
        <main className="flex-1 mt-16 p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* Page Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-headline font-semibold text-on-background mb-1">
              Configurações
            </h2>
            <p className="text-secondary text-lg">
              Gerencie as preferências e usuários do sistema Terra Nova.
            </p>
          </div>

          {/* Tabs Interativas */}
          <div className="border-b border-outline-variant/30 mb-8 flex gap-8">
            <button
              onClick={() => setAbaAtiva('geral')}
              className={`pb-4 font-label text-base transition-colors relative cursor-pointer ${
                abaAtiva === 'geral'
                  ? 'text-primary font-bold'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              Geral
              {abaAtiva === 'geral' && (
                <span className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-primary rounded-t-full"></span>
              )}
            </button>

            <button
              onClick={() => setAbaAtiva('usuarios')}
              className={`pb-4 font-label text-base transition-colors relative cursor-pointer ${
                abaAtiva === 'usuarios'
                  ? 'text-primary font-bold'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              Gerenciar Usuários (Corretores)
              {abaAtiva === 'usuarios' && (
                <span className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-primary rounded-t-full"></span>
              )}
            </button>

            <button
              onClick={() => setAbaAtiva('tabelas')}
              className={`pb-4 font-label text-base transition-colors relative cursor-pointer ${
                abaAtiva === 'tabelas'
                  ? 'text-primary font-bold'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              Tabelas do Sistema
              {abaAtiva === 'tabelas' && (
                <span className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-primary rounded-t-full"></span>
              )}
            </button>
          </div>

          {/* Conteúdo da Aba: Gerenciar Usuários */}
          {abaAtiva === 'usuarios' && (
            <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-outline-variant/20">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                {/* Search Filter */}
                <div className="relative w-full sm:w-80">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-sm">
                    search
                  </span>
                  <input
                    className="w-full bg-surface-container rounded-full py-2 pl-9 pr-4 text-sm border-none focus:ring-1 focus:ring-primary text-on-surface placeholder:text-secondary"
                    placeholder="Buscar corretor por nome ou email..."
                    type="text"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                  />
                </div>

                {/* Action Button */}
                <button
                  onClick={() => alert('Modal para convidar novo corretor!')}
                  className="bg-primary hover:bg-primary/90 text-on-primary font-label font-medium py-2 px-6 rounded-full flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap cursor-pointer shadow-sm"
                >
                  <span className="material-symbols-outlined text-sm">
                    add
                  </span>
                  Convidar Novo Corretor
                </button>
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low text-secondary text-sm">
                      <th className="py-3 px-6 font-medium border-b border-outline-variant/20">
                        Nome
                      </th>
                      <th className="py-3 px-6 font-medium border-b border-outline-variant/20">
                        E-mail
                      </th>
                      <th className="py-3 px-6 font-medium border-b border-outline-variant/20">
                        Status
                      </th>
                      <th className="py-3 px-6 font-medium border-b border-outline-variant/20">
                        Nível de Acesso
                      </th>
                      <th className="py-3 px-6 font-medium border-b border-outline-variant/20 text-right">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    <tr className="border-b border-outline-variant/10 hover:bg-surface-container-lowest/50 transition-colors">
                      <td className="py-4 px-6 text-on-surface">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-medium text-xs">
                            RO
                          </div>
                          <span className="font-medium text-on-surface">
                            Ricardo Oliveira
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-secondary">
                        ricardo.o@terranova.com.br
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-container/30 text-primary text-xs font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>{' '}
                          Ativo
                        </span>
                      </td>
                      <td className="py-4 px-6 text-on-surface">Admin</td>
                      <td className="py-4 px-6 text-right">
                        <button
                          className="text-secondary hover:text-primary transition-colors cursor-pointer"
                          title="Editar permissões"
                        >
                          <span className="material-symbols-outlined text-lg">
                            settings
                          </span>
                        </button>
                      </td>
                    </tr>

                    <tr className="border-b border-outline-variant/10 hover:bg-surface-container-lowest/50 transition-colors">
                      <td className="py-4 px-6 text-on-surface">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-tertiary-container/30 flex items-center justify-center text-on-tertiary-container font-medium text-xs">
                            MC
                          </div>
                          <span className="font-medium text-on-surface">
                            Mariana Costa
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-secondary">
                        mariana.costa@terranova.com.br
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-container/30 text-primary text-xs font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>{' '}
                          Ativo
                        </span>
                      </td>
                      <td className="py-4 px-6 text-on-surface">Corretor</td>
                      <td className="py-4 px-6 text-right">
                        <button
                          className="text-secondary hover:text-primary transition-colors cursor-pointer"
                          title="Editar permissões"
                        >
                          <span className="material-symbols-outlined text-lg">
                            settings
                          </span>
                        </button>
                      </td>
                    </tr>

                    <tr className="border-b border-outline-variant/10 hover:bg-surface-container-lowest/50 transition-colors">
                      <td className="py-4 px-6 text-on-surface">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface font-medium text-xs">
                            JS
                          </div>
                          <span className="font-medium text-on-surface">
                            João Silva
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-secondary">
                        joao.silva@terranova.com.br
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-xs font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-outline"></span>{' '}
                          Inativo
                        </span>
                      </td>
                      <td className="py-4 px-6 text-on-surface">Corretor</td>
                      <td className="py-4 px-6 text-right">
                        <button
                          className="text-secondary hover:text-primary transition-colors cursor-pointer"
                          title="Editar permissões"
                        >
                          <span className="material-symbols-outlined text-lg">
                            settings
                          </span>
                        </button>
                      </td>
                    </tr>

                    <tr className="border-b border-outline-variant/10 hover:bg-surface-container-lowest/50 transition-colors">
                      <td className="py-4 px-6 text-on-surface">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-tertiary-container/30 flex items-center justify-center text-on-tertiary-container font-medium text-xs">
                            FL
                          </div>
                          <span className="font-medium text-on-surface">
                            Fernanda Lima
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-secondary">
                        fernanda.l@terranova.com.br
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-container/30 text-primary text-xs font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>{' '}
                          Ativo
                        </span>
                      </td>
                      <td className="py-4 px-6 text-on-surface">
                        Corretor Senior
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          className="text-secondary hover:text-primary transition-colors cursor-pointer"
                          title="Editar permissões"
                        >
                          <span className="material-symbols-outlined text-lg">
                            settings
                          </span>
                        </button>
                      </td>
                    </tr>

                    <tr className="hover:bg-surface-container-lowest/50 transition-colors">
                      <td className="py-4 px-6 text-on-surface">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-medium text-xs">
                            PA
                          </div>
                          <span className="font-medium text-on-surface">
                            Paulo Almeida
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-secondary">
                        paulo.almeida@terranova.com.br
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-container/30 text-primary text-xs font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>{' '}
                          Ativo
                        </span>
                      </td>
                      <td className="py-4 px-6 text-on-surface">
                        Suporte Técnico
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          className="text-secondary hover:text-primary transition-colors cursor-pointer"
                          title="Editar permissões"
                        >
                          <span className="material-symbols-outlined text-lg">
                            settings
                          </span>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="mt-6 flex items-center justify-between text-sm text-secondary pt-4">
                <span>Mostrando 1 a 5 de 12 corretores</span>
                <div className="flex gap-2">
                  <button
                    className="p-1 rounded hover:bg-surface-container transition-colors disabled:opacity-50 cursor-pointer"
                    disabled
                  >
                    <span className="material-symbols-outlined text-base">
                      chevron_left
                    </span>
                  </button>
                  <button className="p-1 rounded hover:bg-surface-container transition-colors cursor-pointer">
                    <span className="material-symbols-outlined text-base">
                      chevron_right
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {abaAtiva === 'geral' && (
            <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-outline-variant/20">
              <h3 className="font-headline text-xl text-primary font-bold mb-2">
                Configurações Gerais
              </h3>
              <p className="text-secondary text-sm">
                Ajustes de tema, notificações do WhatsApp e dados da empresa.
              </p>
            </div>
          )}

          {abaAtiva === 'tabelas' && (
            <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-outline-variant/20">
              <h3 className="font-headline text-xl text-primary font-bold mb-2">
                Tabelas do Sistema
              </h3>
              <p className="text-secondary text-sm">
                Gerenciamento de moedas, taxas de comissão e commodities padrão.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}