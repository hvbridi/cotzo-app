import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useContratos, usePerfil } from '../services/queries'
import {
  formatarData,
  formatarMoeda,
  formatarNumero,
  classesStatus,
} from '../utils/formatters'
import { EstadoLista, SkeletonCards, SkeletonTabela } from '../components/ui/PageState'

const QUANTIDADE_RECENTES = 8

function CardKpi({ rotulo, valor, icone, cor = 'text-primary', carregando }) {
  return (
    <div className="bg-surface-bright p-6 rounded-2xl border border-outline-variant/20 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between text-secondary gap-2">
        <span className="text-xs font-bold uppercase tracking-wide">{rotulo}</span>
        <span className={`material-symbols-outlined ${cor}`}>{icone}</span>
      </div>
      <div className="mt-4">
        {carregando ? (
          <div className="h-8 w-24 rounded bg-surface-variant animate-pulse" />
        ) : (
          <span className={`text-2xl font-bold font-mono ${cor}`}>{valor}</span>
        )}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { perfil } = usePerfil()
  const { data: contratos = [], isLoading, error, refetch } = useContratos()

  const metricas = useMemo(() => {
    return contratos.reduce(
      (acc, c) => ({
        volume: acc.volume + (Number(c.volume) || 0),
        valor: acc.valor + (Number(c.valor_total) || 0),
        comissao: acc.comissao + (Number(c.valor_comissao) || 0),
      }),
      { volume: 0, valor: 0, comissao: 0 }
    )
  }, [contratos])

  // A tabela se chama "recentes", então mostra os mais recentes de verdade
  const recentes = useMemo(
    () => [...contratos].sort((a, b) => b.id - a.id).slice(0, QUANTIDADE_RECENTES),
    [contratos]
  )

  const primeiroNome = perfil.nome?.split(' ')[0] || ''

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-headline text-3xl font-semibold text-on-background mb-1">
          {primeiroNome ? `Olá, ${primeiroNome}` : 'Dashboard'}
        </h2>
        <p className="text-secondary text-lg">
          Acompanhe o volume acumulado e as comissões geradas no sistema.
        </p>
      </div>

      {/* KPIs */}
      {isLoading ? (
        <SkeletonCards quantidade={4} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <CardKpi
            rotulo="Contratos fechados"
            valor={formatarNumero(contratos.length)}
            icone="description"
            cor="text-on-surface"
          />
          <CardKpi
            rotulo="Volume negociado"
            valor={`${formatarNumero(metricas.volume)} sc`}
            icone="grain"
            cor="text-on-surface"
          />
          <CardKpi
            rotulo="Valor total do grão"
            valor={formatarMoeda(metricas.valor)}
            icone="payments"
          />
          <CardKpi
            rotulo="Comissão gerada"
            valor={formatarMoeda(metricas.comissao)}
            icone="savings"
            cor="text-tertiary"
          />
        </div>
      )}

      {/* Contratos recentes */}
      <div className="bg-surface-bright rounded-2xl border border-outline-variant/20 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-outline-variant/20 flex flex-wrap justify-between items-center gap-3">
          <h3 className="font-headline font-bold text-lg text-on-surface">
            Contratos recentes
          </h3>
          {contratos.length > QUANTIDADE_RECENTES && (
            <Link
              to="/relatorios"
              className="text-sm font-bold text-primary hover:underline cursor-pointer"
            >
              Ver todos os {formatarNumero(contratos.length)}
            </Link>
          )}
        </div>

        <div className="overflow-x-auto">
          <EstadoLista
            carregando={isLoading}
            erro={error}
            vazio={contratos.length === 0}
            onTentarNovamente={refetch}
            skeleton={<SkeletonTabela colunas={7} />}
            vazioProps={{
              icone: 'handshake',
              titulo: 'Nenhum contrato registrado',
              descricao: 'Registre o primeiro fechamento para acompanhar os números.',
              acao: (
                <Link
                  to="/fechamento"
                  className="inline-flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:bg-primary/90 transition-colors cursor-pointer active:scale-95"
                >
                  <span className="material-symbols-outlined text-lg">add</span>
                  Novo fechamento
                </Link>
              ),
            }}
          >
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-secondary text-xs font-bold uppercase">
                  <th className="py-3 px-6 border-b border-outline-variant/20">ID</th>
                  <th className="py-3 px-6 border-b border-outline-variant/20">Data</th>
                  <th className="py-3 px-6 border-b border-outline-variant/20">
                    Commodity
                  </th>
                  <th className="py-3 px-6 border-b border-outline-variant/20">Safra</th>
                  <th className="py-3 px-6 border-b border-outline-variant/20 text-right">
                    Volume
                  </th>
                  <th className="py-3 px-6 border-b border-outline-variant/20 text-right">
                    Total
                  </th>
                  <th className="py-3 px-6 border-b border-outline-variant/20 text-right">
                    Comissão
                  </th>
                  <th className="py-3 px-6 border-b border-outline-variant/20">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {recentes.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors"
                  >
                    <td className="py-4 px-6 font-mono text-secondary">#{c.id}</td>
                    <td className="py-4 px-6 text-on-surface whitespace-nowrap">
                      {formatarData(c.data_fechamento)}
                    </td>
                    <td className="py-4 px-6 font-semibold text-on-surface">
                      {c.commodity}
                    </td>
                    <td className="py-4 px-6 text-secondary">{c.safra}</td>
                    <td className="py-4 px-6 font-mono text-on-surface text-right whitespace-nowrap">
                      {formatarNumero(c.volume)} {c.tipo_medida}
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-primary text-right whitespace-nowrap">
                      {formatarMoeda(c.valor_total, c.moeda)}
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-tertiary text-right whitespace-nowrap">
                      {formatarMoeda(c.valor_comissao, c.moeda)}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-3 py-1 text-xs font-bold rounded-full whitespace-nowrap ${classesStatus(
                          c.status
                        )}`}
                      >
                        {c.status || 'Fechado'}
                      </span>
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