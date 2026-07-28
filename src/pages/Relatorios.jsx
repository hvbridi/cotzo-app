import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Relatorios() {
  const navigate = useNavigate()

  // Estados dos Filtros
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [corretor, setCorretor] = useState('Todos os Corretores')
  const [commodity, setCommodity] = useState('Todas as Commodities')

  const handleExportarExcel = () => {
    alert(
      `Solicitando exportação para Excel via Backend (Pandas)!\nFiltros: ${corretor} | ${commodity}`
    )
  }

  return (
    <div className="bg-background text-on-background antialiased min-h-screen flex animate-fade-in">
      {/* SideNavBar Padronizada Identica ao Resto do Sistema */}
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

        {/* Links NAVEGÁVEIS */}
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
            className="flex items-center px-4 py-3 bg-primary-container text-on-primary-container rounded-lg font-semibold font-body text-label-lg active:scale-95 transition-transform duration-150"
          >
            <span
              className="material-symbols-outlined mr-3"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              assessment
            </span>
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

      {/* Main Wrapper */}
      <div className="flex-1 flex flex-col min-h-screen md:ml-72">
        {/* TopAppBar Padronizada */}
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

        {/* Canvas / Main Content */}
        <main className="flex-1 mt-16 p-8 overflow-y-auto max-w-7xl w-full">
          <div className="space-y-8">
            {/* Page Header & Breadcrumb */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-label text-on-surface-variant">
                <Link
                  to="/dashboard"
                  className="hover:text-primary transition-colors"
                >
                  Dashboard
                </Link>
                <span className="material-symbols-outlined text-base">
                  chevron_right
                </span>
                <span className="text-primary font-medium">Relatórios</span>
              </div>
              <h2 className="font-headline text-3xl font-bold text-on-surface">
                Relatórios de Fechamentos
              </h2>
            </div>

            {/* Filter Card */}
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_4px_20px_rgba(46,50,48,0.06)] border border-outline-variant/30">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                <div className="space-y-2 lg:col-span-1">
                  <label className="block font-label text-sm font-semibold text-on-surface-variant">
                    Período
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        className="w-full bg-surface-container-low border-none rounded-lg text-body-md font-body focus:ring-2 focus:ring-primary text-on-surface py-2.5 px-3"
                        type="date"
                        value={dataInicio}
                        onChange={(e) => setDataInicio(e.target.value)}
                      />
                    </div>
                    <span className="text-on-surface-variant">até</span>
                    <div className="relative flex-1">
                      <input
                        className="w-full bg-surface-container-low border-none rounded-lg text-body-md font-body focus:ring-2 focus:ring-primary text-on-surface py-2.5 px-3"
                        type="date"
                        value={dataFim}
                        onChange={(e) => setDataFim(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block font-label text-sm font-semibold text-on-surface-variant">
                    Corretor
                  </label>
                  <select
                    className="w-full bg-surface-container-low border-none rounded-lg text-body-md font-body focus:ring-2 focus:ring-primary text-on-surface py-2.5 px-3 appearance-none"
                    value={corretor}
                    onChange={(e) => setCorretor(e.target.value)}
                  >
                    <option>Todos os Corretores</option>
                    <option>João Silva</option>
                    <option>Maria Souza</option>
                    <option>Carlos Oliveira</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block font-label text-sm font-semibold text-on-surface-variant">
                    Commodity
                  </label>
                  <select
                    className="w-full bg-surface-container-low border-none rounded-lg text-body-md font-body focus:ring-2 focus:ring-primary text-on-surface py-2.5 px-3 appearance-none"
                    value={commodity}
                    onChange={(e) => setCommodity(e.target.value)}
                  >
                    <option>Todas as Commodities</option>
                    <option>Soja</option>
                    <option>Milho</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 lg:justify-end h-[44px]">
                  <button className="flex-1 lg:flex-none bg-secondary text-on-secondary hover:bg-secondary/90 font-label font-semibold py-2.5 px-6 rounded-lg transition-colors shadow-sm cursor-pointer">
                    Filtrar
                  </button>
                  <button
                    onClick={handleExportarExcel}
                    className="flex-1 lg:flex-none bg-surface border border-primary text-primary hover:bg-primary-container/20 font-label font-semibold py-2.5 px-6 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">
                      download
                    </span>
                    Exportar
                  </button>
                </div>
              </div>
            </div>

            {/* Data Grid Section */}
            <div className="bg-surface-container-lowest rounded-xl shadow-[0_4px_20px_rgba(46,50,48,0.06)] border border-outline-variant/30 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-body">
                  <thead className="bg-surface-container/50 border-b border-surface-variant/50 text-sm text-on-surface-variant uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Data</th>
                      <th className="px-6 py-4 font-semibold">Corretor</th>
                      <th className="px-6 py-4 font-semibold">Produtor</th>
                      <th className="px-6 py-4 font-semibold text-right">
                        Volume (t)
                      </th>
                      <th className="px-6 py-4 font-semibold text-right">
                        Preço Unit.
                      </th>
                      <th className="px-6 py-4 font-semibold text-center">
                        Moeda
                      </th>
                      <th className="px-6 py-4 font-semibold">Entrega</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-variant/30 text-on-surface">
                    <tr className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-6 py-4">12/10/2023</td>
                      <td className="px-6 py-4">João Silva</td>
                      <td className="px-6 py-4 font-medium">
                        Fazenda Bela Vista
                      </td>
                      <td className="px-6 py-4 text-right">5.000</td>
                      <td className="px-6 py-4 text-right">R$ 145,00</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-tertiary-container/30 text-tertiary">
                          BRL
                        </span>
                      </td>
                      <td className="px-6 py-4">Fev 2024</td>
                    </tr>
                    <tr className="bg-surface-container-lowest hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-6 py-4">11/10/2023</td>
                      <td className="px-6 py-4">Maria Souza</td>
                      <td className="px-6 py-4 font-medium">
                        Agropecuária Sul
                      </td>
                      <td className="px-6 py-4 text-right">2.500</td>
                      <td className="px-6 py-4 text-right">US$ 12,50</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary-container/40 text-on-primary-container">
                          USD
                        </span>
                      </td>
                      <td className="px-6 py-4">Mar 2024</td>
                    </tr>
                    <tr className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-6 py-4">10/10/2023</td>
                      <td className="px-6 py-4">João Silva</td>
                      <td className="px-6 py-4 font-medium">
                        Irmãos Oliveira
                      </td>
                      <td className="px-6 py-4 text-right">10.000</td>
                      <td className="px-6 py-4 text-right">R$ 142,50</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-tertiary-container/30 text-tertiary">
                          BRL
                        </span>
                      </td>
                      <td className="px-6 py-4">Abr 2024</td>
                    </tr>
                    <tr className="bg-surface-container-lowest hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-6 py-4">08/10/2023</td>
                      <td className="px-6 py-4">Carlos Oliveira</td>
                      <td className="px-6 py-4 font-medium">Grupo São João</td>
                      <td className="px-6 py-4 text-right">800</td>
                      <td className="px-6 py-4 text-right">R$ 148,00</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-tertiary-container/30 text-tertiary">
                          BRL
                        </span>
                      </td>
                      <td className="px-6 py-4">Dez 2023</td>
                    </tr>
                    <tr className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-6 py-4">05/10/2023</td>
                      <td className="px-6 py-4">Maria Souza</td>
                      <td className="px-6 py-4 font-medium">
                        Fazenda Esperança
                      </td>
                      <td className="px-6 py-4 text-right">3.200</td>
                      <td className="px-6 py-4 text-right">US$ 12,80</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary-container/40 text-on-primary-container">
                          USD
                        </span>
                      </td>
                      <td className="px-6 py-4">Mai 2024</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-surface-container-lowest border-t border-surface-variant/50 px-6 py-4 flex items-center justify-between">
                <div className="text-sm text-on-surface-variant font-body">
                  Mostrando <span className="font-semibold text-on-surface">1</span> a{' '}
                  <span className="font-semibold text-on-surface">5</span> de{' '}
                  <span className="font-semibold text-on-surface">42</span> resultados
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-50"
                    disabled
                  >
                    <span className="material-symbols-outlined text-sm">
                      chevron_left
                    </span>
                  </button>
                  <button className="w-8 h-8 rounded-lg bg-primary text-on-primary font-semibold text-sm flex items-center justify-center">
                    1
                  </button>
                  <button className="w-8 h-8 rounded-lg text-on-surface hover:bg-surface-container transition-colors font-medium text-sm flex items-center justify-center">
                    2
                  </button>
                  <button className="w-8 h-8 rounded-lg text-on-surface hover:bg-surface-container transition-colors font-medium text-sm flex items-center justify-center">
                    3
                  </button>
                  <span className="text-on-surface-variant mx-1">...</span>
                  <button className="w-8 h-8 rounded-lg text-on-surface hover:bg-surface-container transition-colors font-medium text-sm flex items-center justify-center">
                    9
                  </button>
                  <button className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors">
                    <span className="material-symbols-outlined text-sm">
                      chevron_right
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}