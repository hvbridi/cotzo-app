import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Configuracoes() {
  const navigate = useNavigate()

  // Estados dos formulários de configurações
  const [nomeEmpresa, setNomeEmpresa] = useState('Terra Nova AgroCapital')
  const [cnpj, setCnpj] = useState('12.345.678/0001-90')
  const [notifEmail, setNotifEmail] = useState(true)
  const [notifWhatsapp, setNotifWhatsapp] = useState(true)

  const handleSalvar = (e) => {
    e.preventDefault()
    alert('Configurações salvas com sucesso!')
  }

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
            className="flex items-center px-4 py-3 text-on-surface-variant hover:bg-surface-variant/50 rounded-lg font-body text-label-lg active:scale-95 transition-transform duration-150"
          >
            <span className="material-symbols-outlined mr-3">person_book</span>
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
            className="flex items-center px-4 py-3 bg-primary-container text-on-primary-container rounded-lg font-semibold font-body text-label-lg active:scale-95 transition-transform duration-150"
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
              <div className="h-8 w-8 rounded-full bg-surface-variant overflow-hidden border border-outline-variant/30 ml-2 cursor-pointer">
                <img
                  alt="Broker Profile"
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAXzrG1PTr-N-g3OrjHFglv0pdMaVUaNqcXT4YEJKuTUP-PhHC8zqrduDv0ym-mQF95YcnoExcceCN2DJAmKAPimEiryjzQs8qROYF2iUZUjyWDNq9xr59Nw1N9Bz8dUexormf9qTuta0lXuZCBI9s9L5JSy10lZ2yZNJmt4JDws-paCDg6pntp308Kmq94_GWwXnYKZFJTv9pLAEoNGSI92q9zdqSdyNujc3ap7ud9rWILp-DS1VdoU6Gg2Y8cll4i2vmCxNImrkE"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Canvas */}
        <main className="flex-1 mt-16 p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-8">
            <div>
              <h2 className="text-3xl font-headline font-bold text-on-surface mb-1">
                Configurações do Sistema
              </h2>
              <p className="text-secondary text-lg">
                Gerencie as preferências da empresa, regras de negócio e integrações.
              </p>
            </div>

            <form onSubmit={handleSalvar} className="space-y-6">
              {/* Card 1: Dados da Empresa */}
              <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/20 space-y-4">
                <h3 className="text-xl font-headline font-semibold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">
                    business
                  </span>
                  Dados do Corretora
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-secondary mb-1">
                      Nome Comercial / Razão Social
                    </label>
                    <input
                      type="text"
                      className="w-full p-3 rounded-lg border border-outline-variant/40 bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                      value={nomeEmpresa}
                      onChange={(e) => setNomeEmpresa(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-secondary mb-1">
                      CNPJ
                    </label>
                    <input
                      type="text"
                      className="w-full p-3 rounded-lg border border-outline-variant/40 bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                      value={cnpj}
                      onChange={(e) => setCnpj(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Notificações & Integrações */}
              <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/20 space-y-4">
                <h3 className="text-xl font-headline font-semibold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">
                    notifications_active
                  </span>
                  Notificações & WhatsApp
                </h3>

                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 rounded-lg border border-outline-variant/20 hover:bg-surface-container-low transition-colors cursor-pointer">
                    <div>
                      <span className="font-semibold text-on-surface block">
                        Disparo automático via WhatsApp
                      </span>
                      <span className="text-xs text-secondary">
                        Enviar espelho de contrato no WhatsApp da trading ao salvar
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifWhatsapp}
                      onChange={(e) => setNotifWhatsapp(e.target.checked)}
                      className="w-5 h-5 accent-primary cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-lg border border-outline-variant/20 hover:bg-surface-container-low transition-colors cursor-pointer">
                    <div>
                      <span className="font-semibold text-on-surface block">
                        Notificações por E-mail
                      </span>
                      <span className="text-xs text-secondary">
                        Receber relatórios diários de fechamentos no e-mail do admin
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifEmail}
                      onChange={(e) => setNotifEmail(e.target.checked)}
                      className="w-5 h-5 accent-primary cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Botão Salvar */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-primary text-on-primary px-8 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-sm cursor-pointer active:scale-95"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}