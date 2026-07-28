import { Link, useNavigate } from 'react-router-dom'

export default function DetalhesEmpresa() {
  const navigate = useNavigate()

  return (
    <div className="bg-background text-on-background antialiased min-h-screen flex animate-fade-in">
      {/* SideNavBar Padronizada */}
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

        <div className="mt-auto space-y-1 pt-4 border-t border-outline-variant/20">
          <a
            href="#"
            className="flex items-center px-4 py-3 text-on-surface-variant hover:bg-surface-variant/50 rounded-lg font-body text-label-lg active:scale-95 transition-transform duration-150"
          >
            <span className="material-symbols-outlined mr-3">help</span>
            Suporte
          </a>
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center px-4 py-3 text-on-surface-variant hover:bg-surface-variant/50 rounded-lg font-body text-label-lg active:scale-95 transition-transform duration-150 text-left cursor-pointer"
          >
            <span className="material-symbols-outlined mr-3">logout</span>
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
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
              <div className="h-8 w-8 rounded-full bg-surface-variant overflow-hidden border border-outline-variant/30 ml-2">
                <img
                  alt="Broker Profile"
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAqLSTP9TUMT6qnyX28yGbHnCBW28h8xhkxc4oE4CaH5PxCucMyA0j4ZkabGoyIXIyL3gmM7QJCLkg7SErLDnaUuFclYdz5PRD51-bwTSVrGF0xZMMtICHrqLwJpsoEynv76AoPgRrUovOL5gvXu3CkQ9jKWbqJU0ELz1wjN7xYz8pzpiySUJJ9nFBdCR50_-q-alDabWdvGS2DjVLb1X14au8S5RDy_np0fq85M1cx2zUDd8Pl-dGfHS9dVJ_9ay4sT9f1rxBzCGA"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8 mt-16">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col w-full gap-8">
              {/* Top Navigation & Actions */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => navigate('/empresas')}
                    className="flex items-center gap-2 text-sm font-label text-primary hover:opacity-80 transition-opacity self-start cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      arrow_back
                    </span>
                    Voltar para a lista
                  </button>
                  <h1 className="text-3xl font-headline font-bold text-on-surface mt-2">
                    Cargill S/A
                  </h1>
                </div>
                <button
                  onClick={() => alert('Modal para editar dados corporativos!')}
                  className="flex items-center gap-2 bg-secondary-container px-5 py-2.5 rounded-xl text-on-secondary-container text-sm font-bold hover:bg-surface-container-highest transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    edit
                  </span>
                  Editar Dados
                </button>
              </div>

              {/* Grid 3 Colunas */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Coluna 1: Dados Corporativos e Histórico (1/3) */}
                <div className="flex flex-col gap-6 lg:col-span-1">
                  {/* Card Dados Corporativos */}
                  <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/20 flex flex-col gap-6">
                    <h2 className="text-lg font-headline font-bold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">
                        apartment
                      </span>
                      Dados Corporativos
                    </h2>
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-label uppercase tracking-wider text-outline-variant">
                          CNPJ
                        </span>
                        <span className="text-base font-body text-on-surface">
                          60.498.706/0001-57
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-label uppercase tracking-wider text-outline-variant">
                          Inscrição Estadual
                        </span>
                        <span className="text-base font-body text-on-surface">
                          112.345.678.901
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-label uppercase tracking-wider text-outline-variant">
                          Endereço Completo
                        </span>
                        <span className="text-base font-body text-on-surface leading-relaxed">
                          Av. Morumbi, 8234 - Brooklin
                          <br />
                          São Paulo - SP
                          <br />
                          CEP: 04703-002
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Histórico de Fechamentos */}
                  <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/20 flex flex-col gap-6 relative overflow-hidden">
                    <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary-fixed/20 rounded-full blur-2xl pointer-events-none"></div>
                    <h2 className="text-lg font-headline font-bold text-on-surface flex items-center gap-2 relative z-10">
                      <span className="material-symbols-outlined text-tertiary">
                        history
                      </span>
                      Histórico de Fechamentos
                    </h2>
                    <div className="bg-surface-container-low p-4 rounded-lg relative z-10">
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col">
                          <span className="text-sm font-label text-on-surface-variant">
                            Última compra
                          </span>
                          <span className="text-lg font-headline font-bold text-primary mt-1">
                            10.000 sacas
                          </span>
                          <span className="text-sm font-body text-on-surface mt-0.5">
                            Soja Convencional
                          </span>
                        </div>
                        <span className="text-xs font-label text-outline-variant">
                          Há 2 dias
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/relatorios')}
                      className="text-sm font-label text-primary font-bold self-start hover:opacity-80 transition-opacity flex items-center gap-1 relative z-10 cursor-pointer"
                    >
                      Ver histórico completo
                      <span className="material-symbols-outlined text-[16px]">
                        arrow_forward
                      </span>
                    </button>
                  </div>
                </div>

                {/* Coluna 2: Compradores e CTA Banner (2/3) */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                  <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/20 flex flex-col gap-6 flex-1">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-headline font-bold text-on-surface flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">
                          groups
                        </span>
                        Compradores / Contatos
                      </h2>
                      <button
                        onClick={() => alert('Adicionar novo comprador')}
                        className="flex items-center gap-2 bg-primary px-4 py-2 rounded-lg text-on-primary text-sm font-bold hover:opacity-90 transition-opacity shadow-sm shadow-primary/20 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          add
                        </span>
                        Adicionar
                      </button>
                    </div>

                    <div className="flex flex-col gap-3">
                      {/* Contact 1 */}
                      <div className="group flex items-center justify-between p-4 rounded-lg bg-surface hover:bg-surface-container transition-colors border border-outline-variant/10">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed font-headline font-bold">
                            RC
                          </div>
                          <div className="flex flex-col">
                            <span className="text-base font-body font-bold text-on-surface">
                              Roberto Costa
                            </span>
                            <span className="text-sm font-body text-outline">
                              Comprador Sênior - Soja
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="flex flex-col items-end gap-1">
                            <a
                              href="https://wa.me/5511987654321"
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 text-sm font-body text-on-surface hover:text-primary transition-colors"
                            >
                              <span className="material-symbols-outlined text-[#25D366] text-[16px]">
                                chat
                              </span>
                              (11) 98765-4321
                            </a>
                            <span className="text-sm font-body text-outline-variant">
                              roberto_costa@cargill.com
                            </span>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-2 rounded-full text-on-surface-variant hover:bg-secondary-container hover:text-on-secondary-container transition-colors cursor-pointer">
                              <span className="material-symbols-outlined text-[20px]">
                                edit
                              </span>
                            </button>
                            <button className="p-2 rounded-full text-outline hover:bg-error-container hover:text-on-error-container transition-colors cursor-pointer">
                              <span className="material-symbols-outlined text-[20px]">
                                delete
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Contact 2 */}
                      <div className="group flex items-center justify-between p-4 rounded-lg bg-surface hover:bg-surface-container transition-colors border border-outline-variant/10">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed font-headline font-bold">
                            AS
                          </div>
                          <div className="flex flex-col">
                            <span className="text-base font-body font-bold text-on-surface">
                              Ana Silva
                            </span>
                            <span className="text-sm font-body text-outline">
                              Gerente de Originação
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="flex flex-col items-end gap-1">
                            <a
                              href="https://wa.me/5511976543210"
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 text-sm font-body text-on-surface hover:text-primary transition-colors"
                            >
                              <span className="material-symbols-outlined text-[#25D366] text-[16px]">
                                chat
                              </span>
                              (11) 97654-3210
                            </a>
                            <span className="text-sm font-body text-outline-variant">
                              ana_silva@cargill.com
                            </span>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-2 rounded-full text-on-surface-variant hover:bg-secondary-container hover:text-on-secondary-container transition-colors cursor-pointer">
                              <span className="material-symbols-outlined text-[20px]">
                                edit
                              </span>
                            </button>
                            <button className="p-2 rounded-full text-outline hover:bg-error-container hover:text-on-error-container transition-colors cursor-pointer">
                              <span className="material-symbols-outlined text-[20px]">
                                delete
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Contact 3 */}
                      <div className="group flex items-center justify-between p-4 rounded-lg bg-surface hover:bg-surface-container transition-colors border border-outline-variant/10">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed font-headline font-bold">
                            ML
                          </div>
                          <div className="flex flex-col">
                            <span className="text-base font-body font-bold text-on-surface">
                              Marcos Lima
                            </span>
                            <span className="text-sm font-body text-outline">
                              Comprador - Milho
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="flex flex-col items-end gap-1">
                            <a
                              href="https://wa.me/5511965432109"
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 text-sm font-body text-on-surface hover:text-primary transition-colors"
                            >
                              <span className="material-symbols-outlined text-[#25D366] text-[16px]">
                                chat
                              </span>
                              (11) 96543-2109
                            </a>
                            <span className="text-sm font-body text-outline-variant">
                              marcos_lima@cargill.com
                            </span>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-2 rounded-full text-on-surface-variant hover:bg-secondary-container hover:text-on-secondary-container transition-colors cursor-pointer">
                              <span className="material-symbols-outlined text-[20px]">
                                edit
                              </span>
                            </button>
                            <button className="p-2 rounded-full text-outline hover:bg-error-container hover:text-on-error-container transition-colors cursor-pointer">
                              <span className="material-symbols-outlined text-[20px]">
                                delete
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Banner CTA "Pronto para um novo negócio?" */}
                  <div
                    className="w-full h-32 rounded-xl relative overflow-hidden bg-surface-container-low flex items-center justify-center p-6 bg-cover bg-center"
                    style={{
                      backgroundImage:
                        "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCB-Aw--qZG6jQvVGa4pPz4DlS-WXJY3Jc26NLHW9W_d0BkjN6W3IE-BqB_EDIPzoZp9bZROmoA2y4QsZKpkiXqZc-U1R33WS8prd-vjwfSwxBWcf0q1suu42F5upqtL5slkum_8ARjCEJ--Qz-yZ753dWkInKjlFcHX7xqhK0KdGujXZAqtlbtfn9VwVx0UcCurmrBxY12VdjJYFALCZaUh4Dwl10HBW06q5LQC3unszRvP9mPaEgjqwpggGtBvWCdKxTuXha3b6Q')"
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-surface-container-highest/90 to-surface-container-highest/60 backdrop-blur-sm z-0"></div>
                    <div className="relative z-10 w-full flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="font-headline font-bold text-on-surface text-xl">
                          Pronto para um novo negócio?
                        </span>
                        <span className="font-body text-on-surface-variant text-sm mt-1">
                          Inicie um novo fechamento com a Cargill S/A agora mesmo.
                        </span>
                      </div>
                      <button
                        onClick={() => navigate('/fechamento')}
                        className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold font-label shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-transform cursor-pointer"
                      >
                        Novo Fechamento
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}