import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useEmpresas } from '../services/queries'
import { normalizarBusca, formatarNumero, formatarCpfCnpj } from '../utils/formatters'
import { EstadoLista, SkeletonTabela } from '../components/ui/PageState'

export default function Empresas() {
  const navigate = useNavigate()
  const [busca, setBusca] = useState('')

  const { data: empresas = [], isLoading, error, refetch } = useEmpresas()

  const empresasFiltradas = useMemo(() => {
    const termo = normalizarBusca(busca)
    if (!termo) return empresas
    return empresas.filter((emp) =>
      [emp.razao_social, emp.nome, emp.cnpj, emp.contato_nome].some((campo) =>
        normalizarBusca(campo).includes(termo)
      )
    )
  }, [empresas, busca])

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
            <span className="text-primary font-medium">Empresas</span>
          </div>
          <h2 className="font-headline text-3xl font-semibold text-on-background mb-1">
            Empresas / Tradings
          </h2>
          <p className="text-secondary text-lg">
            Gerencie o cadastro de empresas compradoras e tradings parceiras.
          </p>
        </div>
        <Link
          to="/cadastrar-empresa"
          className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2 active:scale-95 cursor-pointer self-start md:self-auto shrink-0"
        >
          <span className="material-symbols-outlined">add</span>
          Nova empresa
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
              placeholder="Buscar por razão social ou CNPJ..."
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          {!isLoading && !error && (
            <p className="text-sm text-secondary font-body shrink-0">
              {formatarNumero(empresasFiltradas.length)}{' '}
              {empresasFiltradas.length === 1 ? 'empresa' : 'empresas'}
            </p>
          )}
        </div>

        <div className="overflow-x-auto">
          <EstadoLista
            carregando={isLoading}
            erro={error}
            vazio={empresasFiltradas.length === 0}
            onTentarNovamente={refetch}
            skeleton={<SkeletonTabela colunas={5} />}
            vazioProps={
              busca
                ? {
                    icone: 'search_off',
                    titulo: 'Nenhuma empresa corresponde à busca',
                    descricao: `Nada encontrado para "${busca}". Tente outro termo.`,
                  }
                : {
                    icone: 'business',
                    titulo: 'Nenhuma empresa cadastrada',
                    descricao:
                      'Cadastre a primeira trading compradora para registrar fechamentos.',
                    acao: (
                      <Link
                        to="/cadastrar-empresa"
                        className="inline-flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:bg-primary/90 transition-colors cursor-pointer active:scale-95"
                      >
                        <span className="material-symbols-outlined text-lg">add</span>
                        Cadastrar empresa
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
                    Razão social
                  </th>
                  <th className="py-3 px-6 font-medium border-b border-outline-variant/20 whitespace-nowrap">
                    CNPJ
                  </th>
                  <th className="py-3 px-6 font-medium border-b border-outline-variant/20">
                    Contato
                  </th>
                  <th className="py-3 px-6 font-medium border-b border-outline-variant/20 text-right">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {empresasFiltradas.map((emp) => (
                  <tr
                    key={emp.id}
                    className="border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors"
                  >
                    <td className="py-4 px-6 font-mono text-secondary">#{emp.id}</td>
                    <td className="py-4 px-6 font-medium text-on-surface">
                      {emp.razao_social || emp.nome}
                    </td>
                    <td className="py-4 px-6 text-secondary">
                      {formatarCpfCnpj(emp.cnpj)}
                    </td>
                    <td className="py-4 px-6 text-on-surface">
                      {emp.contato_nome || '—'}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => navigate(`/detalhes-empresa?id=${emp.id}`)}
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