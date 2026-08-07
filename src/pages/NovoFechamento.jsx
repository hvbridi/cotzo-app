import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiFetch } from '../services/api'

export default function Fechamento() {
  const navigate = useNavigate()

  // Listas vindas do Banco de Dados
  const [produtores, setProdutores] = useState([])
  const [fazendas, setFazendas] = useState([])
  const [empresas, setEmpresas] = useState([])
  const [usuarios, setUsuarios] = useState([])

  // Estados de Carregamento
  const [carregandoDados, setCarregandoDados] = useState(true)
  const [carregandoFazendas, setCarregandoFazendas] = useState(false)
  const [salvando, setSalvando] = useState(false)

  // Campos do Formulário do Contrato
  const [dataFechamento, setDataFechamento] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [commodity, setCommodity] = useState('Soja')
  const [safra, setSafra] = useState('2025/2026')
  const [volume, setVolume] = useState('')
  const [tipoMedida, setTipoMedida] = useState('Sacas')
  const [moeda, setMoeda] = useState('BRL')
  const [precoUnitario, setPrecoUnitario] = useState('')
  const [tipoFrete, setTipoFrete] = useState('FOB Fazenda')
  const [dataEntrega, setDataEntrega] = useState('')
  const [dataPagamento, setDataPagamento] = useState('')
  const [numeroContratoTrading, setNumeroContratoTrading] = useState('')
  const [comissaoPorcentagem, setComissaoPorcentagem] = useState('1.0')
  const [observacoes, setObservacoes] = useState('')

  // IDs Selecionados
  const [produtorId, setProdutorId] = useState('')
  const [fazendaId, setFazendaId] = useState('')
  const [empresaId, setEmpresaId] = useState('')
  const [usuarioId, setUsuarioId] = useState('')

  // 1. Carrega Produtores, Empresas e Usuários ao abrir a página
  useEffect(() => {
    async function carregarDadosIniciais() {
      setCarregandoDados(true)
      try {
        const [resProdutores, resEmpresas, resUsuarios] = await Promise.all([
          apiFetch('/produtores/'),
          apiFetch('/empresas/'),
          apiFetch('/usuarios/'),
        ])

        if (resProdutores.ok) {
          const dadosProdutores = await resProdutores.json()
          setProdutores(dadosProdutores)
          if (dadosProdutores.length > 0) setProdutorId(dadosProdutores[0].id)
        }

        if (resEmpresas.ok) {
          const dadosEmpresas = await resEmpresas.json()
          setEmpresas(dadosEmpresas)
          if (dadosEmpresas.length > 0) setEmpresaId(dadosEmpresas[0].id)
        }

        if (resUsuarios.ok) {
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

  // 2. Busca as Fazendas vinculadas ao Produtor selecionado
  useEffect(() => {
    if (!produtorId) {
      setFazendas([])
      setFazendaId('')
      return
    }

    async function carregarFazendasDoProdutor() {
      setCarregandoFazendas(true)
      try {
        const resposta = await apiFetch(`/produtores/${produtorId}/fazendas`)
        if (resposta.ok) {
          const dadosFazendas = await resposta.json()
          setFazendas(dadosFazendas)
          if (dadosFazendas.length > 0) {
            setFazendaId(dadosFazendas[0].id)
          } else {
            setFazendaId('')
          }
        }
      } catch (err) {
        console.error('Erro ao buscar fazendas do produtor:', err)
      } finally {
        setCarregandoFazendas(false)
      }
    }

    carregarFazendasDoProdutor()
  }, [produtorId])

  // Cálculos financeiros
  const totalCalculado = Number(volume || 0) * Number(precoUnitario || 0)
  const comissaoCalculada = totalCalculado * (Number(comissaoPorcentagem || 0) / 100)

  // 3. Submeter Contrato de Fechamento
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!produtorId || !fazendaId || !empresaId || !usuarioId) {
      alert('Certifique-se de selecionar Produtor, Fazenda, Empresa e Corretor.')
      return
    }

    setSalvando(true)

    try {
      const payload = {
        data_fechamento: dataFechamento,
        commodity,
        safra,
        volume: Number(volume),
        tipo_medida: tipoMedida,
        moeda,
        preco_unitario: Number(precoUnitario),
        valor_total: totalCalculado,
        tipo_frete: tipoFrete,
        data_entrega: dataEntrega || null,
        data_pagamento: dataPagamento || null,
        numero_contrato_trading: numeroContratoTrading || null,
        comissao_porcentagem: Number(comissaoPorcentagem),
        valor_comissao: comissaoCalculada,
        status: 'Fechado',
        observacoes: observacoes || null,
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

      alert('Contrato de Fechamento emitido com sucesso!')
      navigate('/dashboard')
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
            className="flex items-center px-4 py-3 bg-primary-container text-on-primary-container rounded-lg font-semibold font-body text-label-lg active:scale-95 transition-transform duration-150"
          >
            <span className="material-symbols-outlined mr-3">handshake</span>
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

      {/* Main Wrapper */}
      <div className="flex-1 flex flex-col h-full md:ml-72 overflow-hidden">
        {/* TopAppBar */}
        <header className="fixed top-0 right-0 h-16 z-40 bg-background/80 backdrop-blur-md border-b border-outline-variant/20 md:left-72">
          <div className="flex justify-between items-center px-8 h-full w-full">
            <h1 className="font-headline font-bold text-lg text-on-surface">
              Emissão de Contrato de Corretagem
            </h1>
          </div>
        </header>

        {/* Content Canvas com Rolagem Independente */}
        <main className="flex-1 mt-16 p-8 overflow-y-auto bg-surface-container-lowest">
          <div className="max-w-5xl mx-auto space-y-8 pb-16">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-headline font-bold text-on-surface">
                  Novo Fechamento
                </h2>
                <p className="text-secondary text-sm mt-1">
                  Selecione as partes e insira as condições comerciais da operação.
                </p>
              </div>
            </div>

            {carregandoDados ? (
              <div className="p-12 text-center text-secondary font-body bg-surface-bright rounded-2xl">
                Carregando produtores, empresas e corretores do banco...
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8 font-body">
                {/* CARD 1: Partes Envolvidas */}
                <div className="bg-surface-bright p-6 rounded-2xl border border-outline-variant/20 space-y-6 shadow-sm">
                  <div className="flex items-center gap-2 pb-3 border-b border-outline-variant/20">
                    <span className="material-symbols-outlined text-primary">group</span>
                    <h3 className="font-headline font-bold text-lg text-on-surface">
                      1. Partes da Negociação
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Produtor Vendedor */}
                    <div>
                      <label className="block text-xs font-bold uppercase text-secondary mb-2">
                        Produtor Vendedor
                      </label>
                      <select
                        required
                        value={produtorId}
                        onChange={(e) => setProdutorId(e.target.value)}
                        className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none text-on-surface cursor-pointer"
                      >
                        {produtores.length === 0 ? (
                          <option value="">Nenhum produtor cadastrado</option>
                        ) : (
                          produtores.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.nome} ({p.whatsapp})
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    {/* Fazenda de Origem */}
                    <div>
                      <label className="block text-xs font-bold uppercase text-secondary mb-2">
                        Fazenda de Origem
                      </label>
                      <select
                        required
                        disabled={carregandoFazendas || fazendas.length === 0}
                        value={fazendaId}
                        onChange={(e) => setFazendaId(e.target.value)}
                        className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none text-on-surface cursor-pointer disabled:opacity-50"
                      >
                        {carregandoFazendas ? (
                          <option value="">Buscando fazendas do produtor...</option>
                        ) : fazendas.length === 0 ? (
                          <option value="">Nenhuma fazenda para este produtor</option>
                        ) : (
                          fazendas.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.nome}
                            </option>
                          ))
                        )}
                      </select>
                      {fazendas.length === 0 && !carregandoFazendas && (
                        <p className="text-xs text-error mt-1">
                          * Cadastre uma fazenda para este produtor antes de prosseguir.
                        </p>
                      )}
                    </div>

                    {/* Empresa Compradora */}
                    <div>
                      <label className="block text-xs font-bold uppercase text-secondary mb-2">
                        Empresa Compradora (Trading)
                      </label>
                      <select
                        required
                        value={empresaId}
                        onChange={(e) => setEmpresaId(e.target.value)}
                        className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none text-on-surface cursor-pointer"
                      >
                        {empresas.length === 0 ? (
                          <option value="">Nenhuma empresa cadastrada</option>
                        ) : (
                          empresas.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                              {emp.razao_social} (CNPJ: {emp.cnpj})
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    {/* Corretor Responsável */}
                    <div>
                      <label className="block text-xs font-bold uppercase text-secondary mb-2">
                        Corretor Responsável
                      </label>
                      <select
                        required
                        value={usuarioId}
                        onChange={(e) => setUsuarioId(e.target.value)}
                        className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none text-on-surface cursor-pointer"
                      >
                        {usuarios.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.nome} ({u.cargo})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* CARD 2: Condições Comerciais */}
                <div className="bg-surface-bright p-6 rounded-2xl border border-outline-variant/20 space-y-6 shadow-sm">
                  <div className="flex items-center gap-2 pb-3 border-b border-outline-variant/20">
                    <span className="material-symbols-outlined text-primary">payments</span>
                    <h3 className="font-headline font-bold text-lg text-on-surface">
                      2. Condições da Mercadoria e Valores
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-secondary mb-1">
                        Commodity
                      </label>
                      <select
                        value={commodity}
                        onChange={(e) => setCommodity(e.target.value)}
                        className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-sm font-semibold"
                      >
                        <option value="Soja">Soja</option>
                        <option value="Milho">Milho</option>
                        <option value="Algodão">Algodão</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-secondary mb-1">
                        Safra
                      </label>
                      <input
                        type="text"
                        required
                        value={safra}
                        onChange={(e) => setSafra(e.target.value)}
                        placeholder="Ex: 2025/2026"
                        className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-secondary mb-1">
                        Volume
                      </label>
                      <input
                        type="number"
                        required
                        value={volume}
                        onChange={(e) => setVolume(e.target.value)}
                        placeholder="Ex: 5000"
                        className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-secondary mb-1">
                        Unidade
                      </label>
                      <select
                        value={tipoMedida}
                        onChange={(e) => setTipoMedida(e.target.value)}
                        className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-sm"
                      >
                        <option value="Sacas">Sacas (60kg)</option>
                        <option value="Toneladas">Toneladas</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-secondary mb-1">
                        Moeda
                      </label>
                      <select
                        value={moeda}
                        onChange={(e) => setMoeda(e.target.value)}
                        className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-sm font-semibold"
                      >
                        <option value="BRL">BRL (R$)</option>
                        <option value="USD">USD ($)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-secondary mb-1">
                        Preço Unitário
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={precoUnitario}
                        onChange={(e) => setPrecoUnitario(e.target.value)}
                        placeholder="Ex: 125.50"
                        className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-secondary mb-1">
                        Tipo de Frete
                      </label>
                      <select
                        value={tipoFrete}
                        onChange={(e) => setTipoFrete(e.target.value)}
                        className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-sm"
                      >
                        <option value="FOB Fazenda">FOB Fazenda</option>
                        <option value="CIF Armazém">CIF Armazém</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-secondary mb-1">
                        Comissão (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        value={comissaoPorcentagem}
                        onChange={(e) => setComissaoPorcentagem(e.target.value)}
                        placeholder="1.0"
                        className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-sm font-semibold"
                      />
                    </div>
                  </div>

                  {/* Resumo Financeiro */}
                  <div className="p-4 bg-surface-container-low rounded-xl flex flex-wrap justify-between items-center gap-4">
                    <div>
                      <span className="text-xs uppercase text-secondary block font-bold">
                        Valor Total da Carga
                      </span>
                      <span className="text-xl font-bold text-primary font-mono">
                        {moeda === 'USD' ? '$' : 'R$'}{' '}
                        {totalCalculado.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>

                    <div>
                      <span className="text-xs uppercase text-secondary block font-bold">
                        Comissão do Corretor ({comissaoPorcentagem}%)
                      </span>
                      <span className="text-xl font-bold text-tertiary font-mono">
                        {moeda === 'USD' ? '$' : 'R$'}{' '}
                        {comissaoCalculada.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* CARD 3: Datas e Prazos */}
                <div className="bg-surface-bright p-6 rounded-2xl border border-outline-variant/20 space-y-6 shadow-sm">
                  <div className="flex items-center gap-2 pb-3 border-b border-outline-variant/20">
                    <span className="material-symbols-outlined text-primary">calendar_month</span>
                    <h3 className="font-headline font-bold text-lg text-on-surface">
                      3. Prazos e Observações
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-secondary mb-1">
                        Data de Fechamento
                      </label>
                      <input
                        type="date"
                        required
                        value={dataFechamento}
                        onChange={(e) => setDataFechamento(e.target.value)}
                        className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-secondary mb-1">
                        Data de Embarque / Entrega
                      </label>
                      <input
                        type="date"
                        value={dataEntrega}
                        onChange={(e) => setDataEntrega(e.target.value)}
                        className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-secondary mb-1">
                        Data de Pagamento
                      </label>
                      <input
                        type="date"
                        value={dataPagamento}
                        onChange={(e) => setDataPagamento(e.target.value)}
                        className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-secondary mb-1">
                        Nº Contrato da Trading (Opcional)
                      </label>
                      <input
                        type="text"
                        value={numeroContratoTrading}
                        onChange={(e) => setNumeroContratoTrading(e.target.value)}
                        placeholder="Ex: TRD-2026-99"
                        className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-secondary mb-1">
                        Observações
                      </label>
                      <input
                        type="text"
                        value={observacoes}
                        onChange={(e) => setObservacoes(e.target.value)}
                        placeholder="Ex: Mercadoria sujeita a classificação de umidade..."
                        className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="flex justify-end gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="px-6 py-3 rounded-xl border border-outline-variant text-secondary font-bold hover:bg-surface-container-low transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={salvando || fazendas.length === 0}
                    className="px-8 py-3 bg-primary text-on-primary font-bold rounded-xl shadow-md hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {salvando ? 'Emitindo Contrato...' : 'Emitir Contrato'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}