import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiFetch } from '../services/api'

export default function Relatorios() {
  const navigate = useNavigate()

  // Dados do Banco
  const [contratos, setContratos] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [produtores, setProdutores] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [exportando, setExportando] = useState(false)
  const [erro, setErro] = useState('')

  // Estados dos Filtros
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [corretorId, setCorretorId] = useState('Todos')
  const [commodity, setCommodity] = useState('Todas')

  // Carregar dados iniciais do banco
  useEffect(() => {
    async function carregarDados() {
      setCarregando(true)
      try {
        const [resContratos, resUsuarios, resProdutores] = await Promise.all([
          apiFetch('/contratos/'),
          apiFetch('/usuarios/'),
          apiFetch('/produtores/'),
        ])

        if (resContratos.ok) setContratos(await resContratos.json())
        if (resUsuarios.ok) setUsuarios(await resUsuarios.json())
        if (resProdutores.ok) setProdutores(await resProdutores.json())
      } catch (err) {
        setErro('Erro ao carregar relatórios do banco de dados.')
      } finally {
        setCarregando(false)
      }
    }

    carregarDados()
  }, [])

  // Mapeadores auxiliares para pegar Nome por ID
  const getNomeCorretor = (id) => {
    const user = usuarios.find((u) => u.id === id)
    return user ? user.nome : `Corretor #${id}`
  }

  const getNomeProdutor = (id) => {
    const prod = produtores.find((p) => p.id === id)
    return prod ? prod.nome : `Produtor #${id}`
  }

  // Filtragem dos contratos na memória
  const contratosFiltrados = contratos.filter((c) => {
    // Filtro de Data Início
    if (dataInicio && c.data_fechamento < dataInicio) return false

    // Filtro de Data Fim
    if (dataFim && c.data_fechamento > dataFim) return false

    // Filtro de Corretor
    if (corretorId !== 'Todos' && String(c.usuario_id) !== String(corretorId)) {
      return false
    }

    // Filtro de Commodity
    if (commodity !== 'Todas' && c.commodity !== commodity) return false

    return true
  })

  // Exportação para Excel via Backend (Pandas)
  const handleExportarExcel = async () => {
    setExportando(true)
    try {
      const resposta = await apiFetch('/exportar-excel/')
      if (!resposta.ok) {
        throw new Error('Erro ao gerar o arquivo Excel no servidor.')
      }

      const blob = await resposta.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'banco_de_dados_corretora.xlsx'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert(err.message)
    } finally {
      setExportando(false)
    }
  }

  return (
    <div className="bg-background text-on-background antialiased h-screen overflow-hidden flex animate-fade-in font-body">
      {/* SideNavBar Fixa */}
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

        {/* Links NAVEGÁVEIS */}
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

        <div className="mt-auto space-y-1 pt-4 border-t border-outline-variant/20 shrink-0">
          <a
            href="#"
            className="flex items-center px-4 py-3 text-on-surface-variant hover:bg-surface-variant/50 rounded-lg font-body text-label-lg active:scale-95 transition-transform duration-150"
          >
            <span className="material-symbols-outlined mr-3">help</span>
            Suporte
          </a>
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
      <div className="flex-1 flex flex-col h-full md:ml-72 overflow-hidden">
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
          <div className="space-y-8 pb-16">
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
                {/* Período */}
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

                {/* Corretor */}
                <div className="space-y-2">
                  <label className="block font-label text-sm font-semibold text-on-surface-variant">
                    Corretor
                  </label>
                  <select
                    className="w-full bg-surface-container-low border-none rounded-lg text-body-md font-body focus:ring-2 focus:ring-primary text-on-surface py-2.5 px-3 appearance-none cursor-pointer"
                    value={corretorId}
                    onChange={(e) => setCorretorId(e.target.value)}
                  >
                    <option value="Todos">Todos os Corretores</option>
                    {usuarios.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Commodity */}
                <div className="space-y-2">
                  <label className="block font-label text-sm font-semibold text-on-surface-variant">
                    Commodity
                  </label>
                  <select
                    className="w-full bg-surface-container-low border-none rounded-lg text-body-md font-body focus:ring-2 focus:ring-primary text-on-surface py-2.5 px-3 appearance-none cursor-pointer"
                    value={commodity}
                    onChange={(e) => setCommodity(e.target.value)}
                  >
                    <option value="Todas">Todas as Commodities</option>
                    <option value="Soja">Soja</option>
                    <option value="Milho">Milho</option>
                    <option value="Algodão">Algodão</option>
                  </select>
                </div>

                {/* Botões */}
                <div className="flex items-center gap-3 lg:justify-end h-[44px]">
                  <button
                    type="button"
                    onClick={() => {
                      setDataInicio('')
                      setDataFim('')
                      setCorretorId('Todos')
                      setCommodity('Todas')
                    }}
                    className="flex-1 lg:flex-none bg-surface-container-high text-on-surface hover:bg-surface-variant font-label font-semibold py-2.5 px-4 rounded-lg transition-colors shadow-sm cursor-pointer text-sm"
                  >
                    Limpar
                  </button>
                  <button
                    type="button"
                    onClick={handleExportarExcel}
                    disabled={exportando}
                    className="flex-1 lg:flex-none bg-surface border border-primary text-primary hover:bg-primary-container/20 font-label font-semibold py-2.5 px-6 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer text-sm disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm">
                      download
                    </span>
                    {exportando ? 'Exportando...' : 'Exportar Excel'}
                  </button>
                </div>
              </div>
            </div>

            {/* Data Grid Section */}
            <div className="bg-surface-container-lowest rounded-xl shadow-[0_4px_20px_rgba(46,50,48,0.06)] border border-outline-variant/30 overflow-hidden">
              <div className="overflow-x-auto">
                {carregando ? (
                  <div className="p-12 text-center text-secondary font-body">
                    Carregando relatórios do banco de dados...
                  </div>
                ) : erro ? (
                  <div className="p-12 text-center text-error font-body">
                    {erro}
                  </div>
                ) : contratosFiltrados.length === 0 ? (
                  <div className="p-12 text-center text-secondary font-body">
                    Nenhum contrato encontrado para os filtros selecionados.
                  </div>
                ) : (
                  <table className="w-full text-left font-body border-collapse">
                    <thead className="bg-surface-container/50 border-b border-surface-variant/50 text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="px-6 py-4">ID</th>
                        <th className="px-6 py-4">Data</th>
                        <th className="px-6 py-4">Corretor</th>
                        <th className="px-6 py-4">Produtor</th>
                        <th className="px-6 py-4">Commodity</th>
                        <th className="px-6 py-4 text-right">Volume</th>
                        <th className="px-6 py-4 text-right">Preço Unit.</th>
                        <th className="px-6 py-4 text-center">Moeda</th>
                        <th className="px-6 py-4">Entrega</th>
                        <th className="px-6 py-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-variant/30 text-sm text-on-surface">
                      {contratosFiltrados.map((c) => (
                        <tr
                          key={c.id}
                          className="hover:bg-surface-container-low/50 transition-colors"
                        >
                          <td className="px-6 py-4 font-mono text-secondary">
                            #{c.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {c.data_fechamento}
                          </td>
                          <td className="px-6 py-4 font-medium whitespace-nowrap">
                            {getNomeCorretor(c.usuario_id)}
                          </td>
                          <td className="px-6 py-4 font-medium whitespace-nowrap">
                            {getNomeProdutor(c.produtor_id)}
                          </td>
                          <td className="px-6 py-4 font-semibold">
                            {c.commodity}
                          </td>
                          <td className="px-6 py-4 text-right font-mono whitespace-nowrap">
                            {Number(c.volume).toLocaleString('pt-BR')}{' '}
                            <span className="text-xs text-secondary font-normal">
                              {c.tipo_medida}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-mono whitespace-nowrap">
                            {c.moeda === 'USD' ? '$' : 'R$'}{' '}
                            {Number(c.preco_unitario).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                                c.moeda === 'USD'
                                  ? 'bg-primary-container/40 text-on-primary-container'
                                  : 'bg-tertiary-container/30 text-tertiary'
                              }`}
                            >
                              {c.moeda || 'BRL'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-secondary">
                            {c.data_entrega || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <Link
                              to={`/detalhes-contrato?id=${c.id}`}
                              className="text-primary hover:text-primary/80 font-bold text-xs inline-flex items-center gap-1 transition-colors"
                            >
                              Ver mais
                              <span className="material-symbols-outlined text-sm">
                                chevron_right
                              </span>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Tabela Footer / Contador */}
              <div className="bg-surface-container-lowest border-t border-surface-variant/50 px-6 py-4 flex items-center justify-between text-sm text-on-surface-variant">
                <div>
                  Mostrando{' '}
                  <span className="font-semibold text-on-surface">
                    {contratosFiltrados.length}
                  </span>{' '}
                  de{' '}
                  <span className="font-semibold text-on-surface">
                    {contratos.length}
                  </span>{' '}
                  contratos emitidos
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}