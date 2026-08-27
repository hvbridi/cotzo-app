import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useContratosEnriquecidos, useUsuarios } from '../services/queries'
import { apiFetch } from '../services/api'
import {
  formatarData,
  formatarMoeda,
  formatarNumero,
} from '../utils/formatters'
import { EstadoLista, SkeletonTabela } from '../components/ui/PageState'
import { campoClasse, rotuloClasse } from '../components/ui/Modal'
import { useToast } from '../components/ui/Feedback'

const FILTROS_VAZIOS = {
  dataInicio: '',
  dataFim: '',
  corretorId: 'Todos',
  commodity: 'Todas',
}

export default function Relatorios() {
  const toast = useToast()
  const [filtros, setFiltros] = useState(FILTROS_VAZIOS)
  const [exportando, setExportando] = useState(false)

  // Já vem com produtor_nome e corretor_nome resolvidos — antes a página
  // baixava /usuarios/ e /produtores/ só para traduzir IDs em nomes.
  const { data: contratos = [], isLoading, error, refetch } = useContratosEnriquecidos()
  const { data: usuarios = [] } = useUsuarios()

  const mudar = (campo) => (e) =>
    setFiltros((atual) => ({ ...atual, [campo]: e.target.value }))

  const contratosFiltrados = useMemo(() => {
    return contratos.filter((c) => {
      if (filtros.dataInicio && c.data_fechamento < filtros.dataInicio) return false
      if (filtros.dataFim && c.data_fechamento > filtros.dataFim) return false
      if (
        filtros.corretorId !== 'Todos' &&
        String(c.usuario_id) !== String(filtros.corretorId)
      ) {
        return false
      }
      if (filtros.commodity !== 'Todas' && c.commodity !== filtros.commodity) {
        return false
      }
      return true
    })
  }, [contratos, filtros])

  const totais = useMemo(() => {
    return contratosFiltrados.reduce(
      (acc, c) => ({
        volume: acc.volume + (Number(c.volume) || 0),
        valor: acc.valor + (Number(c.valor_total) || 0),
        comissao: acc.comissao + (Number(c.valor_comissao) || 0),
      }),
      { volume: 0, valor: 0, comissao: 0 }
    )
  }, [contratosFiltrados])

  const temFiltroAtivo =
    filtros.dataInicio ||
    filtros.dataFim ||
    filtros.corretorId !== 'Todos' ||
    filtros.commodity !== 'Todas'

  const exportarExcel = async () => {
    setExportando(true)
    try {
      const resposta = await apiFetch('/exportar-excel/')
      if (!resposta.ok) throw new Error('O servidor não conseguiu gerar o arquivo.')

      const blob = await resposta.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'relatorio_corretora.xlsx'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      toast.sucesso('Planilha baixada.')
    } catch (err) {
      toast.erro(err.message)
    } finally {
      setExportando(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-headline text-3xl font-semibold text-on-background mb-1">
            Relatórios
          </h2>
          <p className="text-secondary text-lg">
            Filtre os fechamentos por período, corretor e commodity.
          </p>
        </div>
        <button
          onClick={exportarExcel}
          disabled={exportando}
          className="bg-surface border border-primary text-primary hover:bg-primary-container/20 font-bold py-2.5 px-6 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer text-sm disabled:opacity-50 active:scale-95 shrink-0 self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-base">download</span>
          {exportando ? 'Gerando planilha...' : 'Exportar Excel'}
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-surface-bright rounded-2xl border border-outline-variant/20 shadow-sm p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className={rotuloClasse}>De</label>
            <input
              type="date"
              value={filtros.dataInicio}
              onChange={mudar('dataInicio')}
              className={campoClasse}
            />
          </div>

          <div>
            <label className={rotuloClasse}>Até</label>
            <input
              type="date"
              value={filtros.dataFim}
              onChange={mudar('dataFim')}
              className={campoClasse}
            />
          </div>

          <div>
            <label className={rotuloClasse}>Commodity</label>
            <select
              value={filtros.commodity}
              onChange={mudar('commodity')}
              className={campoClasse}
            >
              <option value="Todas">Todas</option>
              <option value="Soja">Soja</option>
              <option value="Milho">Milho</option>
            </select>
          </div>

          {/* Corretor recebe 403 em /usuarios/, então o filtro só aparece para quem pode */}
          {usuarios.length > 0 ? (
            <div>
              <label className={rotuloClasse}>Corretor</label>
              <select
                value={filtros.corretorId}
                onChange={mudar('corretorId')}
                className={campoClasse}
              >
                <option value="Todos">Todos</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-end">
              {temFiltroAtivo && (
                <button
                  onClick={() => setFiltros(FILTROS_VAZIOS)}
                  className="w-full py-3 rounded-xl bg-surface-container-high text-on-surface hover:bg-surface-variant font-semibold text-sm transition-colors cursor-pointer"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          )}
        </div>

        {usuarios.length > 0 && temFiltroAtivo && (
          <button
            onClick={() => setFiltros(FILTROS_VAZIOS)}
            className="mt-4 text-sm font-bold text-primary hover:underline cursor-pointer"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* Totais do período filtrado */}
      {!isLoading && !error && contratosFiltrados.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/20">
            <p className="text-xs font-bold uppercase text-secondary tracking-wide">
              Volume no período
            </p>
            <p className="text-xl font-mono font-bold text-on-surface mt-1">
              {formatarNumero(totais.volume)} sc
            </p>
          </div>
          <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/20">
            <p className="text-xs font-bold uppercase text-secondary tracking-wide">
              Valor negociado
            </p>
            <p className="text-xl font-mono font-bold text-primary mt-1">
              {formatarMoeda(totais.valor)}
            </p>
          </div>
          <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/20">
            <p className="text-xs font-bold uppercase text-secondary tracking-wide">
              Comissão no período
            </p>
            <p className="text-xl font-mono font-bold text-tertiary mt-1">
              {formatarMoeda(totais.comissao)}
            </p>
          </div>
        </div>
      )}

      {/* Tabela */}
      <div className="bg-surface-bright rounded-2xl border border-outline-variant/20 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-outline-variant/20 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-headline font-bold text-lg text-on-surface">
            Fechamentos
          </h3>
          {!isLoading && !error && (
            <p className="text-sm text-secondary font-body">
              {formatarNumero(contratosFiltrados.length)} de{' '}
              {formatarNumero(contratos.length)}
            </p>
          )}
        </div>

        <div className="overflow-x-auto">
          <EstadoLista
            carregando={isLoading}
            erro={error}
            vazio={contratosFiltrados.length === 0}
            onTentarNovamente={refetch}
            skeleton={<SkeletonTabela colunas={8} />}
            vazioProps={
              temFiltroAtivo
                ? {
                    icone: 'filter_alt_off',
                    titulo: 'Nenhum contrato no filtro',
                    descricao:
                      'Nenhum fechamento corresponde a esta combinação. Ajuste o período ou limpe os filtros.',
                    acao: (
                      <button
                        onClick={() => setFiltros(FILTROS_VAZIOS)}
                        className="inline-flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:bg-primary/90 transition-colors cursor-pointer active:scale-95"
                      >
                        Limpar filtros
                      </button>
                    ),
                  }
                : {
                    icone: 'handshake',
                    titulo: 'Nenhum contrato registrado',
                    descricao: 'Registre o primeiro fechamento para gerar relatórios.',
                    acao: (
                      <Link
                        to="/fechamento"
                        className="inline-flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:bg-primary/90 transition-colors cursor-pointer active:scale-95"
                      >
                        <span className="material-symbols-outlined text-lg">add</span>
                        Novo fechamento
                      </Link>
                    ),
                  }
            }
          >
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-secondary text-xs font-bold uppercase">
                  <th className="px-6 py-4 border-b border-outline-variant/20">Data</th>
                  <th className="px-6 py-4 border-b border-outline-variant/20">
                    Corretor
                  </th>
                  <th className="px-6 py-4 border-b border-outline-variant/20">
                    Produtor
                  </th>
                  <th className="px-6 py-4 border-b border-outline-variant/20">
                    Commodity
                  </th>
                  <th className="px-6 py-4 border-b border-outline-variant/20 text-right">
                    Volume
                  </th>
                  <th className="px-6 py-4 border-b border-outline-variant/20 text-right">
                    Preço unit.
                  </th>
                  <th className="px-6 py-4 border-b border-outline-variant/20">
                    Entrega
                  </th>
                  <th className="px-6 py-4 border-b border-outline-variant/20 text-right">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {contratosFiltrados.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-on-surface whitespace-nowrap">
                      {formatarData(c.data_fechamento)}
                    </td>
                    <td className="px-6 py-4 text-secondary">{c.corretor_nome}</td>
                    <td className="px-6 py-4 font-medium text-on-surface">
                      {c.produtor_nome}
                    </td>
                    <td className="px-6 py-4 text-on-surface">{c.commodity}</td>
                    <td className="px-6 py-4 font-mono text-on-surface text-right whitespace-nowrap">
                      {formatarNumero(c.volume)}{' '}
                      <span className="text-secondary text-xs">{c.tipo_medida}</span>
                    </td>
                    <td className="px-6 py-4 font-mono text-on-surface text-right whitespace-nowrap">
                      {formatarMoeda(c.preco_unitario, c.moeda)}
                    </td>
                    <td className="px-6 py-4 text-secondary whitespace-nowrap">
                      {formatarData(c.data_entrega)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/detalhes-contrato?id=${c.id}`}
                        className="text-primary hover:underline font-bold text-sm cursor-pointer"
                      >
                        Ver detalhes
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </EstadoLista>
        </div>
      </div>
    </div>
  )
}