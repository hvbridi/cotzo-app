import { Link, useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const navigate = useNavigate()

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
            className="flex items-center px-4 py-3 bg-primary-container text-on-primary-container rounded-lg font-semibold font-body text-label-lg active:scale-95 transition-transform"
          >
            <span
              className="material-symbols-outlined mr-3"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              dashboard
            </span>
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
            className="flex items-center px-4 py-3 text-on-surface-variant hover:bg-surface-variant/50 rounded-lg font-body text-label-lg active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined mr-3">settings</span>
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

      <div className="flex-1 flex flex-col min-h-screen md:ml-72">
        <header className="fixed top-0 right-0 h-16 z-40 bg-background/80 dark:bg-background/80 backdrop-blur-md border-b border-outline-variant/20 md:left-72">
          <div className="flex justify-between items-center px-8 h-full w-full">
            <div className="flex-1 flex items-center">
              <div className="relative w-64">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-sm">
                  search
                </span>
                <input
                  className="w-full bg-surface-container rounded-full py-1.5 pl-9 pr-4 text-sm border-none focus:ring-1 focus:ring-primary text-on-surface placeholder:text-secondary"
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
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAXzrG1PTr-N-g3OrjHFglv0pdMaVUaNqcXT4YEJKuTUP-PhHC8zqrduDv0ym-mQF95YcnoExcceCN2DJAmKAPimEiryjzQs8qROYF2iUZUjyWDNq9xr59Nw1N9Bz8dUexormf9qTuta0lXuZCBI9s9L5JSy10lZ2yZNJmt4JDws-paCDg6pntp308Kmq94_GWwXnYKZFJTv9pLAEoNGSI92q9zdqSdyNujc3ap7ud9rWILp-DS1VdoU6Gg2Y8cll4i2vmCxNImrkE"
                />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 mt-16 p-8 overflow-y-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-headline font-semibold text-on-background mb-1">
              Bem-vindo, João Silva
            </h2>
            <p className="text-secondary text-lg">12 de Outubro de 2023</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/20 hover:border-primary/30 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-secondary-container text-on-secondary-container rounded-lg">
                  <span
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    description
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-secondary mb-1">
                  Total de Contratos (Mês)
                </p>
                <p className="text-3xl font-headline font-bold text-on-surface">
                  124
                </p>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/20 hover:border-primary/30 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-primary-container text-on-primary-container rounded-lg">
                  <span
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    agriculture
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-secondary mb-1">
                  Volume Negociado (Sacas)
                </p>
                <p className="text-3xl font-headline font-bold text-primary">
                  45.200
                </p>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/20 hover:border-primary/30 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-tertiary-container text-on-tertiary-container rounded-lg">
                  <span
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    payments
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-secondary mb-1">
                  Comissão Projetada (R$)
                </p>
                <p className="text-3xl font-headline font-bold text-on-surface">
                  R$ 85.400,00
                </p>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/20 hover:border-primary/30 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-error-container text-on-error-container rounded-lg">
                  <span
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    timer
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-secondary mb-1">
                  Contratos Pendentes
                </p>
                <p className="text-3xl font-headline font-bold text-on-surface">
                  8
                </p>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 overflow-hidden">
            <div className="px-6 py-5 border-b border-outline-variant/20 flex justify-between items-center bg-surface-container-lowest">
              <h3 className="text-xl font-headline font-semibold text-on-surface">
                Últimos Fechamentos
              </h3>
              <button className="text-sm font-medium text-primary hover:text-primary-container transition-colors cursor-pointer">
                Ver todos
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low text-secondary text-sm">
                    <th className="py-3 px-6 font-medium border-b border-outline-variant/20">
                      Data
                    </th>
                    <th className="py-3 px-6 font-medium border-b border-outline-variant/20">
                      Produtor
                    </th>
                    <th className="py-3 px-6 font-medium border-b border-outline-variant/20">
                      Comprador
                    </th>
                    <th className="py-3 px-6 font-medium border-b border-outline-variant/20 text-right">
                      Volume (Sacas)
                    </th>
                    <th className="py-3 px-6 font-medium border-b border-outline-variant/20 text-center">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b border-outline-variant/10 hover:bg-surface-container-lowest/50 transition-colors">
                    <td className="py-4 px-6 text-on-surface">12/10/2023</td>
                    <td className="py-4 px-6 font-medium text-on-surface">
                      Fazenda Santa Helena
                    </td>
                    <td className="py-4 px-6 text-secondary">Cargill</td>
                    <td className="py-4 px-6 text-right font-medium text-on-surface">
                      5.000
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-container/30 text-primary">
                        Concluído
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b border-outline-variant/10 hover:bg-surface-container-lowest/50 transition-colors">
                    <td className="py-4 px-6 text-on-surface">11/10/2023</td>
                    <td className="py-4 px-6 font-medium text-on-surface">
                      João Pereira
                    </td>
                    <td className="py-4 px-6 text-secondary">Bunge</td>
                    <td className="py-4 px-6 text-right font-medium text-on-surface">
                      2.500
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-container text-on-secondary-container">
                        Em Análise
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-lowest/50 transition-colors">
                    <td className="py-4 px-6 text-on-surface">10/10/2023</td>
                    <td className="py-4 px-6 font-medium text-on-surface">
                      Agropecuária Vale
                    </td>
                    <td className="py-4 px-6 text-secondary">Amaggi</td>
                    <td className="py-4 px-6 text-right font-medium text-on-surface">
                      8.000
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-tertiary-container/30 text-tertiary">
                        Pendente
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}