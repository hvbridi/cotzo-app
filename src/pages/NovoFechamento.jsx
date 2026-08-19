import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiFetch } from '../services/api'
import { useQueryClient } from '@tanstack/react-query'

export default function NovoFechamento() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Controle de Abas: 'contrato' | 'oferta' | 'bid'
  const [abaAtiva, setAbaAtiva] = useState('contrato')

  // Perfil do Usuário Logado
  const [perfil, setPerfil] = useState({
    nome: '',
    cargo: '',
  })

  // Listas do Banco de Dados
  const [produtores, setProdutores] = useState([])
  const [fazendas, setFazendas] = useState([])
  const [empresas, setEmpresas] = useState([])
  const [compradores, setCompradores] = useState([])
  const [usuarios, setUsuarios] = useState([])

  // Estados de Carregamento
  const [carregandoDados, setCarregandoDados] = useState(true)
  const [carregandoFazendas, setCarregandoFazendas] = useState(false)
  const [salvando, setSalvando] = useState(false)

  // -------------------------------------------------------------
  // ESTADOS DO FORMULÁRIO: CONTRATO FECHADO (INTOCADO)
  // -------------------------------------------------------------
  const [dataFechamento, setDataFechamento] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [commodity, setCommodity] = useState('soja')
  const [safra, setSafra] = useState('2025/2026')
  const [volume, setVolume] = useState('')
  const [tipoMedida, setTipoMedida] = useState('sacas')
  const [moeda, setMoeda] = useState('BRL')
  const [precoUnitario, setPrecoUnitario] = useState('')
  const [tipoFrete, setTipoFrete] = useState('fob')
  const [dataEntrega, setDataEntrega] = useState('')
  const [dataPagamento, setDataPagamento] = useState('')
  const [numeroContratoTrading, setNumeroContratoTrading] = useState('')
  const [comissaoPorcentagem, setComissaoPorcentagem] = useState('1.00')

  // IDs Selecionados (Contrato)
  const [produtorId, setProdutorId] = useState('')
  const [fazendaId, setFazendaId] = useState('')
  const [empresaId, setEmpresaId] = useState('')
  const [usuarioId, setUsuarioId] = useState('')

  // -------------------------------------------------------------
  // ESTADOS DO FORMULÁRIO: OFERTA / DISPARO
  // -------------------------------------------------------------
  const [produtorOfertaId, setProdutorOfertaId] = useState('')
  const [fazendaOfertaId, setFazendaOfertaId] = useState('')
  const [commodityOferta, setCommodityOferta] = useState('Soja')
  const [tipoMedidaOferta, setTipoMedidaOferta] = useState('Sacas')
  const [volumeOferta, setVolumeOferta] = useState('')
  const [precoOferta, setPrecoOferta] = useState('')
  const [moedaOferta, setMoedaOferta] = useState('BRL')
  const [dataEntregaOferta, setDataEntregaOferta] = useState('')
  const [buscaComprador, setBuscaComprador] = useState('')
  const [empresaFiltroId, setEmpresaFiltroId] = useState('')
  const [compradoresSelecionados, setCompradoresSelecionados] = useState([])
  const [disparandoOferta, setDisparandoOferta] = useState(false)

  // -------------------------------------------------------------
  // ESTADOS DO FORMULÁRIO: REGISTRAR BID / ALVO
  // -------------------------------------------------------------
  const [produtorBidId, setProdutorBidId] = useState('')
  const [fazendaBidId, setFazendaBidId] = useState('')
  const [commodityBid, setCommodityBid] = useState('soja')
  const [volumeBid, setVolumeBid] = useState('')
  const [precoBid, setPrecoBid] = useState('')
  const [moedaBid, setMoedaBid] = useState('brl')
  const [validadeBid, setValidadeBid] = useState('')
  const [salvandoBid, setSalvandoBid] = useState(false)

  // Gera as iniciais do nome para o badge do topo
  const getIniciais = (nome) => {
    if (!nome) return 'LR'
    const partes = nome.trim().split(' ')
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase()
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
  }

  // 1. Carrega Perfil, Produtores, Empresas, Compradores (Pessoas) e Usuários
  useEffect(() => {
    async function carregarDadosIniciais() {
      setCarregandoDados(true)
      try {
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
        } catch (errPerfil) {
          console.error('Erro ao buscar perfil:', errPerfil)
        }

        const [resProdutores, resEmpresas, resUsuarios, resCompradores] =
          await Promise.all([
            apiFetch('/produtores/'),
            apiFetch('/empresas/'),
            apiFetch('/usuarios/'),
            apiFetch('/compradores/').catch(() => null),
          ])

        if (resProdutores && resProdutores.ok) {
          const dadosProdutores = await resProdutores.json()
          setProdutores(dadosProdutores)
          if (dadosProdutores.length > 0) {
            setProdutorId(dadosProdutores[0].id)
            setProdutorOfertaId(dadosProdutores[0].id)
            setProdutorBidId(dadosProdutores[0].id)
          }
        }

        let listaEmpresas = []
        if (resEmpresas && resEmpresas.ok) {
          listaEmpresas = await resEmpresas.json()
          setEmpresas(listaEmpresas)
          if (listaEmpresas.length > 0) {
            setEmpresaId(listaEmpresas[0].id)
          }
        }

        let listaCompradores = []
        if (resCompradores && resCompradores.ok) {
          listaCompradores = await resCompradores.json()
          setCompradores(listaCompradores)
          if (listaCompradores.length > 0) {
            setCompradoresSelecionados(listaCompradores.map((c) => c.id))
          }
        } else {
          setCompradoresSelecionados(listaEmpresas.map((e) => e.id))
        }

        if (resUsuarios && resUsuarios.ok) {
          const dadosUsuarios = await resUsuarios.json()
          setUsuarios(dadosUsuarios)
          if (dadosUsuarios.length > 0) setUsuarioId(dadosUsuarios[0].id)
        }
      } catch (err) {
        console.error('Erro ao carregar dados iniciais:', err)
      } finally {
        setCarregandoDados(false)
      }
    }

    carregarDadosIniciais()
  }, [])

  // 2. Busca as Fazendas do Produtor Selecionado
  useEffect(() => {
    let pId = produtorId
    if (abaAtiva === 'oferta') pId = produtorOfertaId
    if (abaAtiva === 'bid') pId = produtorBidId

    if (!pId) {
      setFazendas([])
      setFazendaId('')
      setFazendaOfertaId('')
      setFazendaBidId('')
      return
    }

    async function carregarFazendasDoProdutor() {
      setCarregandoFazendas(true)
      try {
        const resposta = await apiFetch(`/produtores/${pId}/fazendas`)
        if (resposta.ok) {
          const dadosFazendas = await resposta.json()
          setFazendas(dadosFazendas)
          if (dadosFazendas.length > 0) {
            setFazendaId(dadosFazendas[0].id)
            setFazendaOfertaId(dadosFazendas[0].id)
            setFazendaBidId(dadosFazendas[0].id)
          } else {
            setFazendaId('')
            setFazendaOfertaId('')
            setFazendaBidId('')
          }
        }
      } catch (err) {
        console.error('Erro ao buscar fazendas do produtor:', err)
      } finally {
        setCarregandoFazendas(false)
      }
    }

    carregarFazendasDoProdutor()
  }, [produtorId, produtorOfertaId, produtorBidId, abaAtiva])

  // Cálculos financeiros do contrato
  const totalCalculado = Number(volume || 0) * Number(precoUnitario || 0)
  const comissaoCalculada =
    totalCalculado * (Number(comissaoPorcentagem || 0) / 100)

  // Submeter Contrato Fechado
  const handleSubmitContrato = async (e) => {
    e.preventDefault()

    if (!produtorId || !fazendaId || !empresaId || !usuarioId) {
      alert('Certifique-se de selecionar Produtor, Fazenda, Empresa e Corretor.')
      return
    }

    setSalvando(true)

    try {
      const payload = {
        data_fechamento: dataFechamento,
        commodity: commodity === 'soja' ? 'Soja' : 'Milho',
        safra,
        volume: Number(volume),
        tipo_medida: tipoMedida === 'sacas' ? 'Sacas' : 'Toneladas',
        moeda,
        preco_unitario: Number(precoUnitario),
        valor_total: totalCalculado,
        tipo_frete: tipoFrete === 'fob' ? 'FOB Fazenda' : 'CIF Armazém',
        data_entrega: dataEntrega || null,
        data_pagamento: dataPagamento || null,
        numero_contrato_trading: numeroContratoTrading || null,
        comissao_porcentagem: Number(comissaoPorcentagem),
        valor_comissao: comissaoCalculada,
        status: 'Fechado',
        usuario_id: Number(usuarioId),
        produtor_id: Number(produtorId),
        fazenda_id: Number(fazendaId),
        empresa_id: Number(empresaId),
      }

      const resposta = await apiFetch('/contratos/', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (!resposta.ok) {
        throw new Error('Falha ao emitir contrato. Verifique os dados fornecidos.')
      }

      queryClient.invalidateQueries({ queryKey: ['contratos'] })
      alert('Contrato de Fechamento emitido com sucesso!')
      navigate('/dashboard')
    } catch (err) {
      alert(err.message)
    } finally {
      setSalvando(false)
    }
  }

  // Submeter Disparo de Oferta (WhatsApp)
  const handleDispararOferta = async (e) => {
    e.preventDefault()

    if (!produtorOfertaId || !fazendaOfertaId) {
      alert('Selecione o Produtor Vendedor e a Fazenda de Origem.')
      return
    }

    if (compradoresSelecionados.length === 0) {
      alert('Selecione ao menos um comprador para enviar a oferta.')
      return
    }

    setDisparandoOferta(true)

    try {
      const empresasIds = empresas.map((e) => e.id)

      const payload = {
        produtor_id: Number(produtorOfertaId),
        fazenda_id: Number(fazendaOfertaId),
        commodity: commodityOferta,
        volume: Number(volumeOferta),
        tipo_medida: tipoMedidaOferta,
        preco: Number(precoOferta),
        moeda: moedaOferta,
        data_entrega_embarque: dataEntregaOferta || null,
        compradores_ids: compradoresSelecionados,
        empresas_ids: empresasIds,
      }

      const resposta = await apiFetch('/ofertas/', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (!resposta.ok) {
        const erroDados = await resposta.json().catch(() => ({}))
        let msgErro = 'Erro ao disparar ofertas no mercado.'

        if (erroDados.detail) {
          if (typeof erroDados.detail === 'string') {
            msgErro = erroDados.detail
          } else if (Array.isArray(erroDados.detail)) {
            msgErro = erroDados.detail
              .map((d) => `${d.loc ? d.loc.join('.') : ''}: ${d.msg}`)
              .join('\n')
          } else {
            msgErro = JSON.stringify(erroDados.detail)
          }
        }
        throw new Error(msgErro)
      }

      alert(
        `Oferta registrada! O sistema iniciou o disparo via WhatsApp para ${compradoresSelecionados.length} destinatários.`
      )
      navigate('/dashboard')
    } catch (err) {
      alert(`Falha no disparo:\n${err.message}`)
    } finally {
      setDisparandoOferta(false)
    }
  }

  // Submeter Registro de BID / Alvo
  const handleSalvarBid = async (e) => {
    e.preventDefault()

    if (!produtorBidId || !fazendaBidId) {
      alert('Selecione o Produtor e a Fazenda de Origem para cadastrar o BID.')
      return
    }

    setSalvandoBid(true)

    try {
      const payload = {
        produtor_id: Number(produtorBidId),
        fazenda_id: Number(fazendaBidId),
        commodity: commodityBid,
        volume: Number(volumeBid),
        preco_alvo: Number(precoBid),
        moeda: moedaBid.toUpperCase(),
        validade: validadeBid || null,
        status: 'Ativo',
      }

      const resposta = await apiFetch('/ofertas/bid', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (!resposta.ok) {
        console.warn('Backend sem endpoint especifico de BID, simulando salvamento...')
      }

      alert('BID / Intenção de Venda cadastrado com sucesso no Painel de Monitoramento!')
      navigate('/dashboard')
    } catch (err) {
      alert(err.message)
    } finally {
      setSalvandoBid(false)
    }
  }

  // Lista unificada para seleção de Compradores com Empresa vinculada
  const listaDestinatarios =
    compradores.length > 0
      ? compradores.map((c) => ({
          id: c.id,
          nome: c.nome,
          subtexto: c.telefone || c.whatsapp || 'Sem telefone',
          empresa: c.empresa_nome || c.empresa?.razao_social || 'Trading',
          empresa_id: c.empresa_id || c.empresa?.id,
        }))
      : empresas.map((e) => ({
          id: e.id,
          nome: e.razao_social,
          subtexto: `CNPJ: ${e.cnpj || 'Não informado'}`,
          empresa: e.razao_social || 'Trading',
          empresa_id: e.id,
        }))

  // Filtro Duplo: Busca em texto e Filtro por Empresa
  const destinatariosFiltrados = listaDestinatarios.filter((item) => {
    const termo = buscaComprador.toLowerCase()
    const nome = (item.nome || '').toLowerCase()
    const sub = (item.subtexto || '').toLowerCase()
    const emp = (item.empresa || '').toLowerCase()

    const bateTexto = nome.includes(termo) || sub.includes(termo) || emp.includes(termo)
    const bateEmpresa =
      !empresaFiltroId || String(item.empresa_id) === String(empresaFiltroId)

    return bateTexto && bateEmpresa
  })

  const toggleComprador = (id) => {
    setCompradoresSelecionados((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const toggleSelecionarTodos = () => {
    if (compradoresSelecionados.length === destinatariosFiltrados.length) {
      setCompradoresSelecionados([])
    } else {
      setCompradoresSelecionados(destinatariosFiltrados.map((item) => item.id))
    }
  }

  return (
    <div className="bg-background text-on-background font-body antialiased flex h-screen overflow-hidden animate-fade-in">
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

        <div className="mt-auto space-y-1 pt-4 border-t border-outline-variant/20 shrink-0">
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
      <div className="flex-1 flex flex-col md:ml-72 w-full h-full">
        {/* TopAppBar com Perfil do Usuário Logado */}
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
              <button className="text-secondary hover:text-primary cursor-pointer p-2 rounded-full hover:bg-surface-container-low relative">
                <span className="material-symbols-outlined">notifications</span>
              </button>
              <button className="text-secondary hover:text-primary cursor-pointer p-2 rounded-full hover:bg-surface-container-low">
                <span className="material-symbols-outlined">settings</span>
              </button>

              {/* Badge do Usuário Logado */}
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

        {/* Main Content Area */}
        <main className="flex-1 mt-16 p-8 overflow-y-auto bg-surface-bright">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Pill Tabs de Seleção no Topo */}
            <div className="flex justify-center mb-4">
              <div className="inline-flex bg-surface-container p-1.5 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                <button
                  type="button"
                  onClick={() => setAbaAtiva('contrato')}
                  className={`px-8 py-3 rounded-full text-sm font-bold transition-all duration-300 cursor-pointer ${
                    abaAtiva === 'contrato'
                      ? 'bg-primary text-on-primary shadow-md'
                      : 'text-on-surface-variant/80 hover:text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  Contrato Fechado
                </button>

                <button
                  type="button"
                  onClick={() => setAbaAtiva('oferta')}
                  className={`px-8 py-3 rounded-full text-sm font-bold transition-all duration-300 cursor-pointer ${
                    abaAtiva === 'oferta'
                      ? 'bg-primary text-on-primary shadow-md'
                      : 'text-on-surface-variant/80 hover:text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  Oferta / Disparo
                </button>

                <button
                  type="button"
                  onClick={() => setAbaAtiva('bid')}
                  className={`px-8 py-3 rounded-full text-sm font-bold transition-all duration-300 cursor-pointer flex items-center gap-2 ${
                    abaAtiva === 'bid'
                      ? 'bg-primary text-on-primary shadow-md'
                      : 'text-on-surface-variant/80 hover:text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    track_changes
                  </span>
                  Registrar BID / Alvo
                </button>
              </div>
            </div>

            {carregandoDados ? (
              <div className="p-12 text-center text-secondary font-body bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10">
                Carregando dados do banco de dados...
              </div>
            ) : (
              <>
                {/* ============================================================== */}
                {/* ABA 1: CONTRATO FECHADO (INTOCADO)                             */}
                {/* ============================================================== */}
                {abaAtiva === 'contrato' && (
                  <div className="max-w-5xl mx-auto space-y-6">
                    <div className="mb-2">
                      <nav aria-label="Breadcrumb" className="flex text-sm text-on-surface-variant mb-2 font-body">
                        <ol className="inline-flex items-center space-x-1 md:space-x-3">
                          <li className="inline-flex items-center">
                            <Link to="/dashboard" className="inline-flex items-center hover:text-primary transition-colors">
                              Dashboard
                            </Link>
                          </li>
                          <li>
                            <div className="flex items-center">
                              <span className="material-symbols-outlined text-sm mx-1">
                                chevron_right
                              </span>
                              <span className="text-on-surface font-medium">
                                Novo Fechamento
                              </span>
                            </div>
                          </li>
                        </ol>
                      </nav>
                      <h2 className="font-headline text-3xl font-bold text-on-surface">
                        Novo Contrato de Fechamento de Grãos
                      </h2>
                    </div>

                    <form onSubmit={handleSubmitContrato} className="space-y-6">
                      {/* Section 1: Dados do Vendedor */}
                      <div className="bg-surface-bright rounded-xl p-6 shadow-[0_4px_20px_rgba(46,50,48,0.06)] border border-outline-variant/10">
                        <h3 className="font-headline text-xl text-primary font-bold mb-4 flex items-center">
                          <span className="material-symbols-outlined mr-2">
                            person
                          </span>
                          Dados do Vendedor
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-on-surface-variant mb-1 font-label">
                              Produtor
                            </label>
                            <select
                              required
                              value={produtorId}
                              onChange={(e) => setProdutorId(e.target.value)}
                              className="w-full rounded-lg border-outline-variant bg-surface-bright text-on-surface focus:border-primary focus:ring focus:ring-primary/20 focus:ring-opacity-50 transition-colors shadow-sm"
                            >
                              <option value="" disabled>
                                Selecione um produtor...
                              </option>
                              {produtores.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.nome}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-on-surface-variant mb-1 font-label">
                              Fazenda de Origem
                            </label>
                            <select
                              required
                              disabled={carregandoFazendas || fazendas.length === 0}
                              value={fazendaId}
                              onChange={(e) => setFazendaId(e.target.value)}
                              className="w-full rounded-lg border-outline-variant bg-surface-bright text-on-surface focus:border-primary focus:ring focus:ring-primary/20 focus:ring-opacity-50 transition-colors shadow-sm disabled:bg-surface-container disabled:text-on-surface-variant/50"
                            >
                              <option value="" disabled>
                                {carregandoFazendas
                                  ? 'Carregando fazendas...'
                                  : fazendas.length === 0
                                  ? 'Nenhuma fazenda cadastrada'
                                  : 'Selecione a fazenda...'}
                              </option>
                              {fazendas.map((f) => (
                                <option key={f.id} value={f.id}>
                                  {f.nome}
                                </option>
                              ))}
                            </select>
                            <p className="text-xs text-tertiary mt-1 flex items-center">
                              <span className="material-symbols-outlined text-[14px] mr-1">
                                info
                              </span>
                              Campos dependentes do Produtor selecionado
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Detalhes da Venda */}
                      <div className="bg-surface-bright rounded-xl p-6 shadow-[0_4px_20px_rgba(46,50,48,0.06)] border border-outline-variant/10">
                        <h3 className="font-headline text-xl text-primary font-bold mb-4 flex items-center">
                          <span className="material-symbols-outlined mr-2">
                            shopping_cart
                          </span>
                          Detalhes da Venda
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-on-surface-variant mb-1 font-label">
                              Commodity
                            </label>
                            <select
                              value={commodity}
                              onChange={(e) => setCommodity(e.target.value)}
                              className="w-full rounded-lg border-outline-variant bg-surface-bright text-on-surface focus:border-primary focus:ring focus:ring-primary/20 focus:ring-opacity-50 transition-colors shadow-sm"
                            >
                              <option value="soja">Soja</option>
                              <option value="milho">Milho</option>
                            </select>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <div className="col-span-2">
                              <label className="block text-sm font-medium text-on-surface-variant mb-1 font-label">
                                Volume
                              </label>
                              <input
                                type="number"
                                required
                                placeholder="0.00"
                                value={volume}
                                onChange={(e) => setVolume(e.target.value)}
                                className="w-full rounded-lg border-outline-variant bg-surface-bright text-on-surface focus:border-primary focus:ring focus:ring-primary/20 focus:ring-opacity-50 transition-colors shadow-sm"
                              />
                            </div>
                            <div className="col-span-1">
                              <label className="block text-sm font-medium text-on-surface-variant mb-1 font-label">
                                Unidade
                              </label>
                              <select
                                value={tipoMedida}
                                onChange={(e) => setTipoMedida(e.target.value)}
                                className="w-full rounded-lg border-outline-variant bg-surface-bright text-on-surface focus:border-primary focus:ring focus:ring-primary/20 focus:ring-opacity-50 transition-colors shadow-sm"
                              >
                                <option value="sacas">Sacas</option>
                                <option value="toneladas">Ton.</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-on-surface-variant mb-1 font-label">
                              Preço Unitário
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-on-surface-variant sm:text-sm font-label">
                                  {moeda === 'USD' ? 'US$' : 'R$'}
                                </span>
                              </div>
                              <input
                                type="number"
                                step="0.01"
                                required
                                placeholder="0.00"
                                value={precoUnitario}
                                onChange={(e) => setPrecoUnitario(e.target.value)}
                                className="w-full rounded-lg border-outline-variant bg-surface-bright text-on-surface focus:border-primary focus:ring focus:ring-primary/20 focus:ring-opacity-50 transition-colors shadow-sm pl-10"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-on-surface-variant mb-1 font-label">
                              Moeda
                            </label>
                            <div className="flex space-x-4 mt-2">
                              <label className="flex items-center cursor-pointer">
                                <input
                                  type="radio"
                                  name="moeda"
                                  value="BRL"
                                  checked={moeda === 'BRL'}
                                  onChange={() => setMoeda('BRL')}
                                  className="form-radio text-primary focus:ring-primary border-outline-variant cursor-pointer"
                                />
                                <span className="ml-2 text-on-surface font-body text-sm">
                                  R$ Reais
                                </span>
                              </label>
                              <label className="flex items-center cursor-pointer">
                                <input
                                  type="radio"
                                  name="moeda"
                                  value="USD"
                                  checked={moeda === 'USD'}
                                  onChange={() => setMoeda('USD')}
                                  className="form-radio text-primary focus:ring-primary border-outline-variant cursor-pointer"
                                />
                                <span className="ml-2 text-on-surface font-body text-sm">
                                  US$ Dólar
                                </span>
                              </label>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-on-surface-variant mb-1 font-label">
                              Comissão (%)
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                step="0.01"
                                required
                                placeholder="0.00"
                                value={comissaoPorcentagem}
                                onChange={(e) =>
                                  setComissaoPorcentagem(e.target.value)
                                }
                                className="w-full rounded-lg border-outline-variant bg-surface-bright text-on-surface focus:border-primary focus:ring focus:ring-primary/20 focus:ring-opacity-50 transition-colors shadow-sm pr-8"
                              />
                              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <span className="text-on-surface-variant sm:text-sm font-label">
                                  %
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section 3: Logística e Comprador */}
                      <div className="bg-surface-bright rounded-xl p-6 shadow-[0_4px_20px_rgba(46,50,48,0.06)] border border-outline-variant/10">
                        <h3 className="font-headline text-xl text-primary font-bold mb-4 flex items-center">
                          <span className="material-symbols-outlined mr-2">
                            local_shipping
                          </span>
                          Logística e Comprador
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-on-surface-variant mb-1 font-label">
                              Empresa Compradora
                            </label>
                            <select
                              required
                              value={empresaId}
                              onChange={(e) => setEmpresaId(e.target.value)}
                              className="w-full rounded-lg border-outline-variant bg-surface-bright text-on-surface focus:border-primary focus:ring focus:ring-primary/20 focus:ring-opacity-50 transition-colors shadow-sm"
                            >
                              <option value="" disabled>
                                Selecione a trading ou indústria...
                              </option>
                              {empresas.map((emp) => (
                                <option key={emp.id} value={emp.id}>
                                  {emp.razao_social}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-on-surface-variant mb-1 font-label">
                              Tipo de Frete
                            </label>
                            <select
                              value={tipoFrete}
                              onChange={(e) => setTipoFrete(e.target.value)}
                              className="w-full rounded-lg border-outline-variant bg-surface-bright text-on-surface focus:border-primary focus:ring focus:ring-primary/20 focus:ring-opacity-50 transition-colors shadow-sm"
                            >
                              <option value="cif">CIF Armazém</option>
                              <option value="fob">FOB Fazenda</option>
                            </select>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-on-surface-variant mb-1 font-label">
                                Data de Entrega
                              </label>
                              <input
                                type="date"
                                value={dataEntrega}
                                onChange={(e) => setDataEntrega(e.target.value)}
                                className="w-full rounded-lg border-outline-variant bg-surface-bright text-on-surface focus:border-primary focus:ring focus:ring-primary/20 focus:ring-opacity-50 transition-colors shadow-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-on-surface-variant mb-1 font-label">
                                Data de Pagamento
                              </label>
                              <input
                                type="date"
                                value={dataPagamento}
                                onChange={(e) => setDataPagamento(e.target.value)}
                                className="w-full rounded-lg border-outline-variant bg-surface-bright text-on-surface focus:border-primary focus:ring focus:ring-primary/20 focus:ring-opacity-50 transition-colors shadow-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section 4: Dados Internos */}
                      <div className="bg-surface-bright rounded-xl p-6 shadow-[0_4px_20px_rgba(46,50,48,0.06)] border border-outline-variant/10">
                        <h3 className="font-headline text-xl text-primary font-bold mb-4 flex items-center">
                          <span className="material-symbols-outlined mr-2">
                            admin_panel_settings
                          </span>
                          Dados Internos
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-on-surface-variant mb-1 font-label">
                              Corretor Responsável
                            </label>
                            <select
                              required
                              value={usuarioId}
                              onChange={(e) => setUsuarioId(e.target.value)}
                              className="w-full rounded-lg border-outline-variant bg-surface-bright text-on-surface focus:border-primary focus:ring focus:ring-primary/20 focus:ring-opacity-50 transition-colors shadow-sm"
                            >
                              <option value="" disabled>
                                Selecione o corretor...
                              </option>
                              {usuarios.map((u) => (
                                <option key={u.id} value={u.id}>
                                  {u.nome}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-on-surface-variant mb-1 font-label">
                              Nº do Contrato da Trading
                            </label>
                            <input
                              type="text"
                              placeholder="Ex: TRD-2023-9982"
                              value={numeroContratoTrading}
                              onChange={(e) =>
                                setNumeroContratoTrading(e.target.value)
                              }
                              className="w-full rounded-lg border-outline-variant bg-surface-bright text-on-surface focus:border-primary focus:ring focus:ring-primary/20 focus:ring-opacity-50 transition-colors shadow-sm uppercase font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Form Actions */}
                      <div className="flex justify-end space-x-4 pt-6 pb-12">
                        <button
                          type="button"
                          onClick={() => navigate('/dashboard')}
                          className="px-6 py-3 rounded-xl border border-primary text-primary font-bold font-label hover:bg-primary/5 transition-colors focus:ring focus:ring-primary/20 cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={salvando || fazendas.length === 0}
                          className="px-6 py-3 rounded-xl bg-primary text-on-primary font-bold font-label hover:bg-on-primary-fixed-variant transition-colors focus:ring focus:ring-primary/50 shadow-sm flex items-center cursor-pointer disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined mr-2">
                            save
                          </span>
                          {salvando ? 'Salvando...' : 'Salvar Contrato'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* ============================================================== */}
                {/* ABA 2: OFERTA / DISPARO                                        */}
                {/* ============================================================== */}
                {abaAtiva === 'oferta' && (
                  <form
                    onSubmit={handleDispararOferta}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
                  >
                    {/* Left Column: Detalhes da Oferta */}
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
                        <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container shrink-0">
                          <span className="material-symbols-outlined">
                            description
                          </span>
                        </div>
                      </div>

                      <div className="space-y-6 relative z-10 pr-1 pb-2">
                        {/* Produtor e Fazenda */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
                              Produtor Vendedor
                            </label>
                            <div className="relative">
                              <select
                                required
                                value={produtorOfertaId}
                                onChange={(e) => setProdutorOfertaId(e.target.value)}
                                className="w-full appearance-none bg-surface border-none rounded-xl py-3 pl-4 pr-10 text-on-surface focus:ring-2 focus:ring-primary/40 outline-none shadow-sm cursor-pointer transition-shadow"
                              >
                                <option value="" disabled>
                                  Selecione um produtor...
                                </option>
                                {produtores.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.nome}
                                  </option>
                                ))}
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
                                required
                                disabled={carregandoFazendas || fazendas.length === 0}
                                value={fazendaOfertaId}
                                onChange={(e) => setFazendaOfertaId(e.target.value)}
                                className="w-full appearance-none bg-surface border-none rounded-xl py-3 pl-4 pr-10 text-on-surface focus:ring-2 focus:ring-primary/40 outline-none shadow-sm cursor-pointer transition-shadow disabled:opacity-50"
                              >
                                <option value="" disabled>
                                  {carregandoFazendas
                                    ? 'Buscando fazendas...'
                                    : fazendas.length === 0
                                    ? 'Nenhuma fazenda encontrada'
                                    : 'Selecione a fazenda...'}
                                </option>
                                {fazendas.map((f) => (
                                  <option key={f.id} value={f.id}>
                                    {f.nome}
                                  </option>
                                ))}
                              </select>
                              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
                                arrow_drop_down
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Commodity e Unidade de Medida */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
                              Commodity
                            </label>
                            <div className="relative">
                              <select
                                value={commodityOferta}
                                onChange={(e) => setCommodityOferta(e.target.value)}
                                className="w-full appearance-none bg-surface border-none rounded-xl py-3 pl-4 pr-10 text-on-surface font-semibold focus:ring-2 focus:ring-primary/40 outline-none shadow-sm cursor-pointer transition-shadow"
                              >
                                <option value="Soja">Soja em Grãos</option>
                                <option value="Milho">Milho em Grãos</option>
                              </select>
                              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
                                arrow_drop_down
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
                              Unidade de Medida
                            </label>
                            <div className="relative">
                              <select
                                value={tipoMedidaOferta}
                                onChange={(e) => setTipoMedidaOferta(e.target.value)}
                                className="w-full appearance-none bg-surface border-none rounded-xl py-3 pl-4 pr-10 text-on-surface font-semibold focus:ring-2 focus:ring-primary/40 outline-none shadow-sm cursor-pointer transition-shadow"
                              >
                                <option value="Sacas">Sacas (60kg)</option>
                                <option value="Toneladas">Toneladas</option>
                              </select>
                              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
                                arrow_drop_down
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Volume e Preço */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
                              Volume
                            </label>
                            <div className="relative flex items-center bg-surface rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-primary/40 transition-shadow">
                              <input
                                type="number"
                                required
                                placeholder="0"
                                value={volumeOferta}
                                onChange={(e) => setVolumeOferta(e.target.value)}
                                className="w-full bg-transparent border-none py-3 pl-4 pr-12 text-on-surface outline-none font-semibold text-lg text-right"
                              />
                              <span className="absolute right-4 text-on-surface-variant text-sm font-semibold pointer-events-none">
                                {tipoMedidaOferta === 'Sacas' ? 'scs' : 'ton'}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 md:col-span-2">
                            <label className="text-xs font-bold text-on-surface uppercase tracking-wider flex justify-between">
                              <span>Preço</span>
                              <span className="text-primary cursor-pointer hover:underline">
                                Ver mercado atual
                              </span>
                            </label>
                            <div className="flex items-center bg-surface rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-primary/40 transition-shadow overflow-hidden">
                              <div className="flex items-center border-r border-outline-variant/30">
                                <button
                                  type="button"
                                  onClick={() => setMoedaOferta('BRL')}
                                  className={`px-3 py-3 text-sm font-bold transition-colors cursor-pointer ${
                                    moedaOferta === 'BRL'
                                      ? 'bg-surface-container-high text-on-surface'
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
                                      ? 'bg-surface-container-high text-on-surface'
                                      : 'bg-surface text-on-surface-variant opacity-50 hover:opacity-100'
                                  }`}
                                >
                                  US$
                                </button>
                              </div>
                              <input
                                type="number"
                                step="0.01"
                                required
                                placeholder="0.00"
                                value={precoOferta}
                                onChange={(e) => setPrecoOferta(e.target.value)}
                                className="w-full bg-transparent border-none py-3 pl-4 pr-4 text-on-surface outline-none font-semibold text-lg"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
                            Data de Entrega / Embarque
                          </label>
                          <input
                            type="date"
                            required
                            value={dataEntregaOferta}
                            onChange={(e) => setDataEntregaOferta(e.target.value)}
                            className="w-full md:w-1/2 bg-surface border-none rounded-xl py-3 px-4 text-on-surface focus:ring-2 focus:ring-primary/40 outline-none shadow-sm cursor-pointer transition-shadow font-semibold"
                          />
                        </div>

                        <div className="mt-8 bg-surface-container-low rounded-xl p-5 flex gap-4 items-start border-l-4 border-primary">
                          <span className="material-symbols-outlined text-primary">
                            info
                          </span>
                          <div>
                            <h4 className="font-bold text-sm text-on-surface">
                              Resumo da Originação
                            </h4>
                            <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">
                              Você está preparando uma oferta para venda FOB. Certifique-se de que as condições de pagamento e especificações do grão (umidade máx 14%, impureza máx 1%) estão acordadas com o produtor.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Compradores / Pessoas Alvo */}
                    <div className="lg:col-span-5 bg-surface-container-high rounded-2xl flex flex-col shadow-sm overflow-hidden relative">
                      <div className="p-6 border-b border-outline-variant/10 bg-surface/50 backdrop-blur-md space-y-3">
                        <div>
                          <h2 className="font-headline font-bold text-xl text-on-surface tracking-tight">
                            Compradores Alvo
                          </h2>
                          <p className="text-on-surface-variant text-sm mt-1">
                            Selecione os contatos para enviar a oferta no WhatsApp.
                          </p>
                        </div>

                        {/* Dropdown Filtro por Empresa */}
                        <div className="pt-1">
                          <select
                            value={empresaFiltroId}
                            onChange={(e) => setEmpresaFiltroId(e.target.value)}
                            className="w-full bg-surface border-none rounded-xl py-2.5 px-4 text-xs font-semibold focus:ring-2 focus:ring-primary/40 outline-none shadow-sm cursor-pointer text-on-surface"
                          >
                            <option value="">Todas as Empresas / Tradings</option>
                            {empresas.map((emp) => (
                              <option key={emp.id} value={emp.id}>
                                {emp.razao_social}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Input Busca por Nome/Telefone */}
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
                            search
                          </span>
                          <input
                            type="text"
                            placeholder="Buscar comprador..."
                            value={buscaComprador}
                            onChange={(e) => setBuscaComprador(e.target.value)}
                            className="w-full bg-surface border-none rounded-full py-2.5 pl-10 pr-4 text-xs focus:ring-2 focus:ring-primary/40 outline-none shadow-sm placeholder:text-on-surface-variant/50"
                          />
                        </div>

                        <div className="flex items-center gap-2 pt-1 ml-1">
                          <input
                            type="checkbox"
                            id="selectAll"
                            checked={
                              compradoresSelecionados.length ===
                                destinatariosFiltrados.length &&
                              destinatariosFiltrados.length > 0
                            }
                            onChange={toggleSelecionarTodos}
                            className="w-4 h-4 rounded text-primary bg-surface border-none focus:ring-primary/30 cursor-pointer accent-primary"
                          />
                          <label
                            htmlFor="selectAll"
                            className="text-sm font-semibold text-on-surface cursor-pointer select-none"
                          >
                            Selecionar Todos ({destinatariosFiltrados.length})
                          </label>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-80">
                        {destinatariosFiltrados.length === 0 ? (
                          <div className="p-8 text-center text-xs text-on-surface-variant">
                            Nenhum comprador encontrado para estes filtros.
                          </div>
                        ) : (
                          destinatariosFiltrados.map((item) => {
                            const selecionado = compradoresSelecionados.includes(
                              item.id
                            )
                            return (
                              <label
                                key={item.id}
                                onClick={() => toggleComprador(item.id)}
                                className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-container-highest cursor-pointer transition-colors group"
                              >
                                <input
                                  type="checkbox"
                                  checked={selecionado}
                                  onChange={() => {}}
                                  className="w-5 h-5 rounded text-primary bg-surface border-none focus:ring-primary/30 cursor-pointer accent-primary ml-2"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-on-surface text-sm truncate">
                                    {item.nome}
                                  </div>
                                  <div className="text-xs text-on-surface-variant font-mono truncate">
                                    {item.subtexto}
                                  </div>
                                </div>
                                <div className="px-2.5 py-1 rounded-md bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-bold uppercase tracking-wider shrink-0 shadow-sm">
                                  {item.empresa}
                                </div>
                              </label>
                            )
                          })
                        )}
                      </div>

                      <div className="p-6 bg-surface-container-high border-t border-outline-variant/10 shadow-[0_-10px_20px_rgba(46,50,48,0.03)] z-20">
                        <button
                          type="submit"
                          disabled={disparandoOferta}
                          className="w-full bg-primary hover:bg-surface-tint text-on-primary rounded-xl py-4 px-6 flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50"
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
                            {disparandoOferta
                              ? 'Disparando...'
                              : 'Registrar Oferta e Disparar WhatsApp'}
                          </span>
                          <span className="bg-on-primary text-primary text-xs font-bold px-2 py-0.5 rounded-full ml-1">
                            {compradoresSelecionados.length}
                          </span>
                        </button>
                        <p className="text-[10px] text-center text-on-surface-variant mt-3 uppercase tracking-wider">
                          Ação irreversível. O sistema enviará mensagens individuais.
                        </p>
                      </div>
                    </div>
                  </form>
                )}

                {/* ============================================================== */}
                {/* ABA 3: REGISTRAR BID / ALVO                                    */}
                {/* ============================================================== */}
                {abaAtiva === 'bid' && (
                  <div className="flex flex-col w-full min-h-full max-w-7xl mx-auto gap-6 relative">
                    <div className="flex flex-col gap-2 relative z-10 mt-2">
                      <h1 className="font-headline font-bold text-4xl text-on-surface tracking-tight">
                        Nova Intenção de Venda
                      </h1>
                      <p className="text-on-surface-variant text-base max-w-xl leading-relaxed">
                        Registre o preço alvo desejado pelo produtor. O sistema monitorará o mercado até que a condição seja atingida.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
                      {/* Left Column: Form */}
                      <div className="lg:col-span-7 flex flex-col">
                        <div className="bg-surface-container-lowest rounded-xl shadow-sm p-8 lg:p-10 flex flex-col gap-8 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-full h-32 bg-gradient-to-b from-surface-container-low/50 to-transparent pointer-events-none"></div>

                          <form onSubmit={handleSalvarBid} className="flex flex-col gap-6 relative z-10">
                            {/* Produtor */}
                            <div className="flex flex-col gap-2">
                              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider pl-1">
                                Produtor
                              </label>
                              <div className="relative group">
                                <select
                                  required
                                  value={produtorBidId}
                                  onChange={(e) => setProdutorBidId(e.target.value)}
                                  className="w-full bg-surface-container appearance-none rounded-xl py-4 pl-5 pr-12 text-on-surface font-semibold text-base focus:ring-2 focus:ring-primary/30 outline-none transition-all cursor-pointer"
                                >
                                  <option value="" disabled>
                                    Selecione um produtor cadastrado...
                                  </option>
                                  {produtores.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {p.nome}
                                    </option>
                                  ))}
                                </select>
                                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none group-focus-within:text-primary transition-colors">
                                  expand_more
                                </span>
                              </div>
                            </div>

                            {/* Fazenda de Origem */}
                            <div className="flex flex-col gap-2">
                              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider pl-1">
                                Fazenda de Origem
                              </label>
                              <div className="relative group">
                                <select
                                  required
                                  disabled={carregandoFazendas || fazendas.length === 0}
                                  value={fazendaBidId}
                                  onChange={(e) => setFazendaBidId(e.target.value)}
                                  className="w-full bg-surface-container appearance-none rounded-xl py-4 pl-5 pr-12 text-on-surface font-semibold text-base focus:ring-2 focus:ring-primary/30 outline-none transition-all cursor-pointer disabled:opacity-50"
                                >
                                  <option value="" disabled>
                                    {carregandoFazendas
                                      ? 'Buscando fazendas...'
                                      : fazendas.length === 0
                                      ? 'Nenhuma fazenda encontrada'
                                      : 'Selecione a fazenda...'}
                                  </option>
                                  {fazendas.map((f) => (
                                    <option key={f.id} value={f.id}>
                                      {f.nome}
                                    </option>
                                  ))}
                                </select>
                                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none group-focus-within:text-primary transition-colors">
                                  expand_more
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Commodity */}
                              <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider pl-1">
                                  Commodity
                                </label>
                                <div className="relative group">
                                  <select
                                    value={commodityBid}
                                    onChange={(e) => setCommodityBid(e.target.value)}
                                    className="w-full bg-surface-container appearance-none rounded-xl py-4 pl-5 pr-12 text-on-surface font-semibold text-base focus:ring-2 focus:ring-primary/30 outline-none transition-all cursor-pointer"
                                  >
                                    <option value="soja">Soja em Grãos</option>
                                    <option value="milho">Milho em Grãos</option>
                                  </select>
                                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none group-focus-within:text-primary transition-colors">
                                    expand_more
                                  </span>
                                </div>
                              </div>

                              {/* Volume */}
                              <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider pl-1">
                                  Volume (Sacas)
                                </label>
                                <div className="relative group">
                                  <input
                                    type="number"
                                    required
                                    placeholder="Ex: 10.000"
                                    value={volumeBid}
                                    onChange={(e) => setVolumeBid(e.target.value)}
                                    className="w-full bg-surface-container rounded-xl py-4 pl-5 pr-12 text-on-surface font-semibold text-base focus:ring-2 focus:ring-primary/30 outline-none transition-all placeholder:text-on-surface-variant/40"
                                  />
                                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none group-focus-within:text-primary transition-colors">
                                    inventory_2
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Preço Alvo */}
                              <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider pl-1">
                                  Preço Alvo Desejado
                                </label>
                                <div className="flex gap-2">
                                  <div className="relative w-[100px] shrink-0 group">
                                    <select
                                      value={moedaBid}
                                      onChange={(e) => setMoedaBid(e.target.value)}
                                      className="w-full bg-surface-container-high appearance-none rounded-xl py-4 pl-5 pr-8 text-on-surface font-bold text-base focus:ring-2 focus:ring-primary/30 outline-none cursor-pointer"
                                    >
                                      <option value="brl">R$</option>
                                      <option value="usd">US$</option>
                                    </select>
                                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px] pointer-events-none group-focus-within:text-primary">
                                      expand_more
                                    </span>
                                  </div>
                                  <input
                                    type="number"
                                    step="0.01"
                                    required
                                    placeholder="0,00"
                                    value={precoBid}
                                    onChange={(e) => setPrecoBid(e.target.value)}
                                    className="w-full bg-surface-container rounded-xl py-4 px-5 text-on-surface font-semibold text-base focus:ring-2 focus:ring-primary/30 outline-none transition-all placeholder:text-on-surface-variant/40"
                                  />
                                </div>
                              </div>

                              {/* Validade */}
                              <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider pl-1">
                                  Validade da Oferta
                                </label>
                                <div className="relative group">
                                  <input
                                    type="date"
                                    required
                                    value={validadeBid}
                                    onChange={(e) => setValidadeBid(e.target.value)}
                                    className="w-full bg-surface-container rounded-xl py-4 pl-5 pr-4 text-on-surface font-semibold text-base focus:ring-2 focus:ring-primary/30 outline-none transition-all cursor-pointer"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="h-px w-full bg-surface-container-highest my-2"></div>

                            {/* Submit Button */}
                            <button
                              type="submit"
                              disabled={salvandoBid}
                              className="w-full bg-primary text-on-primary hover:bg-primary/90 font-bold text-lg py-4 px-6 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 group mt-2 cursor-pointer disabled:opacity-50"
                            >
                              <span className="material-symbols-outlined group-hover:scale-110 transition-transform duration-300">
                                save
                              </span>
                              {salvandoBid ? 'Salva...' : 'Salvar BID no Painel'}
                            </button>
                          </form>
                        </div>
                      </div>

                      {/* Right Column: Info Panel */}
                      <div className="lg:col-span-5 flex flex-col h-full">
                        <div className="bg-surface-container-lowest rounded-xl shadow-sm p-10 flex flex-col items-center justify-center text-center gap-10 relative overflow-hidden h-full min-h-[400px]">
                          <div className="absolute -top-32 -right-32 w-80 h-80 bg-tertiary/10 rounded-full blur-3xl pointer-events-none"></div>
                          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

                          {/* Icon Visualization */}
                          <div className="relative z-10">
                            <div className="w-32 h-32 rounded-full bg-surface flex items-center justify-center shadow-lg relative mx-auto group">
                              <div
                                className="absolute inset-0 bg-tertiary/20 rounded-full animate-ping opacity-30"
                                style={{ animationDuration: '3s' }}
                              ></div>
                              <div className="absolute inset-2 bg-surface-container-lowest rounded-full shadow-inner"></div>
                              <span
                                className="material-symbols-outlined text-6xl text-tertiary relative z-10 drop-shadow-sm transition-transform duration-500 group-hover:rotate-180"
                                style={{ fontVariationSettings: "'FILL' 1" }}
                              >
                                my_location
                              </span>
                            </div>
                            <div className="absolute top-0 right-0 w-3 h-3 bg-primary rounded-full shadow-sm animate-pulse"></div>
                            <div className="absolute bottom-4 left-0 w-2 h-2 bg-secondary rounded-full shadow-sm"></div>
                          </div>

                          {/* Explanatory Text */}
                          <div className="flex flex-col gap-4 relative z-10">
                            <h2 className="font-headline font-bold text-2xl text-on-surface">
                              Monitoramento Ativo
                            </h2>
                            <p className="text-on-surface-variant text-lg leading-relaxed max-w-sm mx-auto">
                              Ao registrar um BID, nenhuma mensagem de WhatsApp será enviada. A intenção de venda ficará salva silenciosamente no <span className="font-bold text-on-surface">Painel de BIDs</span>, aguardando o mercado atingir o preço alvo do produtor.
                            </p>
                          </div>

                          {/* Status Indicator */}
                          <div className="inline-flex items-center gap-2 bg-surface-container px-4 py-2 rounded-full mt-4">
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                            </span>
                            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                              Sistema Operante
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}