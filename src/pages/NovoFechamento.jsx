import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function NovoFechamento() {
  const navigate = useNavigate()

  const [produtor, setProdutor] = useState('')
  const [fazendasDisponiveis, setFazendasDisponiveis] = useState([])
  const [fazenda, setFazenda] = useState('')
  const [moeda, setMoeda] = useState('BRL')

  const fazendasPorProdutor = {
    p1: [
      { id: 'f1', nome: 'Fazenda Santa Luzia' },
      { id: 'f2', nome: 'Sítio Novo' }
    ],
    p2: [
      { id: 'f3', nome: 'Fazenda Boa Esperança I' },
      { id: 'f4', nome: 'Fazenda Boa Esperança II' }
    ],
    p3: [
      { id: 'f5', nome: 'Fazenda Oliveira S.A. - Sede' }
    ]
  }

  const handleProdutorChange = (e) => {
    const pId = e.target.value
    setProdutor(pId)
    setFazenda('')
    if (fazendasPorProdutor[pId]) {
      setFazendasDisponiveis(fazendasPorProdutor[pId])
    } else {
      setFazendasDisponiveis([])
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    alert('Contrato Salvo com Sucesso!')
    navigate('/dashboard')
  }

  return (
    <div className="bg-background text-on-background font-body antialiased flex h-screen overflow-hidden">
      <aside className="hidden md:flex fixed left-0 top-0 h-full flex-col p-4 space-y-2 border-r border-outline-variant/20 bg-surface-container dark:bg-surface-container-lowest w-72 z-20">
        <div className="mb-8 px-2 pt-4">
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

        <nav className="flex-1 space-y-1">
          <Link
            to="/dashboard"
            className="flex items-center px-4 py-3 text-on-surface-variant hover:bg-surface-variant/50 rounded-lg font-body text-label-lg active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined mr-3">dashboard</span>
            Dashboard
          </Link>
          <Link
            to="/fechamento"
            className="flex items-center px-4 py-3 bg-primary-container text-on-primary-container rounded-lg font-semibold font-body text-label-lg active:scale-95 transition-transform"
          >
            <span
              className="material-symbols-outlined mr-3"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              handshake
            </span>
            Novo Fechamento
          </Link>
          <Link
            to="/cadastros"
            className="flex items-center px-4 py-3 text-on-surface-variant hover:bg-surface-variant/50 rounded-lg font-body text-label-lg active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined mr-3">person_book</span>
            Cadastros
          </Link>
          <Link
            to="/relatorios"
            className="flex items-center px-4 py-3 text-on-surface-variant hover:bg-surface-variant/50 rounded-lg font-body text-label-lg active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined mr-3">assessment</span>
            Relatórios
          </Link>
          <Link
            to="/configuracoes"
            className="flex items-center px-4 py-3 text-on-surface-variant hover:bg-surface-variant/50 rounded-lg font-body text-label-lg active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined mr-3">settings</span>
            Configurações
          </Link>
        </nav>

        <div className="mt-auto space-y-1 pt-4 border-t border-outline-variant/20">
          <a
            href="#"
            className="flex items-center px-4 py-3 text-on-surface-variant hover:bg-surface-variant/50 rounded-lg font-body text-label-lg active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined mr-3">help</span>
            Suporte
          </a>
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center px-4 py-3 text-on-surface-variant hover:bg-surface-variant/50 rounded-lg font-body text-label-lg active:scale-95 transition-transform text-left cursor-pointer"
          >
            <span className="material-symbols-outlined mr-3">logout</span>
            Sair
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col md:ml-72 w-full h-full">
        <header className="flex items-center justify-between px-6 w-full border-b border-outline-variant/30 bg-surface dark:bg-surface-dim h-16 z-10 shrink-0 shadow-sm">
          <button className="md:hidden text-on-surface-variant p-2 mr-2">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="flex items-center flex-1">
            <h1 className="md:hidden font-headline text-2xl font-bold text-primary dark:text-inverse-primary">
              Terra Agro
            </h1>
            <div className="hidden md:flex items-center bg-surface-container-low rounded-full px-4 py-2 w-96">
              <span className="material-symbols-outlined text-on-surface-variant mr-2 text-sm">
                search
              </span>
              <input
                className="bg-transparent border-none focus:ring-0 text-sm w-full font-body text-on-surface placeholder-on-surface-variant focus:outline-none"
                placeholder="Buscar..."
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 text-on-surface-variant hover:bg-surface-variant/50 rounded-full transition-colors cursor-pointer active:opacity-80">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="p-2 text-on-surface-variant hover:bg-surface-variant/50 rounded-full transition-colors cursor-pointer active:opacity-80">
              <span className="material-symbols-outlined">settings</span>
            </button>
            <div className="ml-4 w-8 h-8 rounded-full overflow-hidden border border-outline-variant/30 bg-surface-container-highest cursor-pointer">
              <img
                alt="User profile"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAiIQoVv5B_O5aTTuFKVZWuFsy4X1h6Oiif4r3knJFgZyzAf4riGsMcEOa38Fk0MvyDKU25KVsgPtE2VWkaT7gi-oEAS6W9DPHh-3etqZwlDRjzl-Xsp6Ovca-hGCtq4TNeN-QdmkCpZ92FEPNFYSuCWWnNQ193yFguzLAQUJXqvBwFTa3KuLPklLBIUyjiDoK0Rfw2MnHrypPvRIU5FgHfdz1jErMX6qxVjBmWH_qUHZihGB1J4Yb4CV1bDHyb7nryjkK1UzVAJZY"
              />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-surface-container-low">
          <div className="max-w-5xl mx-auto">
            <div className="mb-8">
              <nav aria-label="Breadcrumb" className="flex text-sm text-on-surface-variant mb-2 font-body">
                <ol className="inline-flex items-center space-x-1 md:space-x-3">
                  <li className="inline-flex items-center">
                    <Link className="inline-flex items-center hover:text-primary transition-colors" to="/dashboard">
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <div className="flex items-center">
                      <span className="material-symbols-outlined text-sm mx-1">chevron_right</span>
                      <span className="text-on-surface font-medium">Novo Fechamento</span>
                    </div>
                  </li>
                </ol>
              </nav>
              <h2 className="font-headline text-3xl font-bold text-on-surface">
                Novo Contrato de Fechamento de Grãos
              </h2>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="bg-surface-bright rounded-xl p-6 shadow-[0_4px_20px_rgba(46,50,48,0.06)] border border-outline-variant/10">
                <h3 className="font-headline text-xl text-primary font-bold mb-4 flex items-center">
                  <span className="material-symbols-outlined mr-2">person</span>
                  Dados do Vendedor
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="form-label-organic" htmlFor="produtor">
                      Produtor
                    </label>
                    <select
                      className="form-input-organic"
                      id="produtor"
                      name="produtor"
                      value={produtor}
                      onChange={handleProdutorChange}
                    >
                      <option disabled value="">
                        Selecione um produtor...
                      </option>
                      <option value="p1">Fazendas Reunidas Silva</option>
                      <option value="p2">Agropecuária Boa Esperança</option>
                      <option value="p3">Grupo Oliveira S.A.</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label-organic" htmlFor="fazenda">
                      Fazenda de Origem
                    </label>
                    <select
                      className="form-input-organic"
                      disabled={!produtor}
                      id="fazenda"
                      name="fazenda"
                      value={fazenda}
                      onChange={(e) => setFazenda(e.target.value)}
                    >
                      <option disabled value="">
                        {produtor ? 'Selecione a fazenda...' : 'Escolha um produtor primeiro...'}
                      </option>
                      {fazendasDisponiveis.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.nome}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-tertiary mt-1 flex items-center">
                      <span className="material-symbols-outlined text-[14px] mr-1">info</span>
                      Campos dependentes do Produtor selecionado
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-surface-bright rounded-xl p-6 shadow-[0_4px_20px_rgba(46,50,48,0.06)] border border-outline-variant/10">
                <h3 className="font-headline text-xl text-primary font-bold mb-4 flex items-center">
                  <span className="material-symbols-outlined mr-2">shopping_cart</span>
                  Detalhes da Venda
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="form-label-organic" htmlFor="commodity">
                      Commodity
                    </label>
                    <select className="form-input-organic" defaultValue="" id="commodity" name="commodity">
                      <option disabled value="">
                        Selecione...
                      </option>
                      <option value="soja">Soja</option>
                      <option value="milho">Milho</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="form-label-organic" htmlFor="volume">
                        Volume
                      </label>
                      <input className="form-input-organic" id="volume" name="volume" placeholder="0.00" type="number" />
                    </div>
                    <div className="col-span-1">
                      <label className="form-label-organic" htmlFor="unidade">
                        Unidade
                      </label>
                      <select className="form-input-organic" id="unidade" name="unidade">
                        <option value="sacas">Sacas</option>
                        <option value="toneladas">Ton.</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="form-label-organic" htmlFor="preco">
                      Preço Unitário
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-on-surface-variant sm:text-sm font-label" id="currency-symbol">
                          {moeda === 'BRL' ? 'R$' : 'US$'}
                        </span>
                      </div>
                      <input className="form-input-organic pl-12" id="preco" name="preco" placeholder="0.00" type="number" />
                    </div>
                  </div>
                  <div>
                    <label className="form-label-organic">Moeda</label>
                    <div className="flex space-x-4 mt-2">
                      <label className="flex items-center cursor-pointer">
                        <input
                          checked={moeda === 'BRL'}
                          className="form-radio text-primary focus:ring-primary border-outline-variant"
                          name="moeda"
                          type="radio"
                          value="BRL"
                          onChange={() => setMoeda('BRL')}
                        />
                        <span className="ml-2 text-on-surface font-body text-sm">R$ Reais</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          checked={moeda === 'USD'}
                          className="form-radio text-primary focus:ring-primary border-outline-variant"
                          name="moeda"
                          type="radio"
                          value="USD"
                          onChange={() => setMoeda('USD')}
                        />
                        <span className="ml-2 text-on-surface font-body text-sm">US$ Dólar</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-surface-bright rounded-xl p-6 shadow-[0_4px_20px_rgba(46,50,48,0.06)] border border-outline-variant/10">
                <h3 className="font-headline text-xl text-primary font-bold mb-4 flex items-center">
                  <span className="material-symbols-outlined mr-2">local_shipping</span>
                  Logística e Comprador
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="form-label-organic" htmlFor="comprador">
                      Empresa Compradora
                    </label>
                    <select className="form-input-organic" defaultValue="" id="comprador" name="comprador">
                      <option disabled value="">
                        Selecione a trading ou indústria...
                      </option>
                      <option value="c1">Bunge Alimentos</option>
                      <option value="c2">Cargill Agrícola S/A</option>
                      <option value="c3">Amaggi Exportação</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label-organic" htmlFor="frete">
                      Tipo de Frete
                    </label>
                    <select className="form-input-organic" defaultValue="" id="frete" name="frete">
                      <option disabled value="">
                        Selecione...
                      </option>
                      <option value="cif">CIF Armazém</option>
                      <option value="fob">FOB Fazenda</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label-organic" htmlFor="data_entrega">
                        Data de Entrega
                      </label>
                      <input className="form-input-organic" id="data_entrega" name="data_entrega" type="date" />
                    </div>
                    <div>
                      <label className="form-label-organic" htmlFor="data_pagamento">
                        Data de Pagamento
                      </label>
                      <input className="form-input-organic" id="data_pagamento" name="data_pagamento" type="date" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-surface-bright rounded-xl p-6 shadow-[0_4px_20px_rgba(46,50,48,0.06)] border border-outline-variant/10">
                <h3 className="font-headline text-xl text-primary font-bold mb-4 flex items-center">
                  <span className="material-symbols-outlined mr-2">admin_panel_settings</span>
                  Dados Internos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="form-label-organic" htmlFor="corretor">
                      Corretor Responsável
                    </label>
                    <select className="form-input-organic" defaultValue="" id="corretor" name="corretor">
                      <option disabled value="">
                        Selecione o corretor...
                      </option>
                      <option value="corr1">Carlos Mendes</option>
                      <option value="corr2">Ana Paula Costa</option>
                      <option value="corr3">Roberto Ferreira</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label-organic" htmlFor="num_contrato">
                      Nº do Contrato da Trading
                    </label>
                    <input
                      className="form-input-organic uppercase"
                      id="num_contrato"
                      name="num_contrato"
                      placeholder="Ex: TRD-2023-9982"
                      type="text"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6 pb-12">
                <button
                  className="px-6 py-3 rounded-xl border border-primary text-primary font-bold font-label hover:bg-primary/5 transition-colors focus:ring focus:ring-primary/20 cursor-pointer"
                  type="button"
                  onClick={() => navigate('/dashboard')}
                >
                  Cancelar
                </button>
                <button
                  className="px-6 py-3 rounded-xl bg-primary text-on-primary font-bold font-label hover:bg-on-primary-fixed-variant transition-colors focus:ring focus:ring-primary/50 shadow-sm flex items-center cursor-pointer"
                  type="submit"
                >
                  <span className="material-symbols-outlined mr-2">save</span>
                  Salvar Contrato
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}