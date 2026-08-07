import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { apiFetch } from '../services/api'

export default function DetalhesContrato() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const contratoId = searchParams.get('id')

  const [contrato, setContrato] = useState(null)
  const [produtor, setProdutor] = useState(null)
  const [fazenda, setFazenda] = useState(null)
  const [empresa, setEmpresa] = useState(null)
  const [corretor, setCorretor] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    async function carregarDetalhes() {
      if (!contratoId) {
        setErro('ID do contrato não informado.')
        setCarregando(false)
        return
      }

      try {
        setCarregando(true)
        const [resContratos, resProdutores, resFazendas, resEmpresas, resUsuarios] =
          await Promise.all([
            apiFetch('/contratos/'),
            apiFetch('/produtores/'),
            apiFetch('/produtores/1/fazendas'), // Exemplo de rota de fazendas
            apiFetch('/empresas/'),
            apiFetch('/usuarios/'),
          ])

        if (!resContratos.ok) throw new Error('Erro ao buscar contratos.')

        const listaContratos = await resContratos.json()
        const contratoEncontrado = listaContratos.find(
          (c) => String(c.id) === String(contratoId)
        )

        if (!contratoEncontrado) {
          throw new Error(`Contrato #${contratoId} não foi encontrado.`)
        }

        setContrato(contratoEncontrado)

        // Busca relacionamentos se disponíveis
        if (resProdutores.ok) {
          const listaProdutores = await resProdutores.json()
          setProdutor(listaProdutores.find((p) => p.id === contratoEncontrado.produtor_id))
        }

        if (resEmpresas.ok) {
          const listaEmpresas = await resEmpresas.json()
          setEmpresa(listaEmpresas.find((e) => e.id === contratoEncontrado.empresa_id))
        }

        if (resUsuarios.ok) {
          const listaUsuarios = await resUsuarios.json()
          setCorretor(listaUsuarios.find((u) => u.id === contratoEncontrado.usuario_id))
        }
      } catch (err) {
        setErro(err.message)
      } finally {
        setCarregando(false)
      }
    }

    carregarDetalhes()
  }, [contratoId])

  return (
    <div className="bg-background text-on-background antialiased h-screen overflow-hidden flex animate-fade-in font-body">
      {/* SideNavBar Padronizada com RELATÓRIOS selecionado */}
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
            className="flex items-center px-4 py-3 text-on-surface-variant hover:bg-surface-variant/50 rounded-lg text-label-lg active:scale-95 transition-transform duration-150"
          >
            <span className="material-symbols-outlined mr-3">person_book</span>
            Cadastros
          </Link>
          <Link
            to="/relatorios"
            className="flex items-center px-4 py-3 bg-primary-container text-on-primary-container rounded-lg font-semibold text-label-lg active:scale-95 transition-transform duration-150"
          >
            <span
              className="material-symbols-outlined mr-3"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              assessment
            </span>
            Relatórios
          </Link>
          <Link
            to="/configuracoes"
            className="flex items-center px-4 py-3 text-on-surface-variant hover:bg-surface-variant/50 rounded-lg text-label-lg active:scale-95 transition-transform duration-150"
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
            className="w-full flex items-center px-4 py-3 text-on-surface-variant hover:bg-surface-variant/50 rounded-lg text-label-lg active:scale-95 transition-transform duration-150 text-left cursor-pointer"
          >
            <span className="material-symbols-outlined mr-3">logout</span>
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col h-full md:ml-72 overflow-hidden">
        {/* TopAppBar Padronizada */}
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
              <button className="text-secondary hover:text-primary cursor-pointer p-2 rounded-full hover:bg-surface-container-low">
                <span className="material-symbols-outlined">notifications</span>
              </button>
              <button className="text-secondary hover:text-primary cursor-pointer p-2 rounded-full hover:bg-surface-container-low">
                <span className="material-symbols-outlined">settings</span>
              </button>
              <div className="h-8 w-8 rounded-full bg-surface-variant overflow-hidden border border-outline-variant/30 ml-2">
                <img
                  alt="Broker Profile"
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAXzrG1PTr-N-g3OrjHFglv0pdMaVUaNqcXT4YEJKuTUP-PhHC8zqrduDv0ym-mQF95YcnoExcceCN2DJAmKAPimEiryjzQs8qROYF2iUZUjyWDNq9xr59Nw1N9Bz8dUexormf9qTuta0lXuZCBI9s9L5JSy10lZ2yZNJmt4JDws-paCDg6pntp308Kmq94_GWwXnYKZFJTv9pLAEoNGSI92q9zdqSdyNujc3ap7ud9rWILp-DS1VdoU6Gg2Y8cll4i2vmCxNImrkE"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Content Canvas Rolável */}
        <main className="flex-1 mt-16 p-8 overflow-y-auto bg-surface-container-lowest">
          <div className="max-w-7xl mx-auto space-y-8 pb-16">
            {/* Voltar e Header da Operação */}
            <div className="flex flex-col gap-4">
              <Link
                to="/relatorios"
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors w-fit"
              >
                <span className="material-symbols-outlined text-lg">arrow_back</span>
                Voltar para Relatórios
              </Link>

              {carregando ? (
                <div className="p-12 text-center text-secondary bg-surface-bright rounded-2xl border border-outline-variant/20">
                  Carregando detalhes da operação...
                </div>
              ) : erro ? (
                <div className="p-12 text-center text-error bg-surface-bright rounded-2xl border border-outline-variant/20 font-semibold">
                  {erro}
                </div>
              ) : (
                <>
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-outline-variant/20 pb-6">
                    <div className="flex items-center gap-4 flex-wrap">
                      <h1 className="font-headline text-4xl font-bold text-on-surface">
                        CONTRATO #{contrato.id}
                      </h1>
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary-container text-on-primary-container text-xs font-bold uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-primary mr-2 animate-pulse"></span>
                        {contrato.status || 'Fechado'}
                      </span>
                    </div>

                    <button
                      onClick={() => navigate('/ofertas')}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-on-primary font-bold shadow-md hover:bg-primary/90 transition-all cursor-pointer self-start lg:self-auto"
                    >
                      Avançar Negociação / Ofertas
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                  </div>

                  {/* Main Grid de Cards */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Card 1: Alvo da Operação */}
                    <div className="bg-surface-bright rounded-2xl p-6 border border-outline-variant/20 shadow-sm flex flex-col justify-between">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-primary-container/40 flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined">payments</span>
                        </div>
                        <h2 className="font-headline text-xl font-bold text-on-surface">
                          Valores e Condições
                        </h2>
                      </div>

                      <div className="mb-6">
                        <span className="text-xs font-bold uppercase text-secondary tracking-wider block mb-1">
                          Preço Unitário Negociado
                        </span>
                        <div className="font-headline text-4xl font-bold text-on-surface">
                          {contrato.moeda === 'USD' ? '$' : 'R$'}{' '}
                          {Number(contrato.preco_unitario).toFixed(2)}{' '}
                          <span className="text-base text-secondary font-normal font-body">
                            / {contrato.tipo_medida || 'saca'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-surface-container-low">
                          <span className="text-xs font-bold text-secondary uppercase tracking-wider block mb-1">
                            Commodity
                          </span>
                          <span className="font-bold text-lg text-on-surface flex items-center gap-2">
                            <span className="material-symbols-outlined text-tertiary text-sm">
                              grass
                            </span>
                            {contrato.commodity} ({contrato.safra})
                          </span>
                        </div>

                        <div className="p-4 rounded-xl bg-surface-container-low">
                          <span className="text-xs font-bold text-secondary uppercase tracking-wider block mb-1">
                            Volume Total
                          </span>
                          <span className="font-bold text-lg text-on-surface flex items-center gap-2">
                            <span className="material-symbols-outlined text-tertiary text-sm">
                              inventory_2
                            </span>
                            {Number(contrato.volume).toLocaleString('pt-BR')} {contrato.tipo_medida}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card 2: Parte Ofertante (Produtor) */}
                    <div className="bg-surface-bright rounded-2xl p-6 border border-outline-variant/20 shadow-sm flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-secondary-container flex items-center justify-center text-on-secondary-container">
                            <span className="material-symbols-outlined">person</span>
                          </div>
                          <h2 className="font-headline text-xl font-bold text-on-surface">
                            Produtor Vendedor
                          </h2>
                        </div>
                        <span className="text-xs font-bold text-secondary uppercase tracking-wider">
                          Vendedor
                        </span>
                      </div>

                      <div className="p-5 rounded-xl bg-surface-container-low mb-4">
                        <div className="font-headline font-bold text-xl text-on-surface">
                          {produtor ? produtor.nome : `Produtor ID #${contrato.produtor_id}`}
                        </div>
                        <div className="text-sm text-secondary font-mono mt-1">
                          CPF/CNPJ: {produtor?.cpf_cnpj || 'Não informado'}
                        </div>
                        <div className="text-sm text-secondary mt-1">
                          WhatsApp: {produtor?.whatsapp || 'Não informado'}
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-surface-container-low flex justify-between items-center">
                        <span className="text-xs font-bold uppercase text-secondary">
                          Empresa Compradora
                        </span>
                        <span className="font-bold text-on-surface">
                          {empresa ? empresa.razao_social : `Empresa ID #${contrato.empresa_id}`}
                        </span>
                      </div>
                    </div>

                    {/* Card 3: Logística e Datas */}
                    <div className="bg-surface-bright rounded-2xl p-6 border border-outline-variant/20 shadow-sm flex flex-col justify-between">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-tertiary-container/30 flex items-center justify-center text-tertiary">
                          <span className="material-symbols-outlined">local_shipping</span>
                        </div>
                        <h2 className="font-headline text-xl font-bold text-on-surface">
                          Logística e Prazos
                        </h2>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <span className="material-symbols-outlined text-secondary mt-0.5">
                            location_on
                          </span>
                          <div>
                            <span className="text-xs font-bold uppercase text-secondary block">
                              Modalidade de Frete
                            </span>
                            <span className="font-bold text-on-surface">
                              {contrato.tipo_frete || 'FOB Fazenda'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <span className="material-symbols-outlined text-secondary mt-0.5">
                            calendar_today
                          </span>
                          <div>
                            <span className="text-xs font-bold uppercase text-secondary block">
                              Data de Fechamento
                            </span>
                            <span className="font-bold text-on-surface">
                              {contrato.data_fechamento}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <span className="material-symbols-outlined text-secondary mt-0.5">
                            event
                          </span>
                          <div>
                            <span className="text-xs font-bold uppercase text-secondary block">
                              Previsão de Entrega / Embarque
                            </span>
                            <span className="font-bold text-on-surface">
                              {contrato.data_entrega || 'Não informada'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card 4: Resumo Financeiro da Corretagem */}
                    <div className="bg-surface-bright rounded-2xl p-6 border border-outline-variant/20 shadow-sm flex flex-col justify-between">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-primary-container/30 flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined">analytics</span>
                        </div>
                        <h2 className="font-headline text-xl font-bold text-on-surface">
                          Resumo Financeiro
                        </h2>
                      </div>

                      <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-surface-container-low flex justify-between items-center">
                          <span className="text-xs font-bold uppercase text-secondary">
                            Valor Total do Contrato
                          </span>
                          <span className="font-headline text-xl font-bold text-primary">
                            {contrato.moeda === 'USD' ? '$' : 'R$'}{' '}
                            {Number(contrato.valor_total).toLocaleString('pt-BR', {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>

                        <div className="p-4 rounded-xl bg-surface-container-low flex justify-between items-center">
                          <span className="text-xs font-bold uppercase text-secondary">
                            Comissão da Corretora ({contrato.comissao_porcentagem}%)
                          </span>
                          <span className="font-headline text-xl font-bold text-tertiary">
                            {contrato.moeda === 'USD' ? '$' : 'R$'}{' '}
                            {Number(contrato.valor_comissao).toLocaleString('pt-BR', {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>

                        <div className="p-4 rounded-xl bg-surface-container-low flex justify-between items-center">
                          <span className="text-xs font-bold uppercase text-secondary">
                            Corretor Responsável
                          </span>
                          <span className="font-bold text-on-surface">
                            {corretor ? corretor.nome : `Usuário #${contrato.usuario_id}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}