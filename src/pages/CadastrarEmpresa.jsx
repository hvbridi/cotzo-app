import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function CadastrarEmpresa() {
  const navigate = useNavigate()

  // Estados dos Dados Corporativos
  const [razaoSocial, setRazaoSocial] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [tipoEstabelecimento, setTipoEstabelecimento] = useState('matriz')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')

  // Estados do Contato da Mesa de Operações
  const [nomeComprador, setNomeComprador] = useState('')
  const [telefone, setTelefone] = useState('')
  const [emailContratos, setEmailContratos] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    alert('Empresa compradora cadastrada com sucesso!')
    navigate('/empresas')
  }

  return (
    <div className="bg-background text-on-background antialiased h-screen overflow-hidden flex animate-fade-in">
      {/* SideNavBar Fixa na Altura da Tela */}
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
            className="flex items-center px-4 py-3 text-on-surface-variant hover:bg-surface-variant/50 rounded-lg font-body text-label-lg active:scale-95 transition-transform duration-150"
          >
            <span className="material-symbols-outlined mr-3">handshake</span>
            Novo Fechamento
          </Link>
          <Link
            to="/cadastros"
            className="flex items-center px-4 py-3 bg-primary-container text-on-primary-container rounded-lg font-semibold font-body text-label-lg active:scale-95 transition-transform duration-150"
          >
            <span
              className="material-symbols-outlined mr-3"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              person_book
            </span>
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
          <a
            href="#"
            className="flex items-center px-4 py-3 text-on-surface-variant hover:bg-surface-variant/50 rounded-lg font-body text-label-lg active:scale-95 transition-transform duration-150"
          >
            <span className="material-symbols-outlined mr-3">help</span>
            Suporte
          </a>
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center px-4 py-3 text-on-surface-variant hover:bg-surface-variant/50 rounded-lg font-body text-label-lg active:scale-95 transition-transform duration-150 text-left cursor-pointer"
          >
            <span className="material-symbols-outlined mr-3">logout</span>
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper Isolado */}
      <div className="flex-1 flex flex-col h-full md:ml-72 overflow-hidden">
        {/* TopAppBar */}
        <header className="fixed top-0 right-0 h-16 z-40 bg-background/80 dark:bg-background/80 backdrop-blur-md border-b border-outline-variant/20 md:left-72">
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

        {/* Page Canvas com Scroll Independente */}
        <main className="flex-1 p-8 mt-16 bg-surface-container-lowest overflow-y-auto">
          {/* Header & Breadcrumbs */}
          <div className="max-w-5xl mx-auto mb-8">
            <nav className="flex text-sm text-on-surface-variant mb-3 font-body" aria-label="Breadcrumb">
              <ol className="inline-flex items-center space-x-1 md:space-x-3">
                <li className="inline-flex items-center">
                  <Link to="/cadastros" className="inline-flex items-center hover:text-primary transition-colors">
                    Central de Cadastros
                  </Link>
                </li>
                <li>
                  <div className="flex items-center">
                    <span className="material-symbols-outlined text-sm mx-1">chevron_right</span>
                    <Link to="/empresas" className="hover:text-primary transition-colors ml-1 md:ml-2">
                      Empresas
                    </Link>
                  </div>
                </li>
                <li aria-current="page">
                  <div className="flex items-center">
                    <span className="material-symbols-outlined text-sm mx-1">chevron_right</span>
                    <span className="text-primary font-medium ml-1 md:ml-2">Nova Empresa</span>
                  </div>
                </li>
              </ol>
            </nav>
            <h2 className="text-4xl font-headline font-bold text-on-surface">
              Nova Empresa Compradora
            </h2>
          </div>

          <form className="max-w-5xl mx-auto space-y-8" onSubmit={handleSubmit}>
            {/* Card 1: Dados Corporativos */}
            <div className="bg-surface-bright rounded-xl p-8 shadow-[0_4px_20px_rgba(46,50,48,0.06)] border border-outline-variant/10">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-surface-container-high">
                <span className="material-symbols-outlined text-tertiary text-2xl">
                  domain
                </span>
                <h3 className="text-xl font-headline font-semibold text-on-surface">
                  Dados Corporativos
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 font-body">
                {/* Razão Social */}
                <div className="col-span-1 md:col-span-4 flex flex-col gap-2">
                  <label htmlFor="razaoSocial" className="text-sm font-medium text-on-surface-variant">
                    Razão Social da Empresa
                  </label>
                  <input
                    type="text"
                    id="razaoSocial"
                    name="razaoSocial"
                    placeholder="Digite a razão social completa"
                    value={razaoSocial}
                    onChange={(e) => setRazaoSocial(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow"
                  />
                </div>

                {/* CNPJ */}
                <div className="col-span-1 md:col-span-2 flex flex-col gap-2">
                  <label htmlFor="cnpj" className="text-sm font-medium text-on-surface-variant">
                    CNPJ
                  </label>
                  <input
                    type="text"
                    id="cnpj"
                    name="cnpj"
                    placeholder="00.000.000/0000-00"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow"
                  />
                </div>

                {/* Tipo de Estabelecimento (Radio) */}
                <div className="col-span-1 md:col-span-2 flex flex-col gap-2">
                  <label className="text-sm font-medium text-on-surface-variant">
                    Tipo de Estabelecimento
                  </label>
                  <div className="flex items-center h-[50px] gap-6 px-4 bg-surface-container-low rounded-lg border border-transparent">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="radio"
                        name="tipoEstabelecimento"
                        value="matriz"
                        checked={tipoEstabelecimento === 'matriz'}
                        onChange={() => setTipoEstabelecimento('matriz')}
                        className="w-4 h-4 text-primary bg-surface-container-lowest border-outline-variant focus:ring-primary focus:ring-2"
                      />
                      <span className="text-on-surface group-hover:text-primary transition-colors">
                        Matriz
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="radio"
                        name="tipoEstabelecimento"
                        value="filial"
                        checked={tipoEstabelecimento === 'filial'}
                        onChange={() => setTipoEstabelecimento('filial')}
                        className="w-4 h-4 text-primary bg-surface-container-lowest border-outline-variant focus:ring-primary focus:ring-2"
                      />
                      <span className="text-on-surface group-hover:text-primary transition-colors">
                        Filial
                      </span>
                    </label>
                  </div>
                </div>

                {/* Cidade */}
                <div className="col-span-1 md:col-span-2 flex flex-col gap-2">
                  <label htmlFor="cidade" className="text-sm font-medium text-on-surface-variant">
                    Cidade
                  </label>
                  <input
                    type="text"
                    id="cidade"
                    name="cidade"
                    placeholder="Nome da cidade"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow"
                  />
                </div>

                {/* Estado */}
                <div className="col-span-1 md:col-span-1 flex flex-col gap-2">
                  <label htmlFor="estado" className="text-sm font-medium text-on-surface-variant">
                    Estado
                  </label>
                  <div className="relative">
                    <select
                      id="estado"
                      name="estado"
                      value={estado}
                      onChange={(e) => setEstado(e.target.value)}
                      className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-lg pl-4 pr-10 py-3 text-on-surface appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow cursor-pointer"
                    >
                      <option value="" disabled>
                        UF
                      </option>
                      <option value="SP">SP</option>
                      <option value="MT">MT</option>
                      <option value="GO">GO</option>
                      <option value="PR">PR</option>
                      <option value="MG">MG</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
                      expand_more
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Contatos da Mesa de Operações */}
            <div className="bg-surface-bright rounded-xl p-8 shadow-[0_4px_20px_rgba(46,50,48,0.06)] border border-outline-variant/10">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-surface-container-high">
                <span className="material-symbols-outlined text-tertiary text-2xl">
                  support_agent
                </span>
                <h3 className="text-xl font-headline font-semibold text-on-surface">
                  Contatos da Mesa de Operações
                </h3>
                <button
                  type="button"
                  onClick={() => alert('Adicionar novo comprador')}
                  className="ml-auto flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg font-semibold text-sm hover:bg-primary-container hover:text-on-primary-container transition-colors active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">add</span>
                  Adicionar Contato
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-body">
                {/* Nome do Comprador */}
                <div className="col-span-1 md:col-span-2 flex flex-col gap-2">
                  <label htmlFor="nomeComprador" className="text-sm font-medium text-on-surface-variant">
                    Nome do Comprador/Operador
                  </label>
                  <input
                    type="text"
                    id="nomeComprador"
                    name="nomeComprador"
                    placeholder="Nome completo do contato principal"
                    value={nomeComprador}
                    onChange={(e) => setNomeComprador(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow"
                  />
                </div>

                {/* Telefone */}
                <div className="col-span-1 flex flex-col gap-2">
                  <label htmlFor="telefone" className="text-sm font-medium text-on-surface-variant">
                    Telefone/WhatsApp Direto
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60">
                      call
                    </span>
                    <input
                      type="tel"
                      id="telefone"
                      name="telefone"
                      placeholder="(00) 00000-0000"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-lg pl-10 pr-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="col-span-1 flex flex-col gap-2">
                  <label htmlFor="emailContratos" className="text-sm font-medium text-on-surface-variant">
                    E-mail para Envio de Contratos
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60">
                      mail
                    </span>
                    <input
                      type="email"
                      id="emailContratos"
                      name="emailContratos"
                      placeholder="contatos@empresa.com.br"
                      value={emailContratos}
                      onChange={(e) => setEmailContratos(e.target.value)}
                      className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-lg pl-10 pr-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-4 pt-6 pb-12 font-body">
              <button
                type="button"
                onClick={() => navigate('/empresas')}
                className="px-6 py-3 rounded-xl border border-outline-variant text-on-surface-variant bg-surface-bright hover:bg-surface-container-low font-semibold transition-colors focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-8 py-3 bg-primary text-on-primary rounded-xl font-semibold shadow-sm hover:bg-primary-container hover:text-on-primary-container transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer"
              >
                Salvar Cadastro
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  )
}