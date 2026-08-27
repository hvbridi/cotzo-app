import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useFazendas } from '../services/queries'
import { normalizarBusca, formatarNumero } from '../utils/formatters'
import { EstadoLista, SkeletonTabela } from '../components/ui/PageState'

export default function Fazendas() {
  const navigate = useNavigate()
  const [busca, setBusca] = useState('')

  // Uma linha no lugar do useEffect que buscava perfil + produtores + fazendas.
  // Na primeira visita monta a lista; nas seguintes vem do cache, sem loading.
  const { data: fazendas = [], isLoading, error, refetch } = useFazendas()

  const fazendasFiltradas = useMemo(() => {
    const termo = normalizarBusca(busca)
    if (!termo) return fazendas
    return fazendas.filter((f) =>
      [f.nome, f.produtor_nome, f.municipio, f.inscricao_estadual].some((campo) =>
        normalizarBusca(campo).includes(termo)
      )
    )
  }, [fazendas, busca])

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
            Consulte a infraestrutura, rotas logísticas e especificações das fazendas
            parceiras.
          </p>
        </div>
        <Link
          to="/cadastrar-fazenda"
          className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2 active:scale-95 cursor-pointer self-start md:self-auto shrink-0"
        >
          <span className="material-symbols-outlined">add</span>
          Nova Fazenda
        </Link>
      </div>

      {/* Tabela */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 overflow-hidden">
        <div className="p-6 border-b border-outline-variant/20 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div className="relative w-full sm:max-w-md">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary text-sm">
              search
            </span>
            <input
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm text-on-surface placeholder:text-secondary transition-all"
              placeholder="Buscar por fazenda, produtor ou município..."
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          {!isLoading && !error && (
            <p className="text-sm text-secondary font-body shrink-0">
              {formatarNumero(fazendasFiltradas.length)}{' '}
              {fazendasFiltradas.length === 1 ? 'fazenda' : 'fazendas'}
            </p>
          )}
        </div>

        <div className="overflow-x-auto">
          <EstadoLista
            carregando={isLoading}
            erro={error}
            vazio={fazendasFiltradas.length === 0}
            onTentarNovamente={refetch}
            skeleton={<SkeletonTabela colunas={6} />}
            vazioProps={
              busca
                ? {
                    icone: 'search_off',
                    titulo: 'Nenhuma fazenda corresponde à busca',
                    descricao: `Nada encontrado para "${busca}". Tente outro termo.`,
                  }
                : {
                    icone: 'map',
                    titulo: 'Nenhuma fazenda cadastrada',
                    descricao:
                      'Cadastre a primeira propriedade para começar a registrar fechamentos.',
                    acao: (
                      <Link
                        to="/cadastrar-fazenda"
                        className="inline-flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:bg-primary/90 transition-colors cursor-pointer active:scale-95"
                      >
                        <span className="material-symbols-outlined text-lg">add</span>
                        Cadastrar fazenda
                      </Link>
                    ),
                  }
            }
          >
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-secondary text-sm">
                  <th className="py-3 px-6 font-medium border-b border-outline-variant/20 whitespace-nowrap">
                    ID
                  </th>
                  <th className="py-3 px-6 font-medium border-b border-outline-variant/20">
                    Fazenda
                  </th>
                  <th className="py-3 px-6 font-medium border-b border-outline-variant/20">
                    Produtor proprietário
                  </th>
                  <th className="py-3 px-6 font-medium border-b border-outline-variant/20">
                    Município
                  </th>
                  <th className="py-3 px-6 font-medium border-b border-outline-variant/20 whitespace-nowrap">
                    Frete / Balança
                  </th>
                  <th className="py-3 px-6 font-medium border-b border-outline-variant/20 text-right">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {fazendasFiltradas.map((f) => (
                  <tr
                    key={f.id}
                    className="border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors"
                  >
                    <td className="py-4 px-6 font-mono text-secondary">#{f.id}</td>
                    <td className="py-4 px-6 font-bold text-on-surface">{f.nome}</td>
                    <td className="py-4 px-6 text-on-surface">{f.produtor_nome}</td>
                    <td className="py-4 px-6 text-secondary">{f.municipio || '—'}</td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-md bg-surface-container text-on-surface text-xs font-semibold whitespace-nowrap">
                        {f.condicao_frete || 'FOB'}
                        {f.comprimento_balanca
                          ? ` • Balança ${f.comprimento_balanca}m`
                          : ''}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() =>
                          navigate(
                            `/detalhes-fazenda?id=${f.id}&produtor_id=${f.produtor_id}`
                          )
                        }
                        className="text-primary hover:underline font-bold text-sm transition-colors cursor-pointer"
                      >
                        Ver detalhes
                      </button>
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