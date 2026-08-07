import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiFetch } from '../services/api'

export default function Ofertas() {
  const navigate = useNavigate()

  // Estados de Dados do Banco
  const [ofertas, setOfertas] = useState([])
  const [produtores, setProdutores] = useState([])
  const [fazendas, setFazendas] = useState([])
  const [compradores, setCompradores] = useState([])

  // Estados de Carregamento
  const [carregando, setCarregando] = useState(true)
  const [carregandoFazendas, setCarregandoFazendas] = useState(false)
  const [disparando, setDisparando] = useState(false)
  const [modalAberto, setModalAberto] = useState(false)

  // Campos do Formulário de Oferta
  const [produtorId, setProdutorId] = useState('')
  const [fazendaId, setFazendaId] = useState('')
  const [volume, setVolume] = useState('')
  const [preco, setPreco] = useState('')
  const [moeda, setMoeda] = useState('BRL')
  const [dataEmbarque, setDataEmbarque] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [compradoresSelecionados, setCompradoresSelecionados] = useState([])

  // 1. Carrega Ofertas, Produtores e Compradores ao abrir a página
  const carregarDadosIniciais = async () => {
    setCarregando(true)
    try {
      const [resOfertas, resProdutores, resCompradores] = await Promise.all([
        apiFetch('/ofertas/'),
        apiFetch('/produtores/'),
        apiFetch('/compradores/'),
      ])

      if (resOfertas.ok) setOfertas(await resOfertas.json())
      if (resProdutores.ok) {
        const dadosProd = await resProdutores.json()
        setProdutores(dadosProd)
        if (dadosProd.length > 0) setProdutorId(dadosProd[0].id)
      }
      if (resCompradores.ok) setCompradores(await resCompradores.json())
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarDadosIniciais()
  }, [])

  // 2. Busca as fazendas do produtor quando ele for alterado
  useEffect(() => {
    if (!produtorId) {
      setFazendas([])
      setFazendaId('')
      return
    }

    async function carregarFazendas() {
      setCarregandoFazendas(true)
      try {
        const res = await apiFetch(`/produtores/${produtorId}/fazendas`)
        if (res.ok) {
          const dados = await res.json()
          setFazendas(dados)
          if (dados.length > 0) setFazendaId(dados[0].id)
          else setFazendaId('')
        }
      } catch (err) {
        console.error('Erro ao buscar fazendas:', err)
      } finally {
        setCarregandoFazendas(false)
      }
    }

    carregarFazendas()
  }, [produtorId])

  // Alternar seleção de compradores para envio do WhatsApp
  const toggleComprador = (id) => {
    if (compradoresSelecionados.includes(id)) {
      setCompradoresSelecionados(compradoresSelecionados.filter((item) => item !== id))
    } else {
      setCompradoresSelecionados([...compradoresSelecionados, id])
    }
  }

  const selecionarTodosCompradores = () => {
    if (compradoresSelecionados.length === compradores.length) {
      setCompradoresSelecionados([])
    } else {
      setCompradoresSelecionados(compradores.map((c) => c.id))
    }
  }

  // 3. Cadastrar Oferta e Disparar WhatsApp no Backend
  const handleCriarOferta = async (e) => {
    e.preventDefault()

    if (!produtorId || !fazendaId) {
      alert('Selecione o Produtor e a Fazenda!')
      return
    }

    setDisparando(true)

    try {
      const payload = {
        produtor_id: Number(produtorId),
        fazenda_id: Number(fazendaId),
        volume: Number(volume),
        preco: Number(preco),
        moeda: moeda,
        data_entrega_embarque: dataEmbarque,
        compradores_ids: compradoresSelecionados,
      }

      const resposta = await apiFetch('/ofertas/', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (!resposta.ok) {
        throw new Error('Falha ao criar oferta. Verifique se seu usuário tem um telefone cadastrado.')
      }

      alert(
        compradoresSelecionados.length > 0
          ? 'Oferta cadastrada e mensagens de WhatsApp enviadas com sucesso!'
          : 'Oferta cadastrada com sucesso!'
      )

      setModalAberto(false)
      setVolume('')
      setPreco('')
      setCompradoresSelecionados([])
      carregarDadosIniciais()
    } catch (err) {
      alert(err.message)
    } finally {
      setDisparando(false)
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
            <span className="material-symbols-outlined mr-3">campaign</span>
            Mural de Ofertas
          </Link>
          <Link
            to="/relatorios"
            className="flex items-center px-4 py-3 text-on-surface-variant hover:bg-surface-variant/50 rounded-lg text-label-lg active:scale-95 transition-transform duration-150"
          >
            <span className="material-symbols-outlined mr-3">assessment</span>
            Relatórios
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

      {/* Main Wrapper */}
      <div className="flex-1 flex flex-col h-full md:ml-72 overflow-hidden">
        <header className="fixed top-0 right-0 h-16 z-40 bg-background/80 backdrop-blur-md border-b border-outline-variant/20 md:left-72">
          <div className="flex justify-between items-center px-8 h-full w-full">
            <h1 className="font-headline font-bold text-lg text-on-surface">
              Mural e Disparo de Ofertas
            </h1>
            <button
              onClick={() => setModalAberto(true)}
              className="bg-primary text-on-primary px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary/90 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">add_alert</span>
              Nova Oferta
            </button>
          </div>
        </header>

        {/* Content Canvas */}
        <main className="flex-1 mt-16 p-8 overflow-y-auto bg-surface-container-lowest">
          <div className="max-w-7xl mx-auto space-y-8 pb-16">
            <div>
              <h2 className="text-3xl font-headline font-bold text-on-surface">
                Ofertas Ativas
              </h2>
              <p className="text-secondary text-sm mt-1">
                Lote de grãos disponíveis para negociação direta no WhatsApp.
              </p>
            </div>

            <div className="bg-surface-bright rounded-2xl border border-outline-variant/20 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-outline-variant/20">
                <h3 className="font-headline font-bold text-lg text-on-surface">
                  Listagem de Lotes Ofertados
                </h3>
              </div>

              <div className="overflow-x-auto">
                {carregando ? (
                  <div className="p-12 text-center text-secondary">
                    Carregando ofertas do servidor...
                  </div>
                ) : ofertas.length === 0 ? (
                  <div className="p-12 text-center text-secondary">
                    Nenhuma oferta cadastrada no momento.
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low text-secondary text-xs font-bold uppercase">
                        <th className="py-3 px-6 border-b border-outline-variant/20">ID</th>
                        <th className="py-3 px-6 border-b border-outline-variant/20">Volume</th>
                        <th className="py-3 px-6 border-b border-outline-variant/20">Preço Ofertado</th>
                        <th className="py-3 px-6 border-b border-outline-variant/20">Embarque</th>
                        <th className="py-3 px-6 border-b border-outline-variant/20">ID Produtor</th>
                        <th className="py-3 px-6 border-b border-outline-variant/20">ID Fazenda</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {ofertas.map((o) => (
                        <tr
                          key={o.id}
                          className="border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors"
                        >
                          <td className="py-4 px-6 font-mono text-secondary">#{o.id}</td>
                          <td className="py-4 px-6 font-bold text-on-surface font-mono">
                            {Number(o.volume).toLocaleString('pt-BR')} sacas
                          </td>
                          <td className="py-4 px-6 font-bold text-primary font-mono">
                            {o.moeda === 'USD' ? '$' : 'R$'}{' '}
                            {Number(o.preco).toFixed(2)} / sc
                          </td>
                          <td className="py-4 px-6 text-on-surface">{o.data_entrega_embarque}</td>
                          <td className="py-4 px-6 text-secondary font-mono">#{o.produtor_id}</td>
                          <td className="py-4 px-6 text-secondary font-mono">#{o.fazenda_id}</td>
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

      {/* MODAL: CRIAR OFERTA E DISPARAR WHATSAPP */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-bright p-6 rounded-2xl shadow-xl max-w-2xl w-full space-y-6 border border-outline-variant/30 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">chat</span>
                <h3 className="text-xl font-headline font-bold text-on-surface">
                  Nova Oferta & Disparo WhatsApp
                </h3>
              </div>
              <button
                onClick={() => setModalAberto(false)}
                className="text-secondary hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCriarOferta} className="space-y-6">
              {/* Seleção do Origem */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-secondary mb-1">
                    Produtor
                  </label>
                  <select
                    required
                    value={produtorId}
                    onChange={(e) => setProdutorId(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-sm"
                  >
                    {produtores.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-secondary mb-1">
                    Fazenda
                  </label>
                  <select
                    required
                    disabled={carregandoFazendas || fazendas.length === 0}
                    value={fazendaId}
                    onChange={(e) => setFazendaId(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-sm disabled:opacity-50"
                  >
                    {carregandoFazendas ? (
                      <option>Buscando fazendas...</option>
                    ) : fazendas.length === 0 ? (
                      <option>Nenhuma fazenda cadastrada</option>
                    ) : (
                      fazendas.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.nome}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* Condições comerciais */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-secondary mb-1">
                    Volume (Sacas)
                  </label>
                  <input
                    type="number"
                    required
                    value={volume}
                    onChange={(e) => setVolume(e.target.value)}
                    placeholder="Ex: 3000"
                    className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-secondary mb-1">
                    Preço Unitário
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={preco}
                    onChange={(e) => setPreco(e.target.value)}
                    placeholder="Ex: 120.00"
                    className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-secondary mb-1">
                    Moeda
                  </label>
                  <select
                    value={moeda}
                    onChange={(e) => setMoeda(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-sm font-bold"
                  >
                    <option value="BRL">BRL (R$)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-secondary mb-1">
                  Data Limite de Embarque
                </label>
                <input
                  type="date"
                  required
                  value={dataEmbarque}
                  onChange={(e) => setDataEmbarque(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-sm"
                />
              </div>

              {/* SELEÇÃO DE COMPRADORES PARA WHATSAPP */}
              <div className="border-t border-outline-variant/20 pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-sm text-on-surface">
                      Enviar no WhatsApp dos Compradores?
                    </h4>
                    <p className="text-xs text-secondary">
                      Marque quem receberá a mensagem automática via Evolution API.
                    </p>
                  </div>
                  {compradores.length > 0 && (
                    <button
                      type="button"
                      onClick={selecionarTodosCompradores}
                      className="text-xs text-primary font-bold hover:underline cursor-pointer"
                    >
                      {compradoresSelecionados.length === compradores.length
                        ? 'Desmarcar Todos'
                        : 'Selecionar Todos'}
                    </button>
                  )}
                </div>

                <div className="max-h-40 overflow-y-auto space-y-2 border border-outline-variant/30 rounded-xl p-3 bg-surface-container-low">
                  {compradores.length === 0 ? (
                    <p className="text-xs text-secondary text-center py-2">
                      Nenhum comprador cadastrado no sistema.
                    </p>
                  ) : (
                    compradores.map((c) => (
                      <label
                        key={c.id}
                        className="flex items-center justify-between p-2 hover:bg-surface-bright rounded-lg cursor-pointer text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={compradoresSelecionados.includes(c.id)}
                            onChange={() => toggleComprador(c.id)}
                            className="w-4 h-4 text-primary rounded focus:ring-primary"
                          />
                          <span className="font-medium text-on-surface">{c.nome}</span>
                        </div>
                        <span className="text-xs text-secondary font-mono">
                          {c.telefone}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* AÇÕES */}
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
                  disabled={disparando || fazendas.length === 0}
                  className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-bold hover:bg-primary/90 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">send</span>
                  {disparando ? 'Disparando WhatsApp...' : 'Criar & Disparar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}