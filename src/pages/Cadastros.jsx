import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useProdutores, useEmpresas, useFazendasEmCache } from '../services/queries'
import { formatarNumero } from '../utils/formatters'

const CARTOES = [
  {
    rota: '/produtores',
    icone: 'agriculture',
    titulo: 'Produtores',
    descricao: 'Gerenciar base de agricultores parceiros e cooperados.',
    corTexto: 'text-primary',
    corBorda: 'hover:border-primary/40',
    corHover: 'group-hover:bg-primary-container',
    corTitulo: 'group-hover:text-primary',
    enfeite:
      'absolute top-0 right-0 w-32 h-32 bg-primary-container/20 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-500 ease-out pointer-events-none',
  },
  {
    rota: '/fazendas',
    icone: 'map',
    titulo: 'Fazendas',
    descricao: 'Propriedades rurais, geolocalização e infraestrutura logística.',
    corTexto: 'text-tertiary',
    corBorda: 'hover:border-tertiary/40',
    corHover: 'group-hover:bg-tertiary-container',
    corTitulo: 'group-hover:text-tertiary',
    enfeite:
      'absolute bottom-0 left-0 w-32 h-32 bg-tertiary-container/20 rounded-tr-full -ml-16 -mb-16 transition-transform group-hover:scale-150 duration-500 ease-out pointer-events-none',
  },
  {
    rota: '/empresas',
    icone: 'business',
    titulo: 'Empresas',
    descricao: 'Tradings, compradores, fornecedores e parceiros corporativos.',
    corTexto: 'text-secondary',
    corBorda: 'hover:border-secondary/40',
    corHover: 'group-hover:bg-secondary-container',
    corTitulo: 'group-hover:text-secondary',
    enfeite:
      'absolute inset-0 bg-secondary-container/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none',
  },
]

export default function Cadastros() {
  /*
   * Esta tela é um hub de navegação: precisa aparecer na hora do clique.
   *
   * As contagens são um enfeite útil, não o conteúdo — então elas só começam
   * a ser buscadas depois da primeira pintura. Assim a página entra
   * instantaneamente e os números chegam depois.
   */
  const [contarAgora, setContarAgora] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setContarAgora(true))
    return () => cancelAnimationFrame(id)
  }, [])

  // Duas requisições baratas, uma cada
  const { data: produtores } = useProdutores({ enabled: contarAgora })
  const { data: empresas } = useEmpresas({ enabled: contarAgora })

  /*
   * Fazendas fica de fora de propósito. Enquanto o backend não expuser
   * GET /fazendas/, montar essa lista custa uma requisição por produtor —
   * caro demais para exibir um número. Aqui só lemos o que já estiver em
   * cache, sem disparar nada.
   */
  const fazendasEmCache = useFazendasEmCache()

  const contagens = {
    '/produtores': produtores?.length,
    '/fazendas': fazendasEmCache?.length,
    '/empresas': empresas?.length,
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-headline font-semibold text-on-background mb-1">
          Central de Cadastros
        </h2>
        <p className="text-secondary text-lg">
          Selecione a categoria desejada para gerenciar registros, atualizar informações
          ou adicionar novos dados à base.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {CARTOES.map((c) => {
          const total = contagens[c.rota]
          return (
            <Link
              key={c.rota}
              to={c.rota}
              className={`group block bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/20 ${c.corBorda} shadow-[0_4px_20px_rgba(46,50,48,0.06)] hover:shadow-lg transition-all duration-300 active:scale-[0.98] flex flex-col items-center text-center aspect-square justify-center relative overflow-hidden cursor-pointer`}
            >
              <div className={c.enfeite}></div>

              <div
                className={`w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-6 ${c.corHover} transition-colors duration-300`}
              >
                <span className={`material-symbols-outlined text-4xl ${c.corTexto}`}>
                  {c.icone}
                </span>
              </div>

              <h3
                className={`font-headline text-2xl font-semibold text-on-surface mb-2 ${c.corTitulo} transition-colors`}
              >
                {c.titulo}
              </h3>

              {/* Altura fixa para o cartão não pular quando o número chegar */}
              <span className="font-body text-sm font-bold text-secondary mb-3 h-5 transition-opacity duration-300">
                {total === undefined
                  ? ''
                  : `${formatarNumero(total)} ${
                      total === 1 ? 'registro' : 'registros'
                    }`}
              </span>

              <p className="font-body text-on-surface-variant text-base leading-relaxed px-4">
                {c.descricao}
              </p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}