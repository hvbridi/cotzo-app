import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiFetch } from '../services/api'

export default function Empresas() {
  const navigate = useNavigate()
  const [busca, setBusca] = useState('')
  const [empresas, setEmpresas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    async function carregarEmpresas() {
      try {
        const resposta = await apiFetch('/empresas/')
        if (!resposta.ok) {
          throw new Error('Falha ao carregar empresas do servidor.')
        }
        const dados = await resposta.json()
        setEmpresas(dados)
      } catch (err) {
        setErro(err.message)
      } finally {
        setCarregando(false)
      }
    }
    carregarEmpresas()
  }, [])

  const empresasFiltradas = empresas.filter((emp) => {
    const termo = busca.toLowerCase()
    const nome = (emp.razao_social || emp.nome || '').toLowerCase()
    const doc = (emp.cnpj || '').toLowerCase()
    return nome.includes(termo) || doc.includes(termo)
  })

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
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAXzrG1PTr-N-g3OrjHFglv0pdMaVUaNqcXT4YEJKuTUP-PhHC8zqrduDv0ym-mQF95YcnoExcceCN2DJAmKAPimEiryjzQs8qROYF2iUZUjyWDNq9xr59Nw1N9Bz8dUexormf9qTuta0lXuZCBI9s9L5JSy10lZ2yZNJmt4JDws-paCDg6pntp308Kmq94_GWwXnYKZFJTv9pLAEoNGSI92q9zdqSdyNujc3ap7ud9rWILp-DS1VdoU6Gg2Y8cll4i2vmCxNImrkE"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Canvas */}
        <main className="flex-1 mt-16 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <div className="flex items-center gap-2 text-sm font-label text-on-surface-variant mb-2">
                  <Link to="/cadastros" className="hover:text-primary transition-colors">
                    Central de Cadastros
                  </Link>
                  <span className="material-symbols-outlined text-base">chevron_right</span>
                  <span className="text-primary font-medium">Empresas</span>
                </div>
                <h2 className="font-headline text-3xl font-semibold text-on-background mb-1">
                  Empresas / Tradings
                </h2>
                <p className="text-secondary text-lg">
                  Gerencie o cadastro de empresas compradoras e tradings parceiras.
                </p>
              </div>
              <Link
                to="/cadastrar-empresa"
                className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2 transform active:scale-95 cursor-pointer self-start md:self-auto"
              >
                <span className="material-symbols-outlined">add</span>
                Nova Empresa
              </Link>
            </div>

            {/* Container da Tabela e Buscas */}
            <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 overflow-hidden">
              {/* Search Bar */}
              <div className="p-6 border-b border-outline-variant/20">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="relative w-full sm:max-w-md">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary text-sm">
                      search
                    </span>
                    <input
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm text-on-surface placeholder:text-secondary transition-all"
                      placeholder="Buscar por razão social ou CNPJ..."
                      type="text"
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                {carregando ? (
                  <div className="p-12 text-center text-secondary font-body">
                    Carregando empresas do banco de dados...
                  </div>
                ) : erro ? (
                  <div className="p-12 text-center text-error font-body">
                    {erro}
                  </div>
                ) : empresasFiltradas.length === 0 ? (
                  <div className="p-12 text-center text-secondary font-body">
                    Nenhuma empresa encontrada no banco de dados.
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low text-secondary text-sm">
                        <th className="py-3 px-6 font-medium border-b border-outline-variant/20 whitespace-nowrap">
                          ID
                        </th>
                        <th className="py-3 px-6 font-medium border-b border-outline-variant/20">
                          Razão Social / Nome
                        </th>
                        <th className="py-3 px-6 font-medium border-b border-outline-variant/20 whitespace-nowrap">
                          CNPJ
                        </th>
                        <th className="py-3 px-6 font-medium border-b border-outline-variant/20 whitespace-nowrap">
                          Cidade / UF
                        </th>
                        <th className="py-3 px-6 font-medium border-b border-outline-variant/20 text-right">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {empresasFiltradas.map((emp) => (
                        <tr
                          key={emp.id}
                          className="border-b border-outline-variant/10 hover:bg-surface-container-lowest/50 transition-colors"
                        >
                          <td className="py-4 px-6 font-mono text-secondary">
                            #{emp.id}
                          </td>
                          <td className="py-4 px-6 font-medium text-on-surface">
                            {emp.razao_social || emp.nome}
                          </td>
                          <td className="py-4 px-6 text-secondary">
                            {emp.cnpj || 'Não informado'}
                          </td>
                          <td className="py-4 px-6 text-on-surface">
                            {emp.cidade ? `${emp.cidade} - ${emp.estado}` : 'N/A'}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={() => navigate('/detalhes-empresa')}
                              className="text-primary hover:text-primary-container font-medium text-sm transition-colors cursor-pointer"
                            >
                              Ver Detalhes
                            </button>
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