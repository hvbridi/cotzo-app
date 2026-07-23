import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Cadastros() {
  const navigate = useNavigate()

  const [produtor, setProdutor] = useState('')
  const [nomeFazenda, setNomeFazenda] = useState('')
  const [inscricaoEstadual, setInscricaoEstadual] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')
  const [observacoes, setObservacoes] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    alert('Fazenda cadastrada com sucesso!')
    navigate('/dashboard')
  }

  return (
    <div className="bg-surface text-on-surface antialiased flex h-screen overflow-hidden">
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
            className="flex items-center px-4 py-3 text-on-surface-variant hover:bg-surface-variant/50 rounded-lg font-body text-label-lg active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined mr-3">handshake</span>
            Novo Fechamento
          </Link>
          <Link
            to="/cadastros"
            className="flex items-center px-4 py-3 bg-primary-container text-on-primary-container rounded-lg font-semibold font-body text-label-lg active:scale-95 transition-transform"
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

      <main className="flex-1 h-full flex flex-col relative overflow-hidden bg-surface md:ml-72">
        <header className="docked full-width top-0 bg-surface dark:bg-surface-dim shadow-[0_4px_20px_rgba(46,50,48,0.06)] z-10 hidden md:flex justify-between items-center px-6 py-3 w-full border-b border-outline-variant/20 md:left-72">
          <div className="flex items-center">
            <h2 className="font-headline text-2xl font-bold text-primary dark:text-primary-fixed-dim">
              Terra Nova AgroCapital
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors active:scale-95 duration-200">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <div className="h-8 w-8 rounded-full bg-tertiary-container flex items-center justify-center overflow-hidden border-2 border-surface-container cursor-pointer">
              <img
                alt="User profile photo"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBz8aDiQ_xHN8yrKPLJ7bV6wYmmDvlHdoDCZi6e-vLVajcQQC8fXAkKXIkMzKpgQdE8Gp5_HCEfqJJjmslo6h1MV0U00FGHJqigtEaxQmWT8WjB185MHUINZWC3Z7QPCeEhzJR0SwjI4kK4WoAP7AkwJJgPe5Zi6v69_cfOa40g1ngWn72IErSCG5ZWOCMQ08M0sc2RBlGuE6cxI1buPXCRqj27X4fKBGxN0DlKCfT7HrNqJTs-rc2h9cE4Ak-NjddJwOYUp6LPCdg"
              />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-4xl mx-auto w-full">
            <div className="mb-8">
              <h1 className="font-headline text-3xl md:text-4xl font-bold text-on-surface mb-2">
                Cadastrar Nova Fazenda
              </h1>
              <p className="font-body text-on-surface-variant text-lg">
                Insira os dados da propriedade para vinculá-la a um produtor cadastrado.
              </p>
            </div>

            <div className="bg-surface-container-lowest rounded-xl shadow-[0_4px_20px_rgba(46,50,48,0.06)] border border-outline-variant/10 p-6 md:p-8">
              <form onSubmit={handleSubmit}>
                <div className="mb-8 p-4 bg-surface-container-low rounded-lg border border-outline-variant/20">
                  <label
                    className="block font-body text-sm font-semibold text-on-surface mb-2"
                    htmlFor="producerSelect"
                  >
                    Selecione o Produtor Proprietário *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-outline">
                        search
                      </span>
                    </div>
                    <select
                      className="block w-full pl-10 pr-10 py-3 text-base border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm rounded-lg bg-surface text-on-surface appearance-none"
                      id="producerSelect"
                      value={produtor}
                      onChange={(e) => setProdutor(e.target.value)}
                    >
                      <option disabled value="">
                        Buscar produtor...
                      </option>
                      <option value="1">João Silva - Fazenda Esperança</option>
                      <option value="2">
                        Maria Oliveira - Agropecuária Vale Verde
                      </option>
                      <option value="3">Carlos Santos - Sítio São José</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-outline">
                        arrow_drop_down
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label
                      className="block font-body text-sm font-semibold text-on-surface mb-2"
                      htmlFor="farmName"
                    >
                      Nome da Fazenda *
                    </label>
                    <input
                      className="block w-full px-4 py-3 text-base border border-outline-variant rounded-lg bg-surface text-on-surface focus:ring-2 focus:ring-primary focus:border-primary"
                      id="farmName"
                      placeholder="Ex: Fazenda Boa Vista"
                      type="text"
                      value={nomeFazenda}
                      onChange={(e) => setNomeFazenda(e.target.value)}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-baseline mb-2">
                      <label
                        className="block font-body text-sm font-semibold text-on-surface"
                        htmlFor="stateRegistration"
                      >
                        Inscrição Estadual da Fazenda
                      </label>
                      <span className="text-xs text-outline font-body">
                        Opcional
                      </span>
                    </div>
                    <input
                      className="block w-full px-4 py-3 text-base border border-outline-variant rounded-lg bg-surface text-on-surface focus:ring-2 focus:ring-primary focus:border-primary"
                      id="stateRegistration"
                      placeholder="000.000.000.000"
                      type="text"
                      value={inscricaoEstadual}
                      onChange={(e) => setInscricaoEstadual(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="md:col-span-2">
                    <label
                      className="block font-body text-sm font-semibold text-on-surface mb-2"
                      htmlFor="city"
                    >
                      Cidade *
                    </label>
                    <input
                      className="block w-full px-4 py-3 text-base border border-outline-variant rounded-lg bg-surface text-on-surface focus:ring-2 focus:ring-primary focus:border-primary"
                      id="city"
                      placeholder="Digite a cidade"
                      type="text"
                      value={cidade}
                      onChange={(e) => setCidade(e.target.value)}
                    />
                  </div>
                  <div>
                    <label
                      className="block font-body text-sm font-semibold text-on-surface mb-2"
                      htmlFor="state"
                    >
                      Estado *
                    </label>
                    <div className="relative">
                      <select
                        className="block w-full pl-4 pr-10 py-3 text-base border border-outline-variant rounded-lg bg-surface text-on-surface focus:ring-2 focus:ring-primary focus:border-primary appearance-none"
                        id="state"
                        value={estado}
                        onChange={(e) => setEstado(e.target.value)}
                      >
                        <option disabled value="">
                          UF
                        </option>
                        <option value="SP">SP</option>
                        <option value="MG">MG</option>
                        <option value="MT">MT</option>
                        <option value="GO">GO</option>
                        <option value="PR">PR</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="material-symbols-outlined text-outline">
                          arrow_drop_down
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-8">
                  <label
                    className="block font-body text-sm font-semibold text-on-surface mb-2"
                    htmlFor="logisticsNotes"
                  >
                    Observações de Logística/Acesso
                  </label>
                  <textarea
                    className="block w-full px-4 py-3 text-base border border-outline-variant rounded-lg bg-surface text-on-surface focus:ring-2 focus:ring-primary focus:border-primary resize-y"
                    id="logisticsNotes"
                    placeholder="Descreva as condições da estrada, pontos de referência ou restrições de veículos..."
                    rows="4"
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                  ></textarea>
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end items-center gap-4 pt-6 border-t border-outline-variant/20">
                  <button
                    className="w-full sm:w-auto px-6 py-3 rounded-lg font-body font-semibold text-primary bg-transparent border border-primary hover:bg-primary-container/20 transition-colors duration-200 cursor-pointer"
                    type="button"
                    onClick={() => navigate('/dashboard')}
                  >
                    Cancelar
                  </button>
                  <button
                    className="w-full sm:w-auto px-6 py-3 rounded-lg font-body font-semibold text-on-primary bg-primary hover:bg-surface-tint shadow-sm transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer"
                    type="submit"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      save
                    </span>
                    Cadastrar Fazenda
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}