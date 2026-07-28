import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function NovoFechamento() {
  const navigate = useNavigate()

  // Chave do topo: 'oferta' (Disparo) ou 'contrato' (Fechamento)
  const [tipoFluxo, setTipoFluxo] = useState('oferta')

  // ---------- ESTADOS DA NOVA OFERTA ----------
  const [produtorOferta, setProdutorOferta] = useState('')
  const [fazendasOferta, setFazendasOferta] = useState([])
  const [fazendaOferta, setFazendaOferta] = useState('')
  const [moedaOferta, setMoedaOferta] = useState('BRL')
  const [volumeOferta, setVolumeOferta] = useState('')
  const [precoOferta, setPrecoOferta] = useState('')
  const [dataEntregaOferta, setDataEntregaOferta] = useState('')

  // Lista de compradores/tradings para disparo
  const [compradores, setCompradores] = useState([
    { id: 1, nome: 'Ricardo Almeida', cargo: 'Comprador Sênior', empresa: 'Cargill', selecionado: true, cor: 'bg-tertiary-fixed text-on-tertiary-fixed' },
    { id: 2, nome: 'Mariana Costa', cargo: 'Mesa de Soja', empresa: 'Amaggi', selecionado: true, cor: 'bg-secondary-fixed text-on-secondary-fixed' },
    { id: 3, nome: 'Fernando Ortiz', cargo: 'Originação MT', empresa: 'Bunge', selecionado: true, cor: 'bg-[#e4e0d8] text-on-surface' },
    { id: 4, nome: 'Elena Silva', cargo: 'Broker Pleno', empresa: 'Cofco', selecionado: true, cor: 'bg-tertiary-fixed text-on-tertiary-fixed' },
    { id: 5, nome: 'Roberto Justos', cargo: 'Diretor Originação', empresa: 'ADM', selecionado: false, cor: 'bg-[#e4e0d8] text-on-surface' }
  ])

  // ---------- ESTADOS DO CONTRATO FECHADO ----------
  const [produtorContrato, setProdutorContrato] = useState('')
  const [fazendasContrato, setFazendasContrato] = useState([])
  const [fazendaContrato, setFazendaContrato] = useState('')
  const [moedaContrato, setMoedaContrato] = useState('BRL')

  // Banco de Dados simulado de Fazendas por Produtor
  const fazendasPorProdutor = {
    p1: [
      { id: 'f1', nome: 'Fazenda São Judas Tadeu - Sorriso/MT' },
      { id: 'f2', nome: 'Fazenda Esperança - Lucas do Rio Verde/MT' }
    ],
    p2: [
      { id: 'f3', nome: 'Fazenda Boa Vista - Primavera do Leste/MT' }
    ],
    p3: [
      { id: 'f4', nome: 'Sementes do Cerrado - Sede' }
    ]
  }

  // Handlers de Mudança do Produtor
  const handleProdutorOfertaChange = (e) => {
    const val = e.target.value
    setProdutorOferta(val)
    setFazendaOferta('')
    setFazendasOferta(fazendasPorProdutor[val] || [])
  }

  const handleProdutorContratoChange = (e) => {
    const val = e.target.value
    setProdutorContrato(val)
    setFazendaContrato('')
    setFazendasContrato(fazendasPorProdutor[val] || [])
  }

  // Checkbox de Compradores
  const toggleComprador = (id) => {
    setCompradores(prev =>
      prev.map(c => (c.id === id ? { ...c, selecionado: !c.selecionado } : c))
    )
  }

  const toggleTodosCompradores = (e) => {
    const checked = e.target.checked
    setCompradores(prev => prev.map(c => ({ ...c, selecionado: checked })))
  }

  const qtdSelecionados = compradores.filter(c => c.selecionado).length

  // Handlers de Envio
  const handleDispararOferta = (e) => {
    e.preventDefault()
    alert(`Oferta registrada e disparada via WhatsApp para ${qtdSelecionados} compradores!`)
    navigate('/dashboard')
  }

  const handleSalvarContrato = (e) => {
    e.preventDefault()
    alert('Contrato Fechado salvo com sucesso!')
    navigate('/dashboard')
  }

  return (
    <div className="bg-background text-on-background font-body antialiased flex h-screen overflow-hidden animate-fade-in">
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
            className="flex items-center px-4 py-3 bg-primary-container text-on-primary-container rounded-lg font-semibold font-body text-label-lg active:scale-95 transition-transform duration-150"
          >
            <span
              className="material-symbols-outlined mr-3"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              handshake
            </span>
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
            onClick={() => navigate('/')}
            className="w-full flex items-center px-4 py-3 text-on-surface-variant hover:bg-surface-variant/50 rounded-lg font-body text-label-lg active:scale-95 transition-transform duration-150 text-left cursor-pointer"
          >
            <span className="material-symbols-outlined mr-3">logout</span>
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col md:ml-72 w-full h-full">
        {/* TopAppBar */}
        <header className="flex items-center justify-between px-6 w-full border-b border-outline-variant/30 bg-surface dark:bg-surface-dim h-16 z-10 shrink-0 shadow-sm">
          <button className="md:hidden text-on-surface-variant p-2 mr-2">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="flex items-center flex-1">
            <h1 className="md:hidden font-headline text-2xl font-bold text-primary dark:text-inverse-primary">
              Terra Agro
            </h1>
            <div className="hidden md:flex items-center bg-surface-container-low rounded-full px-4 py-2 w-96">
              <span className="material-symbols-outlined text-on-surface-variant mr-2 text-sm">
                search
              </span>
              <input
                className="bg-transparent border-none focus:ring-0 text-sm w-full font-body text-on-surface placeholder-on-surface-variant focus:outline-none"
                placeholder="Buscar..."
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 text-on-surface-variant hover:bg-surface-variant/50 rounded-full transition-colors cursor-pointer active:opacity-80">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="p-2 text-on-surface-variant hover:bg-surface-variant/50 rounded-full transition-colors cursor-pointer active:opacity-80">
              <span className="material-symbols-outlined">settings</span>
            </button>
            <div className="ml-4 w-8 h-8 rounded-full overflow-hidden border border-outline-variant/30 bg-surface-container-highest cursor-pointer">
              <img
                alt="User profile"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAiIQoVv5B_O5aTTuFKVZWuFsy4X1h6Oiif4r3knJFgZyzAf4riGsMcEOa38Fk0MvyDKU25KVsgPtE2VWkaT7gi-oEAS6W9DPHh-3etqZwlDRjzl-Xsp6Ovca-hGCtq4TNeN-QdmkCpZ92FEPNFYSuCWWnNQ193yFguzLAQUJXqvBwFTa3KuLPklLBIUyjiDoK0Rfw2MnHrypPvRIU5FgHfdz1jErMX6qxVjBmWH_qUHZihGB1J4Yb4CV1bDHyb7nryjkK1UzVAJZY"
              />
            </div>
          </div>
        </header>

        {/* Main Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-surface-container-low">
          <div className="flex flex-col w-full space-y-6">
            
            {/* TOGGLE DO TOPO: ALTERNA ENTRE OFERTA E CONTRATO */}
            <div className="flex justify-center">
              <div className="flex items-center gap-2 p-1 bg-surface-container-high rounded-full shadow-sm">
                <button
                  type="button"
                  onClick={() => setTipoFluxo('oferta')}
                  className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all cursor-pointer ${
                    tipoFluxo === 'oferta'
                      ? 'bg-primary text-on-primary shadow-md'
                      : 'text-on-surface-variant hover:bg-surface-container-highest'
                  }`}
                >
                  Nova Oferta (Disparo)
                </button>
                <button
                  type="button"
                  onClick={() => setTipoFluxo('contrato')}
                  className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all cursor-pointer ${
                    tipoFluxo === 'contrato'
                      ? 'bg-primary text-on-primary shadow-md'
                      : 'text-on-surface-variant hover:bg-surface-container-highest'
                  }`}
                >
                  Contrato Fechado
                </button>
              </div>
            </div>

            {/* =========================================================
               VISUAL 1: NOVA OFERTA (DISPARO NO WHATSAPP) - 2 COLUNAS
               ========================================================= */}
            {tipoFluxo === 'oferta' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Coluna da Esquerda: Detalhes da Oferta (7 cols) */}
                <div className="lg:col-span-7 bg-surface-container rounded-2xl p-8 flex flex-col shadow-sm relative overflow-hidden">
                  <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
                  
                  <div className="mb-8 relative z-10 flex items-center justify-between">
                    <div>
                      <h2 className="font-headline font-bold text-2xl text-on-surface tracking-tight">
                        Detalhes da Oferta
                      </h2>
                      <p className="text-on-surface-variant text-sm mt-1">
                        Insira os dados da originação para disparo no mercado.
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container">
                      <span className="material-symbols-outlined">description</span>
                    </div>
                  </div>

                  <form className="space-y-6 flex-1 relative z-10" onSubmit={handleDispararOferta}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
                          Produtor Vendedor
                        </label>
                        <div className="relative">
                          <select
                            className="w-full appearance-none bg-surface border-none rounded-xl py-3 pl-4 pr-10 text-on-surface focus:ring-2 focus:ring-primary/40 outline-none shadow-sm cursor-pointer"
                            value={produtorOferta}
                            onChange={handleProdutorOfertaChange}
                          >
                            <option value="">Selecione um produtor...</option>
                            <option value="p1">João Batista Souza</option>
                            <option value="p2">Agropecuária Fazenda Bela Vista</option>
                            <option value="p3">Sementes do Cerrado S/A</option>
                          </select>
                          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
                            arrow_drop_down
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
                          Fazenda de Origem
                        </label>
                        <div className="relative">
                          <select
                            className="w-full appearance-none bg-surface border-none rounded-xl py-3 pl-4 pr-10 text-on-surface focus:ring-2 focus:ring-primary/40 outline-none shadow-sm cursor-pointer disabled:opacity-50"
                            disabled={!produtorOferta}
                            value={fazendaOferta}
                            onChange={(e) => setFazendaOferta(e.target.value)}
                          >
                            <option value="">
                              {produtorOferta ? 'Selecione a fazenda...' : 'Escolha o produtor primeiro...'}
                            </option>
                            {fazendasOferta.map(f => (
                              <option key={f.id} value={f.id}>{f.nome}</option>
                            ))}
                          </select>
                          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
                            arrow_drop_down
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
                          Volume
                        </label>
                        <div className="relative flex items-center bg-surface rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-primary/40">
                          <input
                            className="w-full bg-transparent border-none py-3 pl-4 pr-12 text-on-surface outline-none font-semibold text-lg text-right"
                            placeholder="0"
                            type="number"
                            value={volumeOferta}
                            onChange={(e) => setVolumeOferta(e.target.value)}
                          />
                          <span className="absolute right-4 text-on-surface-variant text-sm font-semibold pointer-events-none">
                            scs
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 md:col-span-2">
                        <label className="text-xs font-bold text-on-surface uppercase tracking-wider flex justify-between">
                          <span>Preço</span>
                          <span className="text-primary cursor-pointer hover:underline" onClick={() => alert('Cotações de mercado atualizadas!')}>
                            Ver mercado atual
                          </span>
                        </label>
                        <div className="flex items-center bg-surface rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-primary/40 overflow-hidden">
                          <div className="flex items-center border-r border-outline-variant/30">
                            <button
                              type="button"
                              onClick={() => setMoedaOferta('BRL')}
                              className={`px-3 py-3 text-sm font-bold transition-colors cursor-pointer ${
                                moedaOferta === 'BRL'
                                  ? 'bg-surface-container-high text-on-surface-variant'
                                  : 'bg-surface text-on-surface-variant opacity-50 hover:opacity-100'
                              }`}
                            >
                              R$
                            </button>
                            <button
                              type="button"
                              onClick={() => setMoedaOferta('USD')}
                              className={`px-3 py-3 text-sm font-bold transition-colors cursor-pointer ${
                                moedaOferta === 'USD'
                                  ? 'bg-surface-container-high text-on-surface-variant'
                                  : 'bg-surface text-on-surface-variant opacity-50 hover:opacity-100'
                              }`}
                            >
                              US$
                            </button>
                          </div>
                          <input
                            className="w-full bg-transparent border-none py-3 pl-4 pr-4 text-on-surface outline-none font-semibold text-lg"
                            placeholder="0.00"
                            step="0.01"
                            type="number"
                            value={precoOferta}
                            onChange={(e) => setPrecoOferta(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
                        Data de Entrega / Embarque
                      </label>
                      <input
                        className="w-full md:w-1/2 bg-surface border-none rounded-xl py-3 px-4 text-on-surface focus:ring-2 focus:ring-primary/40 outline-none shadow-sm cursor-pointer font-semibold"
                        type="date"
                        value={dataEntregaOferta}
                        onChange={(e) => setDataEntregaOferta(e.target.value)}
                      />
                    </div>

                    <div className="mt-8 bg-surface-container-low rounded-xl p-5 flex gap-4 items-start border-l-4 border-primary">
                      <span className="material-symbols-outlined text-primary">info</span>
                      <div>
                        <h4 className="font-bold text-sm text-on-surface">Resumo da Originação</h4>
                        <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">
                          Você está preparando uma oferta para venda FOB. Certifique-se de que as condições de pagamento e especificações do grão (umidade máx 14%, impureza máx 1%) estão acordadas com o produtor.
                        </p>
                      </div>
                    </div>
                  </form>
                </div>

                {/* Coluna da Direita: Seleção de Compradores (5 cols) */}
                <div className="lg:col-span-5 bg-surface-container-high rounded-2xl flex flex-col shadow-sm overflow-hidden relative">
                  <div className="p-6 border-b border-outline-variant/10 bg-surface/50 backdrop-blur-md">
                    <h2 className="font-headline font-bold text-xl text-on-surface tracking-tight">
                      Compradores Alvo
                    </h2>
                    <p className="text-on-surface-variant text-sm mt-1">
                      Selecione as tradings para enviar a oferta.
                    </p>
                    <div className="mt-5 relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                        search
                      </span>
                      <input
                        className="w-full bg-surface border-none rounded-full py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/40 outline-none shadow-sm placeholder:text-on-surface-variant/50"
                        placeholder="Buscar comprador ou empresa..."
                        type="text"
                      />
                    </div>
                    <div className="flex items-center gap-2 mt-4 ml-1">
                      <input
                        className="w-4 h-4 rounded text-primary bg-surface border-none focus:ring-primary/30 cursor-pointer accent-primary"
                        id="selectAll"
                        type="checkbox"
                        checked={compradores.every(c => c.selecionado)}
                        onChange={toggleTodosCompradores}
                      />
                      <label className="text-sm font-semibold text-on-surface cursor-pointer select-none" htmlFor="selectAll">
                        Selecionar Todos (Exibidos)
                      </label>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-[350px]">
                    {compradores.map((c) => (
                      <label
                        key={c.id}
                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-container-highest cursor-pointer transition-colors group"
                      >
                        <input
                          type="checkbox"
                          checked={c.selecionado}
                          onChange={() => toggleComprador(c.id)}
                          className="w-5 h-5 rounded text-primary bg-surface border-none focus:ring-primary/30 cursor-pointer accent-primary ml-2"
                        />
                        <div className="flex-1 min-w-0">
                          <div className={`font-bold text-on-surface text-sm truncate ${!c.selecionado ? 'opacity-70' : ''}`}>
                            {c.nome}
                          </div>
                          <div className={`text-xs text-on-surface-variant truncate ${!c.selecionado ? 'opacity-70' : ''}`}>
                            {c.cargo}
                          </div>
                        </div>
                        <div className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0 shadow-sm ${c.cor} ${!c.selecionado ? 'opacity-70' : ''}`}>
                          {c.empresa}
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="p-6 bg-surface-container-high border-t border-outline-variant/10 shadow-[0_-10px_20px_rgba(46,50,48,0.03)] z-20">
                    <button
                      type="button"
                      onClick={handleDispararOferta}
                      className="w-full bg-primary hover:bg-surface-tint text-on-primary rounded-xl py-4 px-6 flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] shadow-md hover:shadow-lg cursor-pointer"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        height="24"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        width="24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"></path>
                        <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"></path>
                      </svg>
                      <span className="font-bold text-[15px]">
                        Registrar Oferta e Disparar WhatsApp
                      </span>
                      <span className="bg-on-primary text-primary text-xs font-bold px-2 py-0.5 rounded-full ml-1">
                        {qtdSelecionados}
                      </span>
                    </button>
                    <p className="text-[10px] text-center text-on-surface-variant mt-3 uppercase tracking-wider">
                      Ação irreversível. O sistema enviará mensagens individuais.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================
               VISUAL 2: CONTRATO FECHADO - FORMULÁRIO COMPLETO
               ========================================================= */}
            {tipoFluxo === 'contrato' && (
              <div>
                <nav aria-label="Breadcrumb" className="flex text-sm text-on-surface-variant mb-2 font-body">
                  <ol className="inline-flex items-center space-x-1 md:space-x-3">
                    <li className="inline-flex items-center">
                      <Link className="inline-flex items-center hover:text-primary transition-colors" to="/dashboard">
                        Dashboard
                      </Link>
                    </li>
                    <li>
                      <div className="flex items-center">
                        <span className="material-symbols-outlined text-sm mx-1">chevron_right</span>
                        <span className="text-on-surface font-medium">Novo Fechamento</span>
                      </div>
                    </li>
                  </ol>
                </nav>
                <h2 className="font-headline text-3xl font-bold text-on-surface mb-6">
                  Novo Contrato de Fechamento de Grãos
                </h2>

                <form className="space-y-6" onSubmit={handleSalvarContrato}>
                  {/* Section 1: Dados do Vendedor */}
                  <div className="bg-surface-bright rounded-xl p-6 shadow-[0_4px_20px_rgba(46,50,48,0.06)] border border-outline-variant/10">
                    <h3 className="font-headline text-xl text-primary font-bold mb-4 flex items-center">
                      <span className="material-symbols-outlined mr-2">person</span>
                      Dados do Vendedor
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="form-label-organic" htmlFor="produtor">
                          Produtor
                        </label>
                        <select
                          className="form-input-organic cursor-pointer"
                          id="produtor"
                          name="produtor"
                          value={produtorContrato}
                          onChange={handleProdutorContratoChange}
                        >
                          <option disabled value="">
                            Selecione um produtor...
                          </option>
                          <option value="p1">Fazendas Reunidas Silva</option>
                          <option value="p2">Agropecuária Boa Esperança</option>
                          <option value="p3">Grupo Oliveira S.A.</option>
                        </select>
                      </div>
                      <div>
                        <label className="form-label-organic" htmlFor="fazenda">
                          Fazenda de Origem
                        </label>
                        <select
                          className="form-input-organic cursor-pointer disabled:opacity-50"
                          disabled={!produtorContrato}
                          id="fazenda"
                          name="fazenda"
                          value={fazendaContrato}
                          onChange={(e) => setFazendaContrato(e.target.value)}
                        >
                          <option disabled value="">
                            {produtorContrato ? 'Selecione a fazenda...' : 'Escolha um produtor primeiro...'}
                          </option>
                          {fazendasContrato.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.nome}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-tertiary mt-1 flex items-center">
                          <span className="material-symbols-outlined text-[14px] mr-1">info</span>
                          Campos dependentes do Produtor selecionado
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Detalhes da Venda */}
                  <div className="bg-surface-bright rounded-xl p-6 shadow-[0_4px_20px_rgba(46,50,48,0.06)] border border-outline-variant/10">
                    <h3 className="font-headline text-xl text-primary font-bold mb-4 flex items-center">
                      <span className="material-symbols-outlined mr-2">shopping_cart</span>
                      Detalhes da Venda
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="form-label-organic" htmlFor="commodity">
                          Commodity
                        </label>
                        <select className="form-input-organic cursor-pointer" defaultValue="" id="commodity" name="commodity">
                          <option disabled value="">
                            Selecione...
                          </option>
                          <option value="soja">Soja</option>
                          <option value="milho">Milho</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <label className="form-label-organic" htmlFor="volume">
                            Volume
                          </label>
                          <input className="form-input-organic" id="volume" name="volume" placeholder="0.00" type="number" />
                        </div>
                        <div className="col-span-1">
                          <label className="form-label-organic" htmlFor="unidade">
                            Unidade
                          </label>
                          <select className="form-input-organic cursor-pointer" id="unidade" name="unidade">
                            <option value="sacas">Sacas</option>
                            <option value="toneladas">Ton.</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="form-label-organic" htmlFor="preco">
                          Preço Unitário
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-on-surface-variant sm:text-sm font-label" id="currency-symbol">
                              {moedaContrato === 'BRL' ? 'R$' : 'US$'}
                            </span>
                          </div>
                          <input className="form-input-organic pl-12" id="preco" name="preco" placeholder="0.00" type="number" />
                        </div>
                      </div>
                      <div>
                        <label className="form-label-organic">Moeda</label>
                        <div className="flex space-x-4 mt-2">
                          <label className="flex items-center cursor-pointer">
                            <input
                              checked={moedaContrato === 'BRL'}
                              className="form-radio text-primary focus:ring-primary border-outline-variant"
                              name="moedaContrato"
                              type="radio"
                              value="BRL"
                              onChange={() => setMoedaContrato('BRL')}
                            />
                            <span className="ml-2 text-on-surface font-body text-sm">R$ Reais</span>
                          </label>
                          <label className="flex items-center cursor-pointer">
                            <input
                              checked={moedaContrato === 'USD'}
                              className="form-radio text-primary focus:ring-primary border-outline-variant"
                              name="moedaContrato"
                              type="radio"
                              value="USD"
                              onChange={() => setMoedaContrato('USD')}
                            />
                            <span className="ml-2 text-on-surface font-body text-sm">US$ Dólar</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Logística e Comprador */}
                  <div className="bg-surface-bright rounded-xl p-6 shadow-[0_4px_20px_rgba(46,50,48,0.06)] border border-outline-variant/10">
                    <h3 className="font-headline text-xl text-primary font-bold mb-4 flex items-center">
                      <span className="material-symbols-outlined mr-2">local_shipping</span>
                      Logística e Comprador
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="form-label-organic" htmlFor="comprador">
                          Empresa Compradora
                        </label>
                        <select className="form-input-organic cursor-pointer" defaultValue="" id="comprador" name="comprador">
                          <option disabled value="">
                            Selecione a trading ou indústria...
                          </option>
                          <option value="c1">Bunge Alimentos</option>
                          <option value="c2">Cargill Agrícola S/A</option>
                          <option value="c3">Amaggi Exportação</option>
                        </select>
                      </div>
                      <div>
                        <label className="form-label-organic" htmlFor="frete">
                          Tipo de Frete
                        </label>
                        <select className="form-input-organic cursor-pointer" defaultValue="" id="frete" name="frete">
                          <option disabled value="">
                            Selecione...
                          </option>
                          <option value="cif">CIF Armazém</option>
                          <option value="fob">FOB Fazenda</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="form-label-organic" htmlFor="data_entrega">
                            Data de Entrega
                          </label>
                          <input className="form-input-organic cursor-pointer" id="data_entrega" name="data_entrega" type="date" />
                        </div>
                        <div>
                          <label className="form-label-organic" htmlFor="data_pagamento">
                            Data de Pagamento
                          </label>
                          <input className="form-input-organic cursor-pointer" id="data_pagamento" name="data_pagamento" type="date" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Dados Internos */}
                  <div className="bg-surface-bright rounded-xl p-6 shadow-[0_4px_20px_rgba(46,50,48,0.06)] border border-outline-variant/10">
                    <h3 className="font-headline text-xl text-primary font-bold mb-4 flex items-center">
                      <span className="material-symbols-outlined mr-2">admin_panel_settings</span>
                      Dados Internos
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="form-label-organic" htmlFor="corretor">
                          Corretor Responsável
                        </label>
                        <select className="form-input-organic cursor-pointer" defaultValue="" id="corretor" name="corretor">
                          <option disabled value="">
                            Selecione o corretor...
                          </option>
                          <option value="corr1">Carlos Mendes</option>
                          <option value="corr2">Ana Paula Costa</option>
                          <option value="corr3">Roberto Ferreira</option>
                        </select>
                      </div>
                      <div>
                        <label className="form-label-organic" htmlFor="num_contrato">
                          Nº do Contrato da Trading
                        </label>
                        <input
                          className="form-input-organic uppercase"
                          id="num_contrato"
                          name="num_contrato"
                          placeholder="Ex: TRD-2023-9982"
                          type="text"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end space-x-4 pt-6 pb-12">
                    <button
                      className="px-6 py-3 rounded-xl border border-primary text-primary font-bold font-label hover:bg-primary/5 transition-colors focus:ring focus:ring-primary/20 cursor-pointer"
                      type="button"
                      onClick={() => navigate('/dashboard')}
                    >
                      Cancelar
                    </button>
                    <button
                      className="px-6 py-3 rounded-xl bg-primary text-on-primary font-bold font-label hover:bg-on-primary-fixed-variant transition-colors focus:ring focus:ring-primary/50 shadow-sm flex items-center cursor-pointer"
                      type="submit"
                    >
                      <span className="material-symbols-outlined mr-2">save</span>
                      Salvar Contrato
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  )
}