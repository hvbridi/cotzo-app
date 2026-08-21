import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { apiFetch } from '../services/api'

export default function CadastrarFazenda() {
  const navigate = useNavigate()

  // Perfil do Usuário Logado
  const [perfil, setPerfil] = useState({ nome: '', cargo: '' })

  // Estados dos Campos
  const [produtorId, setProdutorId] = useState('')
  const [nomeFazenda, setNomeFazenda] = useState('')
  const [inscricaoEstadual, setInscricaoEstadual] = useState('')
  const [municipio, setMunicipio] = useState('')
  const [telefone, setTelefone] = useState('')
  const [condicaoFrete, setCondicaoFrete] = useState('FOB Fazenda')
  const [capacidadeCarregamento, setCapacidadeCarregamento] = useState('')
  const [comprimentoBalanca, setComprimentoBalanca] = useState('')
  const [coordenadas, setCoordenadas] = useState('')
  const [descricaoRoteiro, setDescricaoRoteiro] = useState('')

  const [produtores, setProdutores] = useState([])
  const [carregandoProdutores, setCarregandoProdutores] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const getIniciais = (nome) => {
    if (!nome) return 'LR'
    const partes = nome.trim().split(' ')
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase()
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
  }

  // 1. Carrega Perfil e Produtores ao abrir a página
  useEffect(() => {
    async function carregarDadosIniciais() {
      try {
        // Carrega Perfil
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

        // Carrega Produtores
        const resposta = await apiFetch('/produtores/')
        if (!resposta.ok) throw new Error('Falha ao buscar a lista de produtores.')
        const dados = await resposta.json()
        setProdutores(dados)
        if (dados.length > 0) setProdutorId(dados[0].id)
      } catch (err) {
        setErro(err.message)
      } finally {
        setCarregandoProdutores(false)
      }
    }

    carregarDadosIniciais()
  }, [])

  // 2. Envia os dados completos da Fazenda para o FastAPI
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!produtorId) {
      alert('Selecione um produtor proprietário!')
      return
    }

    setSalvando(true)
    setErro('')

    try {
      const payload = {
        nome: nomeFazenda,
        produtor_id: Number(produtorId),
        inscricao_estadual: inscricaoEstadual || null,
        municipio: municipio || null,
        telefone: telefone ? telefone.replace(/\D/g, '') : null,
        condicao_frete: condicaoFrete || null,
        capacidade_carregamento: capacidadeCarregamento ? Number(capacidadeCarregamento) : null,
        comprimento_balanca: comprimentoBalanca ? Number(comprimentoBalanca) : null,
        coordenadas: coordenadas || null,
        descricao_roteiro: descricaoRoteiro || null,
      }

      const resposta = await apiFetch('/fazendas/', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (!resposta.ok) {
        const erroDados = await resposta.json().catch(() => ({}))
        throw new Error(erroDados.detail || 'Erro ao cadastrar fazenda no banco de dados.')
      }

      alert('Fazenda cadastrada com sucesso!')
      navigate('/produtores')
    } catch (err) {
      setErro(err.message)
      alert(`Falha no cadastro:\n${err.message}`)
    } finally {
      setSalvando(false)
    }
  }

  const getNavLinkClass = ({ isActive }) =>
    `flex items-center px-4 py-3 rounded-lg font-body text-label-lg active:scale-95 transition-all duration-150 ${
      isActive
        ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
        : 'text-on-surface-variant hover:bg-surface-variant/50'
    }`

  return (
    <div className="bg-background text-on-background antialiased h-screen overflow-hidden flex animate-fade-in font-body">
      {/* SideNavBar Fixa */}
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
          <NavLink to="/dashboard" className={getNavLinkClass}>
            <span className="material-symbols-outlined mr-3">dashboard</span>
            Dashboard
          </NavLink>

          <NavLink to="/fechamento" className={getNavLinkClass}>
            <span className="material-symbols-outlined mr-3">handshake</span>
            Novo Fechamento
          </NavLink>

          <NavLink to="/cadastros" className={getNavLinkClass}>
            <span className="material-symbols-outlined mr-3">person_book</span>
            Cadastros
          </NavLink>

          <NavLink to="/ofertas" className={getNavLinkClass}>
            <span className="material-symbols-outlined mr-3">campaign</span>
            Ofertas
          </NavLink>

          <NavLink to="/relatorios" className={getNavLinkClass}>
            <span className="material-symbols-outlined mr-3">assessment</span>
            Relatórios
          </NavLink>

          <NavLink to="/configuracoes" className={getNavLinkClass}>
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
        {/* TopAppBar com Perfil Dinâmico */}
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

        {/* Page Canvas */}
        <main className="flex-1 p-8 mt-16 bg-surface-container-lowest overflow-y-auto">
          <div className="max-w-4xl mx-auto mb-6">
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
            <h2 className="text-3xl font-headline font-bold text-on-surface">
              Cadastrar Nova Fazenda
            </h2>
            <p className="text-secondary text-sm mt-1">
              Registre a propriedade rural e suas especificações técnicas e logísticas.
            </p>
          </div>

          <form className="max-w-4xl mx-auto space-y-6" onSubmit={handleSubmit}>
            {erro && (
              <div className="p-4 bg-error-container text-on-error-container text-sm rounded-xl font-medium border border-error/20">
                {erro}
              </div>
            )}

            {/* CARD 1: Identificação da Propriedade */}
            <div className="bg-surface-bright rounded-2xl p-6 shadow-sm border border-outline-variant/20 space-y-5 font-body">
              <div className="flex items-center gap-2.5 pb-3 border-b border-outline-variant/20">
                <span className="material-symbols-outlined text-primary">landscape</span>
                <h3 className="text-lg font-headline font-bold text-on-surface">
                  1. Identificação da Propriedade
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                    Produtor Proprietário / Responsável
                  </label>
                  {carregandoProdutores ? (
                    <p className="text-xs text-secondary py-2">Buscando produtores...</p>
                  ) : produtores.length === 0 ? (
                    <div className="p-3 bg-warning-container text-xs rounded-xl">
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
                        className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl px-4 py-2.5 text-sm text-on-surface appearance-none focus:ring-2 focus:ring-primary outline-none cursor-pointer"
                      >
                        {produtores.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nome} (ID #{p.id})
                          </option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none">
                        expand_more
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                    Nome da Fazenda / Propriedade
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Fazenda Santa Maria - Lote B"
                    value={nomeFazenda}
                    onChange={(e) => setNomeFazenda(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                    Município / UF
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Primavera do Leste - MT"
                    value={municipio}
                    onChange={(e) => setMunicipio(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                    Inscrição Estadual (I.E.)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 13.456.789-0"
                    value={inscricaoEstadual}
                    onChange={(e) => setInscricaoEstadual(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                    WhatsApp / Telefone da Fazenda
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: (66) 99988-7766"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>
            </div>

            {/* CARD 2: Infraestrutura e Logística */}
            <div className="bg-surface-bright rounded-2xl p-6 shadow-sm border border-outline-variant/20 space-y-5 font-body">
              <div className="flex items-center gap-2.5 pb-3 border-b border-outline-variant/20">
                <span className="material-symbols-outlined text-primary">local_shipping</span>
                <h3 className="text-lg font-headline font-bold text-on-surface">
                  2. Infraestrutura e Logística
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                    Condição de Frete Padrão
                  </label>
                  <select
                    value={condicaoFrete}
                    onChange={(e) => setCondicaoFrete(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:ring-2 focus:ring-primary outline-none cursor-pointer"
                  >
                    <option value="FOB Fazenda">FOB Fazenda (Retira na Propriedade)</option>
                    <option value="CIF Armazém">CIF Armazém (Entregue no Armazém)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                    Capacidade de Carregamento
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="Ex: 80"
                      value={capacidadeCarregamento}
                      onChange={(e) => setCapacidadeCarregamento(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl px-4 py-2.5 pr-14 text-sm text-on-surface focus:ring-2 focus:ring-primary outline-none font-mono"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-secondary">
                      ton/dia
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                    Comprimento da Balança
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Ex: 30"
                      value={comprimentoBalanca}
                      onChange={(e) => setComprimentoBalanca(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl px-4 py-2.5 pr-12 text-sm text-on-surface focus:ring-2 focus:ring-primary outline-none font-mono"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-secondary">
                      metros
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 3: Localização e Roteiro de Acesso */}
            <div className="bg-surface-bright rounded-2xl p-6 shadow-sm border border-outline-variant/20 space-y-5 font-body">
              <div className="flex items-center gap-2.5 pb-3 border-b border-outline-variant/20">
                <span className="material-symbols-outlined text-primary">pin_drop</span>
                <h3 className="text-lg font-headline font-bold text-on-surface">
                  3. Localização e Roteiro de Acesso
                </h3>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                  Coordenadas GPS (Latitude, Longitude)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ex: -15.556214, -54.298115"
                    value={coordenadas}
                    onChange={(e) => setCoordenadas(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:ring-2 focus:ring-primary outline-none font-mono"
                  />
                  {coordenadas && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coordenadas)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2.5 bg-surface-container-high hover:bg-surface-variant text-primary font-bold text-xs rounded-xl flex items-center gap-1.5 whitespace-nowrap transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">map</span>
                      Ver Mapa
                    </a>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                  Descrição do Roteiro / Estrada de Terra (Para Motoristas e Tradings)
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex: Saindo de Primavera pela MT-130 sentido Paranatinga, rodar 25km de asfalto, entrar à direita no KM 25 (Placa Fazenda SM), seguir mais 14km de terra boa até a sede com balança."
                  value={descricaoRoteiro}
                  onChange={(e) => setDescricaoRoteiro(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-sm text-on-surface focus:ring-2 focus:ring-primary outline-none leading-relaxed"
                />
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center justify-end gap-3 pt-2 pb-12 font-body">
              <button
                type="button"
                onClick={() => navigate('/produtores')}
                className="px-6 py-2.5 rounded-xl border border-outline-variant text-secondary font-bold hover:bg-surface-container-low transition-colors cursor-pointer text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvando || produtores.length === 0}
                className="px-7 py-2.5 bg-primary text-on-primary rounded-xl font-bold shadow-sm hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 text-xs"
              >
                <span className="material-symbols-outlined text-base">save</span>
                {salvando ? 'Salvando...' : 'Salvar Fazenda'}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  )
}