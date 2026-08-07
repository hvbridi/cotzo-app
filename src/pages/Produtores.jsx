import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiFetch } from '../services/api'

export default function Produtores() {
  const navigate = useNavigate()
  const [busca, setBusca] = useState('')
  const [produtores, setProdutores] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  // Estados do Modal de Novo Produtor
  const [modalAberto, setModalAberto] = useState(false)
  const [nome, setNome] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [cpfCnpj, setCpfCnpj] = useState('')
  const [cidade, setCidade] = useState('')
  const [uf, setUf] = useState('')
  const [salvando, setSalvando] = useState(false)

  // Carregar produtores do backend
  const carregarProdutores = async () => {
    setCarregando(true)
    try {
      const resposta = await apiFetch('/produtores/')
      if (!resposta.ok) {
        throw new Error('Falha ao buscar produtores no servidor.')
      }
      const dados = await resposta.json()
      setProdutores(dados)
    } catch (err) {
      setErro(err.message)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarProdutores()
  }, [])

  // Cadastrar produtor com os campos exatos do novo modelo_tabela.py
  const handleCadastrarProdutor = async (e) => {
    e.preventDefault()
    setSalvando(true)

    try {
      const resposta = await apiFetch('/produtores/', {
        method: 'POST',
        body: JSON.stringify({
          nome,
          whatsapp,
          cpf_cnpj: cpfCnpj || null,
          cidade: cidade || null,
          uf: uf || null,
        }),
      })

      if (!resposta.ok) {
        throw new Error('Erro ao salvar produtor no banco de dados.')
      }

      alert('Produtor cadastrado com sucesso!')
      setModalAberto(false)
      setNome('')
      setWhatsapp('')
      setCpfCnpj('')
      setCidade('')
      setUf('')
      carregarProdutores()
    } catch (err) {
      alert(err.message)
    } finally {
      setSalvando(false)
    }
  }

  const produtoresFiltrados = produtores.filter((p) => {
    const termo = busca.toLowerCase()
    const nomeProd = (p.nome || '').toLowerCase()
    const doc = (p.cpf_cnpj || '').toLowerCase()
    const zap = (p.whatsapp || '').toLowerCase()
    return nomeProd.includes(termo) || doc.includes(termo) || zap.includes(termo)
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
        <header className="fixed top-0 right-0 h-16 z-40 bg-background/80 backdrop-blur-md border-b border-outline-variant/20 md:left-72">
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

        {/* Content Canvas */}
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
                  <span className="text-primary font-medium">Produtores</span>
                </div>
                <h2 className="font-headline text-3xl font-semibold text-on-background mb-1">
                  Produtores Rurais
                </h2>
                <p className="text-secondary text-lg">
                  Gerencie os produtores rurais parceiros do sistema.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setModalAberto(true)}
                  className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2 active:scale-95 cursor-pointer"
                >
                  <span className="material-symbols-outlined">person_add</span>
                  Novo Produtor
                </button>
                <Link
                  to="/cadastrar-fazenda"
                  className="bg-secondary-container text-on-secondary-container px-6 py-3 rounded-xl font-bold hover:bg-surface-container-highest transition-colors shadow-sm flex items-center gap-2 active:scale-95 cursor-pointer"
                >
                  <span className="material-symbols-outlined">landscape</span>
                  Nova Fazenda
                </Link>
              </div>
            </div>

            {/* Container da Tabela */}
            <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 overflow-hidden">
              <div className="p-6 border-b border-outline-variant/20">
                <div className="relative w-full sm:max-w-md">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary text-sm">
                    search
                  </span>
                  <input
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm text-on-surface placeholder:text-secondary transition-all"
                    placeholder="Buscar por nome, CPF/CNPJ ou WhatsApp..."
                    type="text"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                {carregando ? (
                  <div className="p-12 text-center text-secondary font-body">
                    Carregando produtores do banco de dados...
                  </div>
                ) : erro ? (
                  <div className="p-12 text-center text-error font-body">
                    {erro}
                  </div>
                ) : produtoresFiltrados.length === 0 ? (
                  <div className="p-12 text-center text-secondary font-body">
                    Nenhum produtor encontrado no banco de dados.
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low text-secondary text-sm">
                        <th className="py-3 px-6 font-medium border-b border-outline-variant/20">ID</th>
                        <th className="py-3 px-6 font-medium border-b border-outline-variant/20">Nome do Produtor</th>
                        <th className="py-3 px-6 font-medium border-b border-outline-variant/20">CPF / CNPJ</th>
                        <th className="py-3 px-6 font-medium border-b border-outline-variant/20">WhatsApp</th>
                        <th className="py-3 px-6 font-medium border-b border-outline-variant/20">Localização</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {produtoresFiltrados.map((p) => (
                        <tr key={p.id} className="border-b border-outline-variant/10 hover:bg-surface-container-lowest/50 transition-colors">
                          <td className="py-4 px-6 font-mono text-secondary">#{p.id}</td>
                          <td className="py-4 px-6 font-medium text-on-surface">{p.nome}</td>
                          <td className="py-4 px-6 text-secondary">{p.cpf_cnpj || 'Não informado'}</td>
                          <td className="py-4 px-6 text-secondary">{p.whatsapp}</td>
                          <td className="py-4 px-6 text-on-surface">{p.cidade ? `${p.cidade} - ${p.uf || ''}` : 'N/A'}</td>
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

      {/* Modal de Novo Produtor */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-bright p-6 rounded-2xl shadow-xl max-w-lg w-full space-y-6 border border-outline-variant/30">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <h3 className="text-xl font-headline font-bold text-on-surface">Cadastrar Novo Produtor</h3>
              <button onClick={() => setModalAberto(false)} className="text-secondary hover:text-on-surface cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCadastrarProdutor} className="space-y-4 font-body">
              <div>
                <label className="block text-xs font-bold uppercase text-secondary mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: João da Silva"
                  className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none text-on-surface"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-secondary mb-1">CPF / CNPJ</label>
                  <input
                    type="text"
                    value={cpfCnpj}
                    onChange={(e) => setCpfCnpj(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none text-on-surface"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-secondary mb-1">WhatsApp / Telefone</label>
                  <input
                    type="text"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none text-on-surface"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold uppercase text-secondary mb-1">Cidade</label>
                  <input
                    type="text"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    placeholder="Nome da Cidade"
                    className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none text-on-surface"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-secondary mb-1">UF</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={uf}
                    onChange={(e) => setUf(e.target.value.toUpperCase())}
                    placeholder="UF"
                    className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none uppercase text-on-surface"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-5 py-2.5 rounded-xl border border-outline-variant text-secondary font-bold hover:bg-surface-container-low cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-bold hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
                >
                  {salvando ? 'Salvando...' : 'Salvar Produtor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}