import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { apiFetch } from '../services/api'

export default function Fazendas() {
  const navigate = useNavigate()
  const location = useLocation()

  const [busca, setBusca] = useState('')
  const [fazendas, setFazendas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  // Perfil do Usuário Logado
  const [perfil, setPerfil] = useState({ nome: '', cargo: '' })

  const getIniciais = (nome) => {
    if (!nome) return 'US'
    const partes = nome.trim().split(' ')
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase()
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
  }

  useEffect(() => {
    async function carregarDados() {
      try {
        // 1. Carrega Perfil
        try {
          const resMe = await apiFetch('/usuarios/me')
          if (resMe.ok) {
            const meData = await resMe.json()
            setPerfil(meData)
          } else {
            const token = localStorage.getItem('token')
            if (token) {
              const payloadBase64 = token.split('.')[1]
              const payloadJson = JSON.parse(atob(payloadBase64))
              const emailLogado = payloadJson.sub || ''
              const resListaU = await apiFetch('/usuarios/')
              if (resListaU.ok) {
                const listaU = await resListaU.json()
                const uEncontrado = listaU.find(
                  (item) => item.email.toLowerCase() === emailLogado.toLowerCase()
                )
                if (uEncontrado) setPerfil(uEncontrado)
              }
            }
          }
        } catch (e) {
          console.error('Erro ao buscar perfil:', e)
        }

        // 2. Carrega Produtores e suas respectivas Fazendas
        const resProdutores = await apiFetch('/produtores/')
        if (!resProdutores.ok) throw new Error('Falha ao carregar produtores.')
        const listaProdutores = await resProdutores.json()

        const chamadasFazendas = listaProdutores.map(async (p) => {
          const resF = await apiFetch(`/produtores/${p.id}/fazendas`)
          if (resF.ok) {
            const dadosF = await resF.json()
            return dadosF.map((faz) => ({
              ...faz,
              produtor_nome: p.nome,
              produtor_whatsapp: p.whatsapp,
            }))
          }
          return []
        })

        const resultados = await Promise.all(chamadasFazendas)
        setFazendas(resultados.flat())
      } catch (err) {
        setErro(err.message)
      } finally {
        setCarregando(false)
      }
    }

    carregarDados()
  }, [])

  const fazendasFiltradas = fazendas.filter((f) => {
    const termo = busca.toLowerCase()
    const nome = (f.nome || '').toLowerCase()
    const produtor = (f.produtor_nome || '').toLowerCase()
    const municipio = (f.municipio || '').toLowerCase()
    const ie = (f.inscricao_estadual || '').toLowerCase()
    return (
      nome.includes(termo) ||
      produtor.includes(termo) ||
      municipio.includes(termo) ||
      ie.includes(termo)
    )
  })

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
    <div className="bg-background text-on-background antialiased min-h-screen flex animate-fade-in font-body">
      {/* SideNavBar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full flex-col p-4 space-y-2 border-r border-outline-variant/20 bg-surface-container dark:bg-surface-container-lowest w-72 z-20">
        <div className="mb-8 px-2 pt-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-on-primary text-xl">eco</span>
            </div>
            <h2 className="font-headline text-xl font-bold text-on-surface">Terra Nova</h2>
          </div>
          <p className="font-body text-label-md text-on-surface-variant ml-10">AgroCapital</p>
        </div>

        <nav className="flex-1 space-y-1">
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

        <div className="mt-auto space-y-1 pt-4 border-t border-outline-variant/20">
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

      {/* Main Wrapper */}
      <div className="flex-1 flex flex-col min-h-screen md:ml-72">
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
                    {perfil.nome || 'Luís miguel Ravanello'}
                  </p>
                  <p className="text-xs text-on-surface-variant capitalize">
                    {perfil.cargo || 'Admin'}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-[#dbd8ce] flex items-center justify-center font-bold text-xs text-[#4a5043] shrink-0 border border-outline-variant/30">
                  {getIniciais(perfil.nome || 'Luís miguel Ravanello')}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 mt-16 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <div className="flex items-center gap-2 text-sm font-label text-on-surface-variant mb-2">
                  <Link to="/cadastros" className="hover:text-primary transition-colors">
                    Central de Cadastros
                  </Link>
                  <span className="material-symbols-outlined text-base">chevron_right</span>
                  <span className="text-primary font-medium">Fazendas</span>
                </div>
                <h2 className="font-headline text-3xl font-semibold text-on-background mb-1">
                  Fazendas & Propriedades
                </h2>
                <p className="text-secondary text-lg">
                  Consulte a infraestrutura, rotas logísticas e especificações das fazendas parceiras.
                </p>
              </div>
              <Link
                to="/cadastrar-fazenda"
                className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2 transform active:scale-95 cursor-pointer self-start md:self-auto"
              >
                <span className="material-symbols-outlined">add</span>
                Nova Fazenda
              </Link>
            </div>

            <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 overflow-hidden">
              <div className="p-6 border-b border-outline-variant/20">
                <div className="relative w-full sm:max-w-md">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary text-sm">
                    search
                  </span>
                  <input
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low focus:ring-2 focus:ring-primary outline-none text-sm text-on-surface placeholder:text-secondary"
                    placeholder="Buscar por fazenda, produtor ou município..."
                    type="text"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                {carregando ? (
                  <div className="p-12 text-center text-secondary font-body">
                    Carregando fazendas cadastradas...
                  </div>
                ) : erro ? (
                  <div className="p-12 text-center text-error font-body">{erro}</div>
                ) : fazendasFiltradas.length === 0 ? (
                  <div className="p-12 text-center text-secondary font-body">
                    Nenhuma fazenda encontrada no banco de dados.
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low text-secondary text-sm">
                        <th className="py-3 px-6 font-medium border-b border-outline-variant/20">ID</th>
                        <th className="py-3 px-6 font-medium border-b border-outline-variant/20">Fazenda</th>
                        <th className="py-3 px-6 font-medium border-b border-outline-variant/20">Produtor Proprietário</th>
                        <th className="py-3 px-6 font-medium border-b border-outline-variant/20">Município</th>
                        <th className="py-3 px-6 font-medium border-b border-outline-variant/20">Frete / Balança</th>
                        <th className="py-3 px-6 font-medium border-b border-outline-variant/20 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {fazendasFiltradas.map((f) => (
                        <tr
                          key={f.id}
                          className="border-b border-outline-variant/10 hover:bg-surface-container-lowest/50 transition-colors"
                        >
                          <td className="py-4 px-6 font-mono text-secondary">#{f.id}</td>
                          <td className="py-4 px-6 font-bold text-on-surface">{f.nome}</td>
                          <td className="py-4 px-6 text-on-surface">{f.produtor_nome}</td>
                          <td className="py-4 px-6 text-secondary">{f.municipio || 'N/A'}</td>
                          <td className="py-4 px-6">
                            <span className="px-2.5 py-1 rounded-md bg-surface-container text-on-surface text-xs font-semibold">
                              {f.condicao_frete || 'FOB'} {f.comprimento_balanca ? `• Balança ${f.comprimento_balanca}m` : ''}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={() => navigate(`/detalhes-fazenda?id=${f.id}&produtor_id=${f.produtor_id}`)}
                              className="text-primary hover:text-primary-container font-bold text-sm transition-colors cursor-pointer"
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