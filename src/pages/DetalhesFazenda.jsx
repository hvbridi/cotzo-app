import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { apiFetch } from '../services/api'

export default function DetalhesFazenda() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const fazendaId = searchParams.get('id')
  const produtorIdParam = searchParams.get('produtor_id')

  const [perfil, setPerfil] = useState({ nome: '', cargo: '' })
  const [fazenda, setFazenda] = useState(null)
  const [produtor, setProdutor] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const getIniciais = (nome) => {
    if (!nome) return 'US'
    const partes = nome.trim().split(' ')
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase()
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
  }

  const formatarTelefone = (num) => {
    if (!num) return 'Não informado'
    const limpo = num.replace(/\D/g, '')
    if (limpo.length === 13 && limpo.startsWith('55')) {
      return `+55 (${limpo.slice(2, 4)}) ${limpo.slice(4, 9)}-${limpo.slice(9)}`
    }
    if (limpo.length === 11) {
      return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 7)}-${limpo.slice(7)}`
    }
    return num
  }

  useEffect(() => {
    async function carregarDetalhes() {
      if (!fazendaId) {
        setErro('ID de fazenda não fornecido.')
        setCarregando(false)
        return
      }

      setCarregando(true)
      try {
        // 1. Carrega Perfil do Usuário
        try {
          const resMe = await apiFetch('/usuarios/me')
          if (resMe.ok) {
            const meData = await resMe.json()
            setPerfil(meData)
          } else {
            const token = localStorage.getItem('token')
            if (token) {
              const payload = JSON.parse(atob(token.split('.')[1]))
              setPerfil({
                nome: payload.nome || payload.sub?.split('@')[0] || 'Usuário',
                cargo: payload.cargo || '',
              })
            }
          }
        } catch (e) {
          console.error('Erro ao buscar perfil:', e)
        }

        // 2. Busca lista de produtores e fazendas
        const resProdutores = await apiFetch('/produtores/')
        if (!resProdutores.ok) throw new Error('Falha ao carregar dados.')
        const listaProdutores = await resProdutores.json()

        let fazendaEncontrada = null
        let produtorEncontrado = null

        if (produtorIdParam) {
          produtorEncontrado = listaProdutores.find((p) => String(p.id) === String(produtorIdParam))
          if (produtorEncontrado) {
            const resF = await apiFetch(`/produtores/${produtorEncontrado.id}/fazendas`)
            if (resF.ok) {
              const fazs = await resF.json()
              fazendaEncontrada = fazs.find((f) => String(f.id) === String(fazendaId))
            }
          }
        }

        if (!fazendaEncontrada) {
          for (const p of listaProdutores) {
            const resF = await apiFetch(`/produtores/${p.id}/fazendas`)
            if (resF.ok) {
              const fazs = await resF.json()
              const match = fazs.find((f) => String(f.id) === String(fazendaId))
              if (match) {
                fazendaEncontrada = match
                produtorEncontrado = p
                break
              }
            }
          }
        }

        if (!fazendaEncontrada) throw new Error('Fazenda não encontrada no sistema.')

        setFazenda(fazendaEncontrada)
        setProdutor(produtorEncontrado)
      } catch (err) {
        setErro(err.message)
      } finally {
        setCarregando(false)
      }
    }

    carregarDetalhes()
  }, [fazendaId, produtorIdParam])

  // Apenas Admin pode deletar
  const handleDeletarFazenda = async () => {
    if (perfil?.cargo?.toLowerCase() !== 'admin') {
      alert('Acesso negado: Apenas administradores podem excluir fazendas.')
      return
    }

    if (!window.confirm(`Deseja realmente excluir a fazenda "${fazenda.nome}"?`)) return

    try {
      const resposta = await apiFetch(`/fazendas/${fazenda.id}`, { method: 'DELETE' })
      if (!resposta.ok) throw new Error('Falha ao remover a fazenda.')
      alert('Fazenda removida com sucesso!')
      navigate('/fazendas')
    } catch (err) {
      alert(err.message)
    }
  }

  // Destaca a rota atual e suas subcategorias correspondentes
  const getNavLinkClass = (path) => {
    let isActive = false

    if (path === '/cadastros') {
      const subRotasCadastros = [
        '/cadastros',
        '/fazendas',
        '/produtores',
        '/empresas',
        '/cadastrar-fazenda',
        '/cadastrar-empresa',
        '/detalhes-fazenda',
        '/detalhes-empresa',
      ]
      isActive = subRotasCadastros.some((r) => location.pathname.startsWith(r))
    } else if (path === '/relatorios') {
      isActive = ['/relatorios', '/detalhes-contrato'].some((r) =>
        location.pathname.startsWith(r)
      )
    } else {
      isActive = location.pathname === path
    }

    return `flex items-center px-4 py-3 rounded-lg font-body text-label-lg active:scale-95 transition-all duration-150 ${
      isActive
        ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
        : 'text-on-surface-variant hover:bg-surface-variant/50'
    }`
  }

  return (
    <div className="bg-background text-on-background antialiased h-screen overflow-hidden flex animate-fade-in font-body">
      {/* SideNavBar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen flex-col p-4 border-r border-outline-variant/20 bg-surface-container dark:bg-surface-container-lowest w-72 z-20">
        <div className="mb-6 px-2 pt-4 shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-on-primary text-xl">eco</span>
            </div>
            <h2 className="font-headline text-xl font-bold text-on-surface">Terra Nova</h2>
          </div>
          <p className="font-body text-label-md text-on-surface-variant ml-10">AgroCapital</p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
          <NavLink to="/dashboard" className={() => getNavLinkClass('/dashboard')}>
            <span className="material-symbols-outlined mr-3">dashboard</span>
            Dashboard
          </NavLink>

          <NavLink to="/fechamento" className={() => getNavLinkClass('/fechamento')}>
            <span className="material-symbols-outlined mr-3">handshake</span>
            Novo Fechamento
          </NavLink>

          <NavLink to="/cadastros" className={() => getNavLinkClass('/cadastros')}>
            <span className="material-symbols-outlined mr-3">person_book</span>
            Cadastros
          </NavLink>

          <NavLink to="/ofertas" className={() => getNavLinkClass('/ofertas')}>
            <span className="material-symbols-outlined mr-3">campaign</span>
            Ofertas
          </NavLink>

          <NavLink to="/relatorios" className={() => getNavLinkClass('/relatorios')}>
            <span className="material-symbols-outlined mr-3">assessment</span>
            Relatórios
          </NavLink>

          <NavLink to="/configuracoes" className={() => getNavLinkClass('/configuracoes')}>
            <span className="material-symbols-outlined mr-3">settings</span>
            Configurações
          </NavLink>
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

      {/* Main Content */}
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

              <div className="flex items-center gap-3 ml-2 cursor-pointer">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-bold text-on-surface leading-tight">
                    {perfil.nome || 'Usuário'}
                  </p>
                  <p className="text-xs text-on-surface-variant capitalize">
                    {perfil.cargo || 'Corretor'}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-[#dbd8ce] flex items-center justify-center font-bold text-xs text-[#4a5043] shrink-0 border border-outline-variant/30">
                  {getIniciais(perfil.nome || 'Usuário')}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 mt-16 p-8 overflow-y-auto bg-surface-container-lowest">
          <div className="max-w-7xl mx-auto space-y-8 pb-16">
            {carregando ? (
              <div className="p-12 text-center text-secondary bg-surface-bright rounded-2xl border border-outline-variant/20">
                Carregando detalhes da fazenda...
              </div>
            ) : erro ? (
              <div className="p-12 text-center text-error bg-surface-bright rounded-2xl border border-outline-variant/20 font-bold space-y-4">
                <p>{erro}</p>
                <button
                  onClick={() => navigate('/fazendas')}
                  className="bg-primary text-on-primary px-4 py-2 rounded-xl text-xs cursor-pointer"
                >
                  Voltar para Lista de Fazendas
                </button>
              </div>
            ) : (
              <div className="flex flex-col w-full gap-8">
                {/* Header da Página */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => navigate('/fazendas')}
                      className="flex items-center gap-2 text-sm font-label text-primary hover:opacity-80 transition-opacity self-start cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                      Voltar para a lista de fazendas
                    </button>
                    <div className="flex items-center gap-3 mt-1">
                      <h1 className="text-3xl font-headline font-bold text-on-surface">
                        {fazenda.nome}
                      </h1>
                      <span className="px-3 py-1 rounded-full bg-primary-container/40 text-on-primary-container text-xs font-bold uppercase">
                        {fazenda.condicao_frete || 'FOB Fazenda'}
                      </span>
                    </div>
                  </div>

                  {/* Botão de Excluir visível SOMENTE para Administrador */}
                  {perfil?.cargo?.toLowerCase() === 'admin' && (
                    <button
                      onClick={handleDeletarFazenda}
                      className="px-4 py-2.5 rounded-xl border border-error/40 text-error hover:bg-error-container/30 font-bold text-xs transition-colors self-start sm:self-auto flex items-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                      Excluir Fazenda
                    </button>
                  )}
                </div>

                {/* Grid 3 Colunas */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Coluna 1: Dados do Produtor & Propriedade */}
                  <div className="flex flex-col gap-6 lg:col-span-1">
                    <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/20 flex flex-col gap-5">
                      <h2 className="text-lg font-headline font-bold text-on-surface flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">person</span>
                        Produtor & Identificação
                      </h2>

                      <div className="flex flex-col gap-4 text-sm">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-label uppercase tracking-wider text-secondary">
                            Produtor Proprietário
                          </span>
                          <span className="text-base font-bold text-on-surface">
                            {produtor?.nome || 'Não informado'}
                          </span>
                        </div>

                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-label uppercase tracking-wider text-secondary">
                            WhatsApp do Produtor
                          </span>
                          <span className="text-sm font-mono text-on-surface">
                            {formatarTelefone(produtor?.whatsapp)}
                          </span>
                        </div>

                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-label uppercase tracking-wider text-secondary">
                            Município / UF
                          </span>
                          <span className="text-sm text-on-surface">
                            {fazenda.municipio || 'Não informado'}
                          </span>
                        </div>

                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-label uppercase tracking-wider text-secondary">
                            Inscrição Estadual (I.E.)
                          </span>
                          <span className="text-sm font-mono text-on-surface">
                            {fazenda.inscricao_estadual || 'Isento / Não informada'}
                          </span>
                        </div>

                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-label uppercase tracking-wider text-secondary">
                            Telefone da Fazenda
                          </span>
                          <span className="text-sm font-mono text-on-surface">
                            {formatarTelefone(fazenda.telefone)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Coluna 2 e 3: Infraestrutura e Roteiro */}
                  <div className="lg:col-span-2 flex flex-col gap-6">
                    {/* Infraestrutura Técnica */}
                    <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/20 flex flex-col gap-5">
                      <h2 className="text-lg font-headline font-bold text-on-surface flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">local_shipping</span>
                        Infraestrutura & Capacidade Operacional
                      </h2>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-4 bg-surface-container-low rounded-xl flex flex-col gap-1">
                          <span className="text-xs font-bold text-secondary uppercase">Modalidade</span>
                          <span className="text-lg font-bold text-primary font-headline">
                            {fazenda.condicao_frete || 'FOB Fazenda'}
                          </span>
                        </div>

                        <div className="p-4 bg-surface-container-low rounded-xl flex flex-col gap-1">
                          <span className="text-xs font-bold text-secondary uppercase">Carregamento</span>
                          <span className="text-lg font-bold text-on-surface font-headline">
                            {fazenda.capacidade_carregamento ? `${fazenda.capacidade_carregamento} ton/dia` : 'Não informada'}
                          </span>
                        </div>

                        <div className="p-4 bg-surface-container-low rounded-xl flex flex-col gap-1">
                          <span className="text-xs font-bold text-secondary uppercase">Balança Rodoviária</span>
                          <span className="text-lg font-bold text-on-surface font-headline">
                            {fazenda.comprimento_balanca ? `${fazenda.comprimento_balanca} metros` : 'Sem balança'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Localização GPS e Rota */}
                    <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/20 flex flex-col gap-5">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-headline font-bold text-on-surface flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary">pin_drop</span>
                          Localização & Roteiro de Acesso
                        </h2>

                        {fazenda.coordenadas && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fazenda.coordenadas)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-4 py-2 bg-primary text-on-primary hover:bg-primary/90 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-base">map</span>
                            Abrir no Google Maps
                          </a>
                        )}
                      </div>

                      <div className="space-y-4 text-sm">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-label uppercase tracking-wider text-secondary">
                            Coordenadas Geográficas
                          </span>
                          <span className="font-mono text-on-surface bg-surface-container-low px-3 py-2 rounded-xl text-xs w-fit">
                            {fazenda.coordenadas || 'Coordenadas GPS não cadastradas'}
                          </span>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <span className="text-xs font-label uppercase tracking-wider text-secondary">
                            Roteiro de Estrada de Terra (Para Motoristas e Tradings)
                          </span>
                          <div className="p-4 bg-surface-container-low rounded-xl text-on-surface leading-relaxed text-sm whitespace-pre-line border border-outline-variant/10">
                            {fazenda.descricao_roteiro || 'Nenhum roteiro detalhado registrado para esta propriedade.'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Banner CTA */}
                    <div className="w-full rounded-2xl bg-surface-container-low border border-outline-variant/20 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <h3 className="font-headline font-bold text-on-surface text-lg">
                          Pronto para negociar grãos da {fazenda.nome}?
                        </h3>
                        <p className="text-secondary text-sm mt-1">
                          Dispare uma nova oferta no mercado ou emita o contrato de fechamento.
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => navigate('/fechamento')}
                          className="bg-primary text-on-primary px-5 py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-all cursor-pointer text-xs"
                        >
                          Novo Fechamento
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}