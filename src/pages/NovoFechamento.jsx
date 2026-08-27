import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import {
  useProdutores,
  useEmpresas,
  useCompradores,
  useUsuarios,
  useFazendasDoProdutor,
  useCriarContrato,
  useCriarOferta,
  usePerfil,
} from '../services/queries'
import {
  formatarMoeda,
  formatarNumero,
  formatarTelefone,
  normalizarBusca,
  dataHoje,
} from '../utils/formatters'
import { campoClasse, rotuloClasse } from '../components/ui/Modal'
import { useToast } from '../components/ui/Feedback'
import { useRascunho, AvisoRascunho } from '../hooks/useRascunho'

const ABAS = [
  { id: 'contrato', icone: 'handshake', texto: 'Contrato Fechado' },
  { id: 'oferta', icone: 'campaign', texto: 'Oferta / Disparo' },
  { id: 'bid', icone: 'track_changes', texto: 'BID / Preço-Alvo' },
]

const CONTRATO_VAZIO = {
  data_fechamento: dataHoje(),
  commodity: 'Soja',
  safra: '2025/2026',
  volume: '',
  tipo_medida: 'Sacas',
  moeda: 'BRL',
  preco_unitario: '',
  tipo_frete: 'FOB Fazenda',
  data_entrega: '',
  data_pagamento: '',
  numero_contrato_trading: '',
  comissao_porcentagem: '1.00',
  produtor_id: '',
  fazenda_id: '',
  empresa_id: '',
  usuario_id: '',
}

const OFERTA_VAZIA = {
  produtor_id: '',
  fazenda_id: '',
  commodity: 'Soja',
  tipo_medida: 'Sacas',
  volume: '',
  preco: '',
  moeda: 'BRL',
  data_entrega_embarque: '',
}

function Secao({ icone, titulo, children }) {
  return (
    <section className="bg-surface-bright rounded-2xl p-6 shadow-sm border border-outline-variant/20 space-y-5">
      <div className="flex items-center gap-2.5 pb-3 border-b border-outline-variant/20">
        <span className="material-symbols-outlined text-primary">{icone}</span>
        <h3 className="text-lg font-headline font-bold text-on-surface">{titulo}</h3>
      </div>
      {children}
    </section>
  )
}

/** Mantém a fazenda coerente com o produtor escolhido */
function useSincronizarFazenda(fazendas, setForm) {
  useEffect(() => {
    setForm((atual) => {
      const aindaVale = fazendas.some(
        (f) => String(f.id) === String(atual.fazenda_id)
      )
      if (aindaVale) return atual
      return { ...atual, fazenda_id: fazendas[0]?.id ?? '' }
    })
  }, [fazendas, setForm])
}

export default function NovoFechamento() {
  const navigate = useNavigate()
  const toast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  const abaUrl = searchParams.get('aba')
  const aba = ABAS.some((a) => a.id === abaUrl) ? abaUrl : 'contrato'

  const trocarAba = (id) => setSearchParams(id === 'contrato' ? {} : { aba: id })

  const { perfil, podeGerenciar } = usePerfil()
  const { data: produtores = [], isLoading: carregandoProdutores } = useProdutores()
  const { data: empresas = [] } = useEmpresas()
  const { data: compradores = [] } = useCompradores()
  const { data: usuarios = [] } = useUsuarios()

  // ---------- Contrato ----------
  const [
    contrato,
    setContrato,
    limparRascunhoContrato,
    contratoRecuperado,
    descartarAvisoContrato,
  ] = useRascunho('contrato', CONTRATO_VAZIO, {
    // Preenchidos sozinhos ao abrir a tela — não significam que o usuário digitou algo
    ignorar: ['usuario_id', 'data_fechamento'],
  })
  const { data: fazendasContrato = [] } = useFazendasDoProdutor(contrato.produtor_id)
  useSincronizarFazenda(fazendasContrato, setContrato)

  // O corretor responsável já vem marcado como o usuário logado.
  // Admin e gerente podem trocar para outra pessoa da equipe.
  useEffect(() => {
    if (!perfil.id) return
    setContrato((atual) =>
      atual.usuario_id ? atual : { ...atual, usuario_id: perfil.id }
    )
  }, [perfil.id])

  const totais = useMemo(() => {
    const total = Number(contrato.volume || 0) * Number(contrato.preco_unitario || 0)
    return {
      total,
      comissao: total * (Number(contrato.comissao_porcentagem || 0) / 100),
    }
  }, [contrato.volume, contrato.preco_unitario, contrato.comissao_porcentagem])

  const criarContrato = useCriarContrato({
    onSuccess: () => {
      toast.sucesso('Contrato emitido.')
      limparRascunhoContrato()
      navigate('/dashboard')
    },
    onError: (err) => toast.erro(err.message),
  })

  const mudarContrato = (campo) => (e) =>
    setContrato((atual) => ({ ...atual, [campo]: e.target.value }))

  const salvarContrato = (e) => {
    e.preventDefault()
    if (!contrato.produtor_id || !contrato.fazenda_id || !contrato.empresa_id) {
      toast.aviso('Selecione produtor, fazenda e empresa compradora.')
      return
    }
    criarContrato.mutate({
      data_fechamento: contrato.data_fechamento,
      commodity: contrato.commodity,
      safra: contrato.safra,
      volume: Number(contrato.volume),
      tipo_medida: contrato.tipo_medida,
      moeda: contrato.moeda,
      preco_unitario: Number(contrato.preco_unitario),
      valor_total: totais.total,
      tipo_frete: contrato.tipo_frete,
      data_entrega: contrato.data_entrega || null,
      data_pagamento: contrato.data_pagamento || null,
      numero_contrato_trading: contrato.numero_contrato_trading.trim() || null,
      comissao_porcentagem: Number(contrato.comissao_porcentagem),
      valor_comissao: totais.comissao,
      status: 'Fechado',
      produtor_id: Number(contrato.produtor_id),
      fazenda_id: Number(contrato.fazenda_id),
      empresa_id: Number(contrato.empresa_id),
      // Em branco, o backend assume o usuário logado
      ...(contrato.usuario_id ? { usuario_id: Number(contrato.usuario_id) } : {}),
    })
  }

  // ---------- Oferta e BID ----------
  const [
    oferta,
    setOferta,
    limparRascunhoOferta,
    ofertaRecuperada,
    descartarAvisoOferta,
  ] = useRascunho('oferta', OFERTA_VAZIA)
  const { data: fazendasOferta = [] } = useFazendasDoProdutor(oferta.produtor_id)
  useSincronizarFazenda(fazendasOferta, setOferta)

  const [selecionados, setSelecionados] = useState([])
  const [buscaComprador, setBuscaComprador] = useState('')
  const [empresaFiltro, setEmpresaFiltro] = useState('')

  const criarOferta = useCriarOferta({
    onSuccess: () => {
      toast.sucesso(
        aba === 'bid'
          ? 'BID registrado no mural.'
          : `Oferta enviada para ${selecionados.length} comprador(es).`
      )
      limparRascunhoOferta()
      setSelecionados([])
      navigate('/ofertas')
    },
    onError: (err) => toast.erro(err.message),
  })

  const mudarOferta = (campo) => (e) =>
    setOferta((atual) => ({ ...atual, [campo]: e.target.value }))

  const compradoresFiltrados = useMemo(() => {
    const termo = normalizarBusca(buscaComprador)
    return compradores.filter((c) => {
      if (empresaFiltro && String(c.empresa_id) !== String(empresaFiltro)) return false
      if (!termo) return true
      return [c.nome, c.email, c.telefone].some((campo) =>
        normalizarBusca(campo).includes(termo)
      )
    })
  }, [compradores, buscaComprador, empresaFiltro])

  const alternarTodos = () => {
    const idsVisiveis = compradoresFiltrados.map((c) => c.id)
    const todosMarcados = idsVisiveis.every((id) => selecionados.includes(id))
    setSelecionados((atuais) =>
      todosMarcados
        ? atuais.filter((id) => !idsVisiveis.includes(id))
        : [...new Set([...atuais, ...idsVisiveis])]
    )
  }

  const salvarOferta = (e) => {
    e.preventDefault()
    if (!oferta.produtor_id || !oferta.fazenda_id) {
      toast.aviso('Selecione o produtor vendedor e a fazenda de origem.')
      return
    }
    if (aba === 'oferta' && selecionados.length === 0) {
      toast.aviso('Marque ao menos um comprador para disparar a oferta.')
      return
    }
    criarOferta.mutate({
      tipo_oferta: aba === 'bid' ? 'Bid' : 'Oferta',
      produtor_id: Number(oferta.produtor_id),
      fazenda_id: Number(oferta.fazenda_id),
      commodity: oferta.commodity,
      volume: Number(oferta.volume),
      tipo_medida: oferta.tipo_medida,
      preco: Number(oferta.preco),
      moeda: oferta.moeda,
      data_entrega_embarque: oferta.data_entrega_embarque || dataHoje(),
      compradores_ids: aba === 'bid' ? [] : selecionados,
    })
  }

  // ---------- Blocos compartilhados ----------
  const seletorProdutorFazenda = (form, mudar, fazendas) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className={rotuloClasse}>Produtor vendedor</label>
        {carregandoProdutores ? (
          <div className="h-11 rounded-xl bg-surface-variant animate-pulse" />
        ) : produtores.length === 0 ? (
          <div className="p-3 bg-tertiary-container/40 text-on-tertiary-container text-xs rounded-xl">
            Nenhum produtor cadastrado.{' '}
            <Link to="/produtores" className="underline font-bold">
              Cadastre um primeiro.
            </Link>
          </div>
        ) : (
          <select
            required
            value={form.produtor_id}
            onChange={mudar('produtor_id')}
            className={campoClasse}
          >
            <option value="">Selecione...</option>
            {produtores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label className={rotuloClasse}>Fazenda de origem</label>
        <select
          required
          disabled={!form.produtor_id}
          value={form.fazenda_id}
          onChange={mudar('fazenda_id')}
          className={campoClasse}
        >
          {!form.produtor_id ? (
            <option value="">Escolha o produtor antes</option>
          ) : fazendas.length === 0 ? (
            <option value="">Este produtor não tem fazendas</option>
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
  )

  const camposGrao = (form, mudar, rotuloPreco) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div>
        <label className={rotuloClasse}>Commodity</label>
        <select value={form.commodity} onChange={mudar('commodity')} className={campoClasse}>
          <option value="Soja">Soja</option>
          <option value="Milho">Milho</option>
        </select>
      </div>
      <div>
        <label className={rotuloClasse}>Unidade</label>
        <select
          value={form.tipo_medida}
          onChange={mudar('tipo_medida')}
          className={campoClasse}
        >
          <option value="Sacas">Sacas</option>
          <option value="Toneladas">Toneladas</option>
        </select>
      </div>
      <div>
        <label className={rotuloClasse}>Volume</label>
        <input
          type="number"
          required
          min="0"
          step="any"
          placeholder="0"
          value={form.volume}
          onChange={mudar('volume')}
          className={campoClasse}
        />
      </div>
      <div>
        <label className={rotuloClasse}>Moeda</label>
        <select value={form.moeda} onChange={mudar('moeda')} className={campoClasse}>
          <option value="BRL">BRL (R$)</option>
          <option value="USD">USD ($)</option>
        </select>
      </div>
      <div className="col-span-2">
        <label className={rotuloClasse}>{rotuloPreco}</label>
        <input
          type="number"
          required
          min="0"
          step="0.01"
          placeholder="0.00"
          value={form.preco ?? form.preco_unitario}
          onChange={mudar(form.preco !== undefined ? 'preco' : 'preco_unitario')}
          className={campoClasse}
        />
      </div>
    </div>
  )

  return (
    <div className="space-y-8 pb-12">
      {/* Abas */}
      <div className="flex justify-center">
        <div className="inline-flex bg-surface-container rounded-full p-1 gap-1 flex-wrap justify-center">
          {ABAS.map((a) => (
            <button
              key={a.id}
              onClick={() => trocarAba(a.id)}
              className={`px-5 sm:px-7 py-3 rounded-full text-sm font-bold transition-all duration-300 cursor-pointer flex items-center gap-2 ${
                aba === a.id
                  ? 'bg-primary text-on-primary shadow-md'
                  : 'text-on-surface-variant/80 hover:text-on-surface hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{a.icone}</span>
              {a.texto}
            </button>
          ))}
        </div>
      </div>

      {/* ================= CONTRATO ================= */}
      {aba === 'contrato' && (
        <form onSubmit={salvarContrato} className="space-y-6 max-w-5xl">
          <div>
            <h2 className="font-headline text-3xl font-semibold text-on-surface mb-1">
              Registrar contrato fechado
            </h2>
            <p className="text-secondary text-lg">
              Emita o contrato de corretagem de um negócio já acertado.
            </p>
          </div>

          {contratoRecuperado && (
            <AvisoRascunho
              aoDescartar={descartarAvisoContrato}
              aoLimpar={limparRascunhoContrato}
            />
          )}

          <Secao icone="groups" titulo="Partes envolvidas">
            {seletorProdutorFazenda(contrato, mudarContrato, fazendasContrato)}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={rotuloClasse}>Empresa compradora</label>
                <select
                  required
                  value={contrato.empresa_id}
                  onChange={mudarContrato('empresa_id')}
                  className={campoClasse}
                >
                  <option value="">Selecione...</option>
                  {empresas.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.razao_social || e.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vem marcado com o usuário logado; admin e gerente podem trocar */}
              {podeGerenciar && usuarios.length > 0 && (
                <div>
                  <label className={rotuloClasse}>Corretor responsável</label>
                  <select
                    value={contrato.usuario_id}
                    onChange={mudarContrato('usuario_id')}
                    className={campoClasse}
                  >
                    {!contrato.usuario_id && <option value="">Selecione...</option>}
                    {usuarios.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nome}
                        {u.id === perfil.id ? ' (você)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </Secao>

          <Secao icone="grain" titulo="Grão e valores">
            {camposGrao(contrato, mudarContrato, 'Preço unitário')}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className={rotuloClasse}>Safra</label>
                <input
                  type="text"
                  required
                  placeholder="2025/2026"
                  value={contrato.safra}
                  onChange={mudarContrato('safra')}
                  className={campoClasse}
                />
              </div>
              <div>
                <label className={rotuloClasse}>Comissão (%)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={contrato.comissao_porcentagem}
                  onChange={mudarContrato('comissao_porcentagem')}
                  className={campoClasse}
                />
              </div>
              <div>
                <label className={rotuloClasse}>Condição de frete</label>
                <select
                  value={contrato.tipo_frete}
                  onChange={mudarContrato('tipo_frete')}
                  className={campoClasse}
                >
                  <option value="FOB Fazenda">FOB Fazenda</option>
                  <option value="CIF Armazém">CIF Armazém</option>
                </select>
              </div>
            </div>

            {/* Resumo ao vivo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/20">
                <p className="text-xs font-bold uppercase text-secondary tracking-wide">
                  Valor total da operação
                </p>
                <p className="text-2xl font-mono font-bold text-primary mt-1">
                  {formatarMoeda(totais.total, contrato.moeda)}
                </p>
                {contrato.volume && contrato.preco_unitario && (
                  <p className="text-xs text-secondary mt-1">
                    {formatarNumero(contrato.volume)} {contrato.tipo_medida.toLowerCase()}{' '}
                    × {formatarMoeda(contrato.preco_unitario, contrato.moeda)}
                  </p>
                )}
              </div>
              <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/20">
                <p className="text-xs font-bold uppercase text-secondary tracking-wide">
                  Comissão da corretora
                </p>
                <p className="text-2xl font-mono font-bold text-tertiary mt-1">
                  {formatarMoeda(totais.comissao, contrato.moeda)}
                </p>
                <p className="text-xs text-secondary mt-1">
                  {contrato.comissao_porcentagem || 0}% do valor total
                </p>
              </div>
            </div>
          </Secao>

          <Secao icone="event" titulo="Prazos e documentação">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={rotuloClasse}>Data do fechamento</label>
                <input
                  type="date"
                  required
                  value={contrato.data_fechamento}
                  onChange={mudarContrato('data_fechamento')}
                  className={campoClasse}
                />
              </div>
              <div>
                <label className={rotuloClasse}>Nº do contrato na trading</label>
                <input
                  type="text"
                  placeholder="Ex: TRD-2026-9982"
                  value={contrato.numero_contrato_trading}
                  onChange={mudarContrato('numero_contrato_trading')}
                  className={`${campoClasse} font-mono`}
                />
              </div>
              <div>
                <label className={rotuloClasse}>Previsão de entrega</label>
                <input
                  type="date"
                  value={contrato.data_entrega}
                  onChange={mudarContrato('data_entrega')}
                  className={campoClasse}
                />
              </div>
              <div>
                <label className={rotuloClasse}>Previsão de pagamento</label>
                <input
                  type="date"
                  value={contrato.data_pagamento}
                  onChange={mudarContrato('data_pagamento')}
                  className={campoClasse}
                />
              </div>
            </div>
          </Secao>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              disabled={criarContrato.isPending}
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 rounded-xl border border-outline-variant text-secondary font-bold text-sm hover:bg-surface-container-low transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={criarContrato.isPending || fazendasContrato.length === 0}
              className="px-7 py-3 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-sm hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 active:scale-95"
            >
              <span className="material-symbols-outlined text-base">save</span>
              {criarContrato.isPending ? 'Emitindo...' : 'Emitir contrato'}
            </button>
          </div>
        </form>
      )}

      {/* ================= OFERTA E BID ================= */}
      {(aba === 'oferta' || aba === 'bid') && (
        <form onSubmit={salvarOferta} className="space-y-6 max-w-5xl">
          <div>
            <h2 className="font-headline text-3xl font-semibold text-on-surface mb-1">
              {aba === 'bid' ? 'Registrar BID / preço-alvo' : 'Nova oferta de venda'}
            </h2>
            <p className="text-secondary text-lg">
              {aba === 'bid'
                ? 'Intenção firme de venda, registrada no mural sem disparo de mensagens.'
                : 'Cadastre o lote e dispare no WhatsApp dos compradores selecionados.'}
            </p>
          </div>

          {ofertaRecuperada && (
            <AvisoRascunho
              aoDescartar={descartarAvisoOferta}
              aoLimpar={limparRascunhoOferta}
            />
          )}

          <Secao icone="agriculture" titulo="Origem do lote">
            {seletorProdutorFazenda(oferta, mudarOferta, fazendasOferta)}
          </Secao>

          <Secao icone="grain" titulo="Grão e preço">
            {camposGrao(oferta, mudarOferta, aba === 'bid' ? 'Preço alvo' : 'Preço ofertado')}

            <div className="max-w-xs">
              <label className={rotuloClasse}>
                {aba === 'bid' ? 'Validade do BID' : 'Data limite de embarque'}
              </label>
              <input
                type="date"
                required
                value={oferta.data_entrega_embarque}
                onChange={mudarOferta('data_entrega_embarque')}
                className={campoClasse}
              />
            </div>
          </Secao>

          {/* Disparo só existe na aba de oferta */}
          {aba === 'oferta' && (
            <Secao icone="send" titulo="Destinatários do disparo">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-sm">
                    search
                  </span>
                  <input
                    type="text"
                    placeholder="Buscar comprador..."
                    value={buscaComprador}
                    onChange={(e) => setBuscaComprador(e.target.value)}
                    className={`${campoClasse} pl-10`}
                  />
                </div>
                <select
                  value={empresaFiltro}
                  onChange={(e) => setEmpresaFiltro(e.target.value)}
                  className={`${campoClasse} sm:max-w-xs`}
                >
                  <option value="">Todas as empresas</option>
                  {empresas.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.razao_social || e.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-secondary">
                  {selecionados.length === 0
                    ? 'Nenhum comprador marcado'
                    : `${selecionados.length} comprador(es) receberão a mensagem`}
                </p>
                {compradoresFiltrados.length > 0 && (
                  <button
                    type="button"
                    onClick={alternarTodos}
                    className="text-xs text-primary font-bold hover:underline cursor-pointer shrink-0"
                  >
                    Marcar / desmarcar visíveis
                  </button>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto space-y-1 border border-outline-variant/30 rounded-xl p-3 bg-surface-container-low">
                {compradores.length === 0 ? (
                  <p className="text-xs text-secondary text-center py-4">
                    Nenhum comprador cadastrado. Adicione contatos na tela de cada
                    empresa.
                  </p>
                ) : compradoresFiltrados.length === 0 ? (
                  <p className="text-xs text-secondary text-center py-4">
                    Nenhum comprador corresponde ao filtro.
                  </p>
                ) : (
                  compradoresFiltrados.map((c) => (
                    <label
                      key={c.id}
                      className="flex items-center justify-between gap-3 p-2 hover:bg-surface-bright rounded-lg cursor-pointer text-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={selecionados.includes(c.id)}
                          onChange={() =>
                            setSelecionados((atuais) =>
                              atuais.includes(c.id)
                                ? atuais.filter((i) => i !== c.id)
                                : [...atuais, c.id]
                            )
                          }
                          className="w-4 h-4 accent-primary rounded shrink-0"
                        />
                        <span className="font-medium text-on-surface truncate">
                          {c.nome}
                        </span>
                      </div>
                      <span className="text-xs text-secondary font-mono shrink-0">
                        {formatarTelefone(c.telefone)}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </Secao>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              disabled={criarOferta.isPending}
              onClick={() => navigate('/ofertas')}
              className="px-6 py-3 rounded-xl border border-outline-variant text-secondary font-bold text-sm hover:bg-surface-container-low transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={criarOferta.isPending || fazendasOferta.length === 0}
              className="px-7 py-3 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-sm hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 active:scale-95"
            >
              <span className="material-symbols-outlined text-base">
                {aba === 'bid' ? 'save' : 'send'}
              </span>
              {criarOferta.isPending
                ? aba === 'bid'
                  ? 'Salvando...'
                  : 'Disparando...'
                : aba === 'bid'
                ? 'Registrar BID'
                : 'Disparar oferta'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}