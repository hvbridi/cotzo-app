import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  useOfertasEnriquecidas,
  useEditarOferta,
  useExcluirOferta,
  usePerfil,
} from '../services/queries'
import {
  normalizarBusca,
  formatarData,
  formatarMoeda,
  formatarNumero,
} from '../utils/formatters'
import { EstadoLista, SkeletonTabela } from '../components/ui/PageState'
import Modal, { campoClasse, rotuloClasse } from '../components/ui/Modal'
import { useToast, useConfirm } from '../components/ui/Feedback'

const ABAS = [
  {
    id: 'Oferta',
    icone: 'sell',
    texto: 'Ofertas de Venda',
    titulo: 'Ofertas disponíveis',
    subtitulo: 'Lotes de grãos cadastrados para negociação com as tradings.',
    rotuloPreco: 'Preço ofertado',
    rotuloData: 'Previsão de embarque',
    botao: 'Nova oferta',
    destino: '/fechamento?aba=oferta',
  },
  {
    id: 'Bid',
    icone: 'track_changes',
    texto: 'Preços-Alvo / BIDs',
    titulo: 'Painel de BIDs e preços-alvo',
    subtitulo: 'Intenções de venda firmes registradas para cruzamento de mercado.',
    rotuloPreco: 'Preço alvo',
    rotuloData: 'Validade',
    botao: 'Novo BID',
    destino: '/fechamento?aba=bid',
  },
]

/** Cabeçalho clicável: o primeiro clique ordena, o segundo inverte */
function ThOrdenavel({ campo, ordem, aoOrdenar, alinhar = 'left', children }) {
  const ativo = ordem.campo === campo
  return (
    <th
      className={`py-3 px-6 border-b border-outline-variant/20 ${
        alinhar === 'right' ? 'text-right' : 'text-left'
      }`}
    >
      <button
        onClick={() => aoOrdenar(campo)}
        className={`inline-flex items-center gap-1 font-bold uppercase text-xs cursor-pointer transition-colors hover:text-primary ${
          ativo ? 'text-primary' : 'text-secondary'
        } ${alinhar === 'right' ? 'flex-row-reverse' : ''}`}
      >
        {children}
        <span className="material-symbols-outlined text-[16px]">
          {!ativo
            ? 'unfold_more'
            : ordem.direcao === 'asc'
            ? 'arrow_upward'
            : 'arrow_downward'}
        </span>
      </button>
    </th>
  )
}

function comparar(a, b, campo) {
  const va = a[campo]
  const vb = b[campo]
  if (va == null) return 1
  if (vb == null) return -1
  if (typeof va === 'number' && typeof vb === 'number') return va - vb
  return String(va).localeCompare(String(vb), 'pt-BR', { numeric: true })
}

export default function Ofertas() {
  const toast = useToast()
  const confirmar = useConfirm()
  const { ehAdmin } = usePerfil()

  const [aba, setAba] = useState('Oferta')
  const [busca, setBusca] = useState('')
  const [ordem, setOrdem] = useState({ campo: 'id', direcao: 'desc' })
  const [edicao, setEdicao] = useState(null) // { id, nomes, form }

  const { data: ofertas = [], isLoading, error, refetch } = useOfertasEnriquecidas()

  const editar = useEditarOferta({
    onSuccess: () => {
      toast.sucesso('Registro atualizado.')
      setEdicao(null)
    },
    onError: (err) => toast.erro(err.message),
  })

  const excluir = useExcluirOferta({
    onSuccess: () => toast.sucesso('Registro removido.'),
    onError: (err) => toast.erro(err.message),
  })

  // O backend não permite trocar produtor nem fazenda na edição
  const abrirEdicao = (o) =>
    setEdicao({
      id: o.id,
      nomes: `${o.produtor_nome} · ${o.fazenda_nome}`,
      form: {
        tipo_oferta: o.tipo_oferta || 'Oferta',
        commodity: o.commodity || 'Soja',
        tipo_medida: o.tipo_medida || 'Sacas',
        volume: o.volume ?? '',
        preco: o.preco ?? '',
        moeda: o.moeda || 'BRL',
        data_entrega_embarque: (o.data_entrega_embarque || '').split('T')[0],
      },
    })

  const mudarEdicao = (campo) => (e) =>
    setEdicao((atual) => ({
      ...atual,
      form: { ...atual.form, [campo]: e.target.value },
    }))

  const salvarEdicao = (e) => {
    e.preventDefault()
    editar.mutate({
      id: edicao.id,
      tipo_oferta: edicao.form.tipo_oferta,
      commodity: edicao.form.commodity,
      volume: Number(edicao.form.volume),
      tipo_medida: edicao.form.tipo_medida,
      preco: Number(edicao.form.preco),
      moeda: edicao.form.moeda,
      data_entrega_embarque: edicao.form.data_entrega_embarque,
    })
  }

  const removerOferta = async (o) => {
    const confirmado = await confirmar({
      titulo: `Excluir registro #${o.id}?`,
      mensagem: `${o.produtor_nome} · ${o.fazenda_nome}. Ele sai do mural, mas continua no banco.`,
      textoConfirmar: 'Excluir',
      perigo: true,
    })
    if (confirmado) excluir.mutate(o.id)
  }

  const abaAtual = ABAS.find((a) => a.id === aba)

  const alternarOrdem = (campo) =>
    setOrdem((atual) =>
      atual.campo === campo
        ? { campo, direcao: atual.direcao === 'asc' ? 'desc' : 'asc' }
        : { campo, direcao: 'asc' }
    )

  const ofertasVisiveis = useMemo(() => {
    const termo = normalizarBusca(busca)

    const filtradas = ofertas.filter((o) => {
      // Registros antigos não têm tipo_oferta preenchido; contam como Oferta
      if ((o.tipo_oferta || 'Oferta') !== aba) return false
      if (!termo) return true
      return [o.produtor_nome, o.fazenda_nome, o.commodity].some((campo) =>
        normalizarBusca(campo).includes(termo)
      )
    })

    const fator = ordem.direcao === 'asc' ? 1 : -1
    return [...filtradas].sort((a, b) => comparar(a, b, ordem.campo) * fator)
  }, [ofertas, aba, busca, ordem])

  return (
    <div className="space-y-8">
      {/* Abas */}
      <div className="flex justify-center">
        <div className="inline-flex bg-surface-container rounded-full p-1 gap-1">
          {ABAS.map((a) => (
            <button
              key={a.id}
              onClick={() => setAba(a.id)}
              className={`px-6 sm:px-8 py-3 rounded-full text-sm font-bold transition-all duration-300 cursor-pointer flex items-center gap-2 ${
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

      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-headline font-semibold text-on-surface mb-1">
            {abaAtual.titulo}
          </h2>
          <p className="text-secondary text-lg">{abaAtual.subtitulo}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-sm">
              search
            </span>
            <input
              type="text"
              placeholder="Buscar por produtor ou fazenda..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low focus:ring-2 focus:ring-primary outline-none text-sm text-on-surface placeholder:text-secondary"
            />
          </div>

          {/* O cadastro acontece no Novo Fechamento */}
          <Link
            to={abaAtual.destino}
            className="bg-primary text-on-primary px-6 py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-sm flex items-center justify-center gap-2 active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <span className="material-symbols-outlined">add</span>
            {abaAtual.botao}
          </Link>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 overflow-hidden">
        {!isLoading && !error && ofertasVisiveis.length > 0 && (
          <div className="px-6 py-3 border-b border-outline-variant/20 flex items-center justify-between gap-3">
            <p className="text-sm text-secondary font-body">
              {formatarNumero(ofertasVisiveis.length)}{' '}
              {aba === 'Bid' ? 'BID(s)' : 'oferta(s)'}
            </p>
            <p className="text-xs text-secondary font-body hidden sm:block">
              Clique em um título de coluna para ordenar
            </p>
          </div>
        )}

        <div className="overflow-x-auto">
          <EstadoLista
            carregando={isLoading}
            erro={error}
            vazio={ofertasVisiveis.length === 0}
            onTentarNovamente={refetch}
            skeleton={<SkeletonTabela colunas={7} />}
            vazioProps={
              busca
                ? {
                    icone: 'search_off',
                    titulo: 'Nenhum registro corresponde à busca',
                    descricao: `Nada encontrado para "${busca}" nesta aba.`,
                  }
                : {
                    icone: aba === 'Bid' ? 'track_changes' : 'campaign',
                    titulo:
                      aba === 'Bid'
                        ? 'Nenhum BID registrado'
                        : 'Nenhuma oferta cadastrada',
                    descricao:
                      aba === 'Bid'
                        ? 'Registre um preço-alvo no Novo Fechamento para cruzar com o mercado.'
                        : 'Cadastre um lote no Novo Fechamento para enviar às tradings.',
                    acao: (
                      <Link
                        to={abaAtual.destino}
                        className="inline-flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:bg-primary/90 transition-colors cursor-pointer active:scale-95"
                      >
                        <span className="material-symbols-outlined text-lg">add</span>
                        {abaAtual.botao}
                      </Link>
                    ),
                  }
            }
          >
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low">
                  <ThOrdenavel campo="commodity" ordem={ordem} aoOrdenar={alternarOrdem}>
                    Commodity
                  </ThOrdenavel>
                  <ThOrdenavel
                    campo="produtor_nome"
                    ordem={ordem}
                    aoOrdenar={alternarOrdem}
                  >
                    Produtor
                  </ThOrdenavel>
                  <ThOrdenavel
                    campo="fazenda_nome"
                    ordem={ordem}
                    aoOrdenar={alternarOrdem}
                  >
                    Fazenda de origem
                  </ThOrdenavel>
                  <ThOrdenavel
                    campo="volume"
                    ordem={ordem}
                    aoOrdenar={alternarOrdem}
                    alinhar="right"
                  >
                    Volume
                  </ThOrdenavel>
                  <ThOrdenavel
                    campo="preco"
                    ordem={ordem}
                    aoOrdenar={alternarOrdem}
                    alinhar="right"
                  >
                    {abaAtual.rotuloPreco}
                  </ThOrdenavel>
                  <ThOrdenavel
                    campo="data_entrega_embarque"
                    ordem={ordem}
                    aoOrdenar={alternarOrdem}
                  >
                    {abaAtual.rotuloData}
                  </ThOrdenavel>
                  <th className="py-3 px-6 border-b border-outline-variant/20 text-right text-xs font-bold uppercase text-secondary">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {ofertasVisiveis.map((o) => {
                  const unidade =
                    (o.tipo_medida || '').toLowerCase() === 'toneladas' ? 'ton' : 'sc'
                  return (
                    <tr
                      key={o.id}
                      className="border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors"
                    >
                      <td className="py-4 px-6 font-semibold text-on-surface">
                        {o.commodity || 'Soja'}
                      </td>
                      <td className="py-4 px-6 text-on-surface">{o.produtor_nome}</td>
                      <td className="py-4 px-6 text-secondary">{o.fazenda_nome}</td>
                      <td className="py-4 px-6 font-mono text-on-surface text-right whitespace-nowrap">
                        {formatarNumero(o.volume)}{' '}
                        <span className="text-secondary text-xs">{unidade}</span>
                      </td>
                      <td className="py-4 px-6 font-mono font-bold text-primary text-right whitespace-nowrap">
                        {formatarMoeda(o.preco, o.moeda)}
                        <span className="text-secondary text-xs font-normal">
                          {' '}
                          /{unidade}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-secondary whitespace-nowrap">
                        {formatarData(o.data_entrega_embarque)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => abrirEdicao(o)}
                            title="Editar registro"
                            className="p-2 rounded-lg text-secondary hover:text-primary hover:bg-primary-container/30 transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              edit
                            </span>
                          </button>
                          {ehAdmin && (
                            <button
                              onClick={() => removerOferta(o)}
                              disabled={excluir.isPending}
                              title="Excluir registro"
                              className="p-2 rounded-lg text-secondary hover:text-error hover:bg-error-container/30 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <span className="material-symbols-outlined text-[20px]">
                                delete
                              </span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </EstadoLista>
        </div>
      </div>

      {/* Edição — produtor e fazenda são fixos, o backend não aceita trocá-los */}
      <Modal
        aberto={!!edicao}
        titulo="Editar registro"
        descricao={edicao?.nomes}
        aoFechar={() => !editar.isPending && setEdicao(null)}
      >
        {edicao && (
          <form onSubmit={salvarEdicao} className="space-y-4 font-body">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={rotuloClasse}>Tipo</label>
                <select
                  value={edicao.form.tipo_oferta}
                  onChange={mudarEdicao('tipo_oferta')}
                  className={campoClasse}
                >
                  <option value="Oferta">Oferta de venda</option>
                  <option value="Bid">BID / preço-alvo</option>
                </select>
              </div>
              <div>
                <label className={rotuloClasse}>Commodity</label>
                <select
                  value={edicao.form.commodity}
                  onChange={mudarEdicao('commodity')}
                  className={campoClasse}
                >
                  <option value="Soja">Soja</option>
                  <option value="Milho">Milho</option>
                </select>
              </div>
              <div>
                <label className={rotuloClasse}>Unidade</label>
                <select
                  value={edicao.form.tipo_medida}
                  onChange={mudarEdicao('tipo_medida')}
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
                  value={edicao.form.volume}
                  onChange={mudarEdicao('volume')}
                  className={campoClasse}
                />
              </div>
              <div>
                <label className={rotuloClasse}>Preço</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={edicao.form.preco}
                  onChange={mudarEdicao('preco')}
                  className={campoClasse}
                />
              </div>
              <div>
                <label className={rotuloClasse}>Moeda</label>
                <select
                  value={edicao.form.moeda}
                  onChange={mudarEdicao('moeda')}
                  className={campoClasse}
                >
                  <option value="BRL">BRL (R$)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
            </div>

            <div>
              <label className={rotuloClasse}>
                {edicao.form.tipo_oferta === 'Bid' ? 'Validade' : 'Data de embarque'}
              </label>
              <input
                type="date"
                required
                value={edicao.form.data_entrega_embarque}
                onChange={mudarEdicao('data_entrega_embarque')}
                className={campoClasse}
              />
            </div>

            <p className="text-xs text-secondary">
              Para mudar o produtor ou a fazenda, exclua este registro e crie outro.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={editar.isPending}
                onClick={() => setEdicao(null)}
                className="px-5 py-2.5 rounded-xl border border-outline-variant text-secondary font-bold hover:bg-surface-container-low cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={editar.isPending}
                className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-bold hover:bg-primary/90 disabled:opacity-50 cursor-pointer active:scale-95 transition-all"
              >
                {editar.isPending ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}