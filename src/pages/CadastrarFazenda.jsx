import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiFetch } from '../services/api'

export default function CadastrarFazenda() {
  const navigate = useNavigate()

  // Estados dos Campos e Formulário
  const [nomeFazenda, setNomeFazenda] = useState('')
  const [produtorId, setProdutorId] = useState('')
  const [produtores, setProdutores] = useState([])
  
  const [carregandoProdutores, setCarregandoProdutores] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  // 1. Busca a lista de produtores reais do banco para popular o <select>
  useEffect(() => {
    async function carregarProdutores() {
      try {
        const resposta = await apiFetch('/produtores/')
        if (!resposta.ok) {
          throw new Error('Falha ao buscar a lista de produtores.')
        }
        const dados = await resposta.json()
        setProdutores(dados)
        if (dados.length > 0) {
          setProdutorId(dados[0].id) // Seleciona o primeiro por padrão
        }
      } catch (err) {
        setErro(err.message)
      } finally {
        setCarregandoProdutores(false)
      }
    }
    carregarProdutores()
  }, [])

  // 2. Envia a nova fazenda para o banco de dados
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!produtorId) {
      alert('Selecione um produtor responsável!')
      return
    }

    setSalvando(true)

    try {
      const resposta = await apiFetch('/fazendas/', {
        method: 'POST',
        body: JSON.stringify({
          nome: nomeFazenda,
          produtor_id: Number(produtorId),
        }),
      })

      if (!resposta.ok) {
        throw new Error('Erro ao cadastrar fazenda no banco de dados.')
      }

      alert('Fazenda cadastrada com sucesso!')
      navigate('/produtores')
    } catch (err) {
      alert(err.message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="bg-background text-on-background antialiased h-screen overflow-hidden flex animate-fade-in">
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

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col h-full md:ml-72 overflow-hidden">
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

        {/* Page Canvas */}
        <main className="flex-1 p-8 mt-16 bg-surface-container-lowest overflow-y-auto">
          <div className="max-w-4xl mx-auto mb-8">
            <nav className="flex text-sm text-on-surface-variant mb-3 font-body">
              <ol className="inline-flex items-center space-x-1 md:space-x-3">
                <li>
                  <Link to="/cadastros" className="hover:text-primary transition-colors">
                    Central de Cadastros
                  </Link>
                </li>
                <li>
                  <div className="flex items-center">
                    <span className="material-symbols-outlined text-sm mx-1">chevron_right</span>
                    <Link to="/produtores" className="hover:text-primary transition-colors ml-1 md:ml-2">
                      Produtores
                    </Link>
                  </div>
                </li>
                <li aria-current="page">
                  <div className="flex items-center">
                    <span className="material-symbols-outlined text-sm mx-1">chevron_right</span>
                    <span className="text-primary font-medium ml-1 md:ml-2">Nova Fazenda</span>
                  </div>
                </li>
              </ol>
            </nav>
            <h2 className="text-4xl font-headline font-bold text-on-surface">
              Cadastrar Nova Fazenda
            </h2>
          </div>

          <form className="max-w-4xl mx-auto space-y-8" onSubmit={handleSubmit}>
            <div className="bg-surface-bright rounded-xl p-8 shadow-sm border border-outline-variant/10 space-y-6 font-body">
              <div className="flex items-center gap-3 pb-4 border-b border-surface-container-high">
                <span className="material-symbols-outlined text-primary text-2xl">
                  landscape
                </span>
                <h3 className="text-xl font-headline font-semibold text-on-surface">
                  Informações da Propriedade
                </h3>
              </div>

              {erro && (
                <div className="p-3 bg-error-container text-on-error-container text-sm rounded-xl font-medium">
                  {erro}
                </div>
              )}

              {/* Seleção do Produtor Responsável */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface-variant">
                  Produtor Proprietário / Responsável
                </label>
                {carregandoProdutores ? (
                  <p className="text-sm text-secondary">Carregando produtores do banco...</p>
                ) : produtores.length === 0 ? (
                  <div className="p-3 bg-warning-container text-sm rounded-lg">
                    Nenhum produtor cadastrado.{' '}
                    <Link to="/produtores" className="underline font-bold">
                      Cadastre um produtor primeiro.
                    </Link>
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={produtorId}
                      onChange={(e) => setProdutorId(e.target.value)}
                      required
                      className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-lg pl-4 pr-10 py-3 text-on-surface appearance-none focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                    >
                      {produtores.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nome} (ID #{p.id})
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
                      expand_more
                    </span>
                  </div>
                )}
              </div>

              {/* Nome da Fazenda */}
              <div className="flex flex-col gap-2">
                <label htmlFor="nomeFazenda" className="text-sm font-semibold text-on-surface-variant">
                  Nome da Fazenda / Propriedade
                </label>
                <input
                  type="text"
                  required
                  id="nomeFazenda"
                  placeholder="Ex: Fazenda Santa Maria"
                  value={nomeFazenda}
                  onChange={(e) => setNomeFazenda(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center justify-end gap-4 pt-4 pb-12 font-body">
              <button
                type="button"
                onClick={() => navigate('/produtores')}
                className="px-6 py-3 rounded-xl border border-outline-variant text-on-surface-variant bg-surface-bright hover:bg-surface-container-low font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvando || produtores.length === 0}
                className="px-8 py-3 bg-primary text-on-primary rounded-xl font-semibold shadow-sm hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-50"
              >
                {salvando ? 'Salvando...' : 'Salvar Fazenda'}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  )
}