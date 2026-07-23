import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Relatorios() {
  const navigate = useNavigate()

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
    <div className="bg-background text-on-background antialiased flex h-screen overflow-hidden">
      {/* SideNavBar */}
      <nav className="hidden md:flex h-screen w-64 fixed left-0 top-0 flex-col bg-surface-container dark:bg-inverse-surface border-r border-surface-container-highest/30 z-50">
        <div className="flex flex-col h-full py-4 space-y-2">
          <div className="px-6 mb-8 mt-2 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-on-primary text-xl">
                eco
              </span>
            </div>
            <div>
              <h1 className="font-headline text-lg font-bold text-primary dark:text-primary-fixed-dim leading-tight">
                Terra Nova
              </h1>
              <p className="font-body text-label-lg text-on-surface-variant leading-tight">
                AgroCapital
              </p>
            </div>
          </div>

          <div className="flex-1 px-2 space-y-1 overflow-y-auto">
            <Link
              to="/dashboard"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-secondary-container transition-all font-body text-label-lg"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 0" }}
              >
                dashboard
              </span>
              Dashboard
            </Link>
            <Link
              to="/fechamento"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-secondary-container transition-all font-body text-label-lg"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 0" }}
              >
                handshake
              </span>
              Novo Fechamento
            </Link>
            <Link
              to="/cadastros"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-secondary-container transition-all font-body text-label-lg"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 0" }}
              >
                person_book
              </span>
              Cadastros
            </Link>
            <Link
              to="/relatorios"
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary-container text-on-primary-container font-semibold transition-all font-body text-label-lg"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                assessment
              </span>
              Relatórios
            </Link>
            <Link
              to="/configuracoes"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-secondary-container transition-all font-body text-label-lg"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 0" }}
              >
                settings
              </span>
              Configurações
            </Link>
          </div>

          <div className="px-2 mt-auto space-y-1">
            <a
              href="#"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-secondary-container transition-all font-body text-label-lg"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 0" }}
              >
                support_agent
              </span>
              Suporte
            </a>
            <button
              onClick={() => navigate('/')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-secondary-container transition-all font-body text-label-lg text-left cursor-pointer"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 0" }}
              >
                logout
              </span>
              Sair
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:ml-64 w-full h-full overflow-hidden bg-background">
        <header className="w-full h-16 flex items-center px-6 sticky top-0 z-40 bg-surface dark:bg-surface-dim border-b border-surface-container-low shadow-sm">
          <div className="flex justify-between items-center w-full max-w-full">
            <div className="md:hidden flex items-center gap-2">
              <span className="font-headline text-xl font-bold text-primary">
                Terra Nova AgroCapital
              </span>
            </div>
            <div className="hidden md:flex flex-1 justify-end items-center gap-6">
              <div className="relative w-64 group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-on-surface-variant">
                  search
                </span>
                <input
                  className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-full text-body-md font-body focus:ring-2 focus:ring-primary focus:bg-surface transition-colors placeholder-on-surface-variant/70 text-on-surface"
                  placeholder="Buscar..."
                  type="text"
                />
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-full text-on-surface-variant hover:bg-secondary-container/50 transition-colors cursor-pointer">
                  <span className="material-symbols-outlined">
                    notifications
                  </span>
                </button>
                <button className="p-2 rounded-full text-on-surface-variant hover:bg-secondary-container/50 transition-colors cursor-pointer">
                  <span className="material-symbols-outlined">settings</span>
                </button>
              </div>
              <div className="pl-4 border-l border-surface-variant">
                <img
                  alt="Broker Profile"
                  className="w-9 h-9 rounded-full object-cover cursor-pointer shadow-sm hover:ring-2 ring-primary transition-all"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBwb9CEWKK5IEBZDMrAsjvbK-2wsMpL9K1DCH9rFmW5X5dmiYSXaxD6mv7wleoNwVGbsQ21oIAHgyYEcrghwvDYioM7GX4Oj3Z8UqZYa-1CUcmSNfheMsdYKY6seZCLYNbAeFCjghRgN8i0rxZ9q8mqyt_ofrZN0NZlrgolSO43ORsuoHqsSUP8BqX2_1Bc0hBZgl4ShKBX_7MklGCATvK-mSdWsbXeOyLYWTuDMsCLuVUeM4KYTUDJU4TlkvRwzK0YsoQBxrl5rDQ"
                />
              </div>
            </div>
            <button className="md:hidden p-2 text-on-surface-variant">
              <span className="material-symbols-outlined">menu</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-10 scroll-smooth">
          <div className="max-w-7xl mx-auto space-y-8">
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