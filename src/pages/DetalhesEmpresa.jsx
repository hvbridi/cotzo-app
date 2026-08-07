import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { apiFetch } from '../services/api'

export default function DetalhesEmpresa() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const empresaId = searchParams.get('id')

  // Estados de Dados do Banco
  const [empresa, setEmpresa] = useState(null)
  const [compradores, setCompradores] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  // Estados do Modal de Novo Comprador
  const [modalAberto, setModalAberto] = useState(false)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [salvando, setSalvando] = useState(false)

  // Função para formatar qualquer telefone/WhatsApp para um padrão visual limpo
  const formatarTelefone = (num) => {
    if (!num) return 'Não informado'
    const limpo = num.replace(/\D/g, '')

    // Com DDI 55 + DDD (2 dígitos) + 9 dígitos (ex: 5566999092301 -> +55 (66) 99909-2301)
    if (limpo.length === 13 && limpo.startsWith('55')) {
      return `+55 (${limpo.slice(2, 4)}) ${limpo.slice(4, 9)}-${limpo.slice(9)}`
    }
    // Com DDI 55 + DDD (2 dígitos) + 8 dígitos (ex: 556634567890 -> +55 (66) 3456-7890)
    if (limpo.length === 12 && limpo.startsWith('55')) {
      return `+55 (${limpo.slice(2, 4)}) ${limpo.slice(4, 8)}-${limpo.slice(8)}`
    }
    // Apenas DDD + 9 dígitos (ex: 66999092301 -> (66) 99909-2301)
    if (limpo.length === 11) {
      return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 7)}-${limpo.slice(7)}`
    }
    // Apenas DDD + 8 dígitos (ex: 6634567890 -> (66) 3456-7890)
    if (limpo.length === 10) {
      return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 6)}-${limpo.slice(6)}`
    }

    return num
  }

  // Carregar dados da empresa e dos compradores vinculados
  const carregarDadosEmpresa = async () => {
    setCarregando(true)
    try {
      const [resEmpresas, resCompradores] = await Promise.all([
        apiFetch('/empresas/'),
        apiFetch('/compradores/'),
      ])

      if (!resEmpresas.ok) throw new Error('Falha ao carregar empresas.')

      const listaEmpresas = await resEmpresas.json()
      const empresaEncontrada = empresaId
        ? listaEmpresas.find((e) => String(e.id) === String(empresaId))
        : listaEmpresas[0]

      if (!empresaEncontrada) {
        throw new Error('Empresa não encontrada no banco de dados.')
      }

      setEmpresa(empresaEncontrada)

      if (resCompradores.ok) {
        const todosCompradores = await resCompradores.json()
        const vinculados = todosCompradores.filter(
          (c) => String(c.empresa_id) === String(empresaEncontrada.id)
        )
        setCompradores(vinculados)
      }
    } catch (err) {
      setErro(err.message)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarDadosEmpresa()
  }, [empresaId])

  // Salvar novo comprador no banco de dados
  const handleCadastrarComprador = async (e) => {
    e.preventDefault()
    if (!empresa) return

    setSalvando(true)
    try {
      const resposta = await apiFetch('/compradores/', {
        method: 'POST',
        body: JSON.stringify({
          nome,
          email,
          telefone: telefone.replace(/\D/g, ''), // Salva apenas os dígitos no banco
          empresa_id: Number(empresa.id),
        }),
      })

      if (!resposta.ok) {
        throw new Error('Erro ao salvar comprador. Verifique se o e-mail já não está cadastrado.')
      }

      alert('Comprador cadastrado com sucesso!')
      setModalAberto(false)
      setNome('')
      setEmail('')
      setTelefone('')
      carregarDadosEmpresa()
    } catch (err) {
      alert(err.message)
    } finally {
      setSalvando(false)
    }
  }

  // Deletar comprador do banco de dados
  const handleDeletarComprador = async (id, nomeComprador) => {
    if (!window.confirm(`Tem certeza que deseja remover ${nomeComprador}?`)) return

    try {
      const resposta = await apiFetch(`/compradores/${id}`, {
        method: 'DELETE',
      })

      if (!resposta.ok) {
        throw new Error('Falha ao remover o comprador.')
      }

      alert('Comprador removido com sucesso!')
      carregarDadosEmpresa()
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="bg-background text-on-background antialiased h-screen overflow-hidden flex animate-fade-in font-body">
      {/* SideNavBar Fixa Padronizada */}
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
            className="flex items-center px-4 py-3 text-on-surface-variant hover:bg-surface-variant/50 rounded-lg text-label-lg active:scale-95 transition-transform duration-150"
          >
            <span className="material-symbols-outlined mr-3">dashboard</span>
            Dashboard
          </Link>
          <Link
            to="/fechamento"
            className="flex items-center px-4 py-3 text-on-surface-variant hover:bg-surface-variant/50 rounded-lg text-label-lg active:scale-95 transition-transform duration-150"
          >
            <span className="material-symbols-outlined mr-3">handshake</span>
            Novo Fechamento
          </Link>
          <Link
            to="/cadastros"
            className="flex items-center px-4 py-3 bg-primary-container text-on-primary-container rounded-lg font-semibold text-label-lg active:scale-95 transition-transform duration-150"
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
            className="flex items-center px-4 py-3 text-on-surface-variant hover:bg-surface-variant/50 rounded-lg text-label-lg active:scale-95 transition-transform duration-150"
          >
            <span className="material-symbols-outlined mr-3">assessment</span>
            Relatórios
          </Link>
          <Link
            to="/configuracoes"
            className="flex items-center px-4 py-3 text-on-surface-variant hover:bg-surface-variant/50 rounded-lg text-label-lg active:scale-95 transition-transform duration-150"
          >
            <span className="material-symbols-outlined mr-3">settings</span>
            Configurações
          </Link>
        </nav>

        <div className="mt-auto space-y-1 pt-4 border-t border-outline-variant/20 shrink-0">
          <button
            onClick={() => {
              localStorage.removeItem('token')
              navigate('/')
            }}
            className="w-full flex items-center px-4 py-3 text-on-surface-variant hover:bg-surface-variant/50 rounded-lg text-label-lg active:scale-95 transition-transform duration-150 text-left cursor-pointer"
          >
            <span className="material-symbols-outlined mr-3">logout</span>
            Sair
          </button>
        </div>
      </aside>

      {/* Main Wrapper com Rolagem no Canvas */}
      <div className="flex-1 flex flex-col h-full md:ml-72 overflow-hidden">
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

        {/* Canvas de Conteúdo com Rolagem Independente */}
        <main className="flex-1 mt-16 p-8 overflow-y-auto bg-surface-container-lowest">
          <div className="max-w-7xl mx-auto space-y-8 pb-16">
            {carregando ? (
              <div className="p-12 text-center text-secondary bg-surface-bright rounded-2xl border border-outline-variant/20">
                Carregando informações da empresa...
              </div>
            ) : erro ? (
              <div className="p-12 text-center text-error bg-surface-bright rounded-2xl border border-outline-variant/20 font-bold">
                {erro}
              </div>
            ) : (
              <div className="flex flex-col w-full gap-8">
                {/* Cabeçalho */}
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
                      {empresa.razao_social || empresa.nome}
                    </h1>
                  </div>
                </div>

                {/* Grid 3 Colunas */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Coluna 1: Dados Corporativos (1/3) */}
                  <div className="flex flex-col gap-6 lg:col-span-1">
                    <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/20 flex flex-col gap-6">
                      <h2 className="text-lg font-headline font-bold text-on-surface flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">
                          apartment
                        </span>
                        Dados Corporativos
                      </h2>
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-label uppercase tracking-wider text-secondary">
                            CNPJ
                          </span>
                          <span className="text-base font-body font-mono text-on-surface">
                            {empresa.cnpj || 'Não informado'}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-label uppercase tracking-wider text-secondary">
                            Inscrição Estadual
                          </span>
                          <span className="text-base font-body text-on-surface">
                            {empresa.inscricao_estadual || 'Não informada'}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-label uppercase tracking-wider text-secondary">
                            Localização
                          </span>
                          <span className="text-base font-body text-on-surface">
                            {empresa.cidade ? `${empresa.cidade} - ${empresa.estado}` : 'N/A'}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-label uppercase tracking-wider text-secondary">
                            Endereço
                          </span>
                          <span className="text-base font-body text-on-surface">
                            {empresa.endereco || 'Não informado'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Coluna 2: Lista de Compradores (2/3) */}
                  <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/20 flex flex-col gap-6 flex-1">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-headline font-bold text-on-surface flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary">
                            groups
                          </span>
                          Compradores / Negociadores da Trading
                        </h2>
                        <button
                          onClick={() => setModalAberto(true)}
                          className="flex items-center gap-2 bg-primary px-4 py-2 rounded-xl text-on-primary text-sm font-bold hover:bg-primary/90 transition-all shadow-sm cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            add
                          </span>
                          Adicionar Comprador
                        </button>
                      </div>

                      <div className="flex flex-col gap-3">
                        {compradores.length === 0 ? (
                          <div className="p-8 text-center text-secondary bg-surface-container-low rounded-xl">
                            Nenhum comprador cadastrado para esta empresa ainda. Clique em "Adicionar Comprador".
                          </div>
                        ) : (
                          compradores.map((c) => {
                            const numDigitos = c.telefone ? c.telefone.replace(/\D/g, '') : ''
                            const linkWhatsApp = numDigitos.startsWith('55')
                              ? numDigitos
                              : `55${numDigitos}`

                            return (
                              <div
                                key={c.id}
                                className="group flex items-center justify-between p-4 rounded-xl bg-surface hover:bg-surface-container transition-colors border border-outline-variant/10"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-headline font-bold uppercase">
                                    {c.nome.slice(0, 2)}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-base font-body font-bold text-on-surface">
                                      {c.nome}
                                    </span>
                                    <span className="text-xs font-body text-secondary">
                                      {c.email}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-4">
                                  <a
                                    href={`https://wa.me/${linkWhatsApp}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1.5 text-sm font-bold text-on-surface hover:text-primary transition-colors font-mono bg-surface-container-low px-3 py-1.5 rounded-lg border border-outline-variant/20"
                                  >
                                    <span className="material-symbols-outlined text-[#25D366] text-[18px]">
                                      chat
                                    </span>
                                    {formatarTelefone(c.telefone)}
                                  </a>

                                  <button
                                    onClick={() => handleDeletarComprador(c.id, c.nome)}
                                    title="Remover Comprador"
                                    className="p-2 rounded-lg text-secondary hover:text-error hover:bg-error-container/30 transition-colors cursor-pointer"
                                  >
                                    <span className="material-symbols-outlined text-[20px]">
                                      delete
                                    </span>
                                  </button>
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>

                    {/* Banner CTA Fechamento */}
                    <div className="w-full rounded-2xl bg-surface-container-low border border-outline-variant/20 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <h3 className="font-headline font-bold text-on-surface text-lg">
                          Pronto para fechar negócio com a {empresa.razao_social || empresa.nome}?
                        </h3>
                        <p className="text-secondary text-sm mt-1">
                          Inicie a emissão do contrato de corretagem direto para esta empresa.
                        </p>
                      </div>
                      <button
                        onClick={() => navigate('/fechamento')}
                        className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all cursor-pointer whitespace-nowrap"
                      >
                        Novo Fechamento
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal de Cadastro de Comprador */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-bright p-6 rounded-2xl shadow-xl max-w-md w-full space-y-6 border border-outline-variant/30">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <h3 className="text-xl font-headline font-bold text-on-surface">
                Novo Comprador ({empresa?.razao_social})
              </h3>
              <button
                onClick={() => setModalAberto(false)}
                className="text-secondary hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCadastrarComprador} className="space-y-4 font-body">
              <div>
                <label className="block text-xs font-bold uppercase text-secondary mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Roberto Costa"
                  className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-secondary mb-1">
                  E-mail Corporativo
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="roberto@trading.com"
                  className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-secondary mb-1">
                  WhatsApp / Telefone (com DDD)
                </label>
                <input
                  type="text"
                  required
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="Ex: (66) 99909-2301 ou 5566999092301"
                  className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/20">
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
                  {salvando ? 'Salvando...' : 'Salvar Comprador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}