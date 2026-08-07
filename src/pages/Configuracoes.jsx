import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiFetch } from '../services/api'

export default function Configuracoes() {
  const navigate = useNavigate()

  // Controle de Abas
  const [abaAtiva, setAbaAtiva] = useState('geral') // 'geral' ou 'usuarios'

  // Estados dos Meus Dados (Aba Geral)
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenhaPerfil, setNovaSenhaPerfil] = useState('')
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('')

  // Estados do Gerenciamento de Usuários (Aba Corretores)
  const [usuarios, setUsuarios] = useState([])
  const [busca, setBusca] = useState('')
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(false)
  const [modalAberto, setModalAberto] = useState(false)
  const [menuAbertoId, setMenuAbertoId] = useState(null)

  // Campos do Modal de Novo Corretor
  const [novoNome, setNovoNome] = useState('')
  const [novoEmail, setNovoEmail] = useState('')
  const [novoTelefone, setNovoTelefone] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [novoCargo, setNovoCargo] = useState('corretor')
  const [salvandoUsuario, setSalvandoUsuario] = useState(false)

  // Função para garantir que o número SEMPRE tenha o 55 e quantidade correta de dígitos
  const sanitizarTelefoneWhatsApp = (num) => {
    let limpo = (num || '').replace(/\D/g, '')

    if (!limpo) {
      throw new Error('O número de WhatsApp é obrigatório.')
    }

    // Se o usuário digitou sem DDI (ex: 66999887766 ou 11987654321 - 10 ou 11 dígitos), insere 55 automaticamente
    if (limpo.length === 10 || limpo.length === 11) {
      limpo = '55' + limpo
    }

    // Valida se ficou no padrão exato brasileiro com 55 + DDD (2 dig) + Número (8 ou 9 dig)
    if ((limpo.length !== 12 && limpo.length !== 13) || !limpo.startsWith('55')) {
      throw new Error(
        'Por favor, digite um número de WhatsApp válido com DDD (ex: 66 99988-7766 ou 5566999887766).'
      )
    }

    return limpo
  }

  // Carrega os usuários do banco ao abrir a aba
  const carregarUsuarios = async () => {
    setCarregandoUsuarios(true)
    try {
      const resposta = await apiFetch('/usuarios/')
      if (resposta.ok) {
        const dados = await resposta.json()
        setUsuarios(dados)
      }
    } catch (err) {
      console.error('Erro ao buscar usuários:', err)
    } finally {
      setCarregandoUsuarios(false)
    }
  }

  useEffect(() => {
    if (abaAtiva === 'usuarios') {
      carregarUsuarios()
    }
  }, [abaAtiva])

  // Cadastrar novo corretor/usuário
  const handleCadastrarUsuario = async (e) => {
    e.preventDefault()

    try {
      // Valida e formata o telefone para garantir o DDI 55
      const telefoneValidado = sanitizarTelefoneWhatsApp(novoTelefone)

      setSalvandoUsuario(true)

      const payload = {
        nome: novoNome,
        email: novoEmail,
        telefone: telefoneValidado,
        senha_hash: novaSenha,
        cargo: novoCargo,
      }

      const resposta = await apiFetch('/usuarios/', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (resposta.status === 403) {
        throw new Error(
          'Acesso negado: Apenas administradores podem cadastrar novos usuários.'
        )
      }

      if (!resposta.ok) {
        const erroDados = await resposta.json()
        throw new Error(erroDados.detail || 'Erro ao cadastrar novo usuário.')
      }

      alert('Novo corretor cadastrado com sucesso!')
      setModalAberto(false)
      setNovoNome('')
      setNovoEmail('')
      setNovoTelefone('')
      setNovaSenha('')
      setNovoCargo('corretor')
      carregarUsuarios()
    } catch (err) {
      alert(err.message)
    } finally {
      setSalvandoUsuario(false)
    }
  }

  // Deletar corretor/usuário (com trava de Admin no backend)
  const handleDeletarUsuario = async (id, nome) => {
    if (!window.confirm(`Tem certeza que deseja remover o corretor "${nome}"?`))
      return

    try {
      const resposta = await apiFetch(`/usuarios/${id}`, {
        method: 'DELETE',
      })

      if (resposta.status === 403) {
        throw new Error(
          'Acesso negado: Apenas administradores possuem permissão para excluir usuários.'
        )
      }

      if (!resposta.ok) {
        const errData = await resposta.json()
        throw new Error(errData.detail || 'Falha ao remover o usuário.')
      }

      alert('Corretor removido com sucesso!')
      carregarUsuarios()
    } catch (err) {
      alert(err.message)
    }
  }

  // Gera iniciais do nome para o avatar
  const getIniciais = (nome) => {
    if (!nome) return 'US'
    const partes = nome.trim().split(' ')
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase()
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
  }

  // Filtro de busca de corretores
  const usuariosFiltrados = usuarios.filter((u) => {
    const termo = busca.toLowerCase()
    const nomeUser = (u.nome || '').toLowerCase()
    const emailUser = (u.email || '').toLowerCase()
    return nomeUser.includes(termo) || emailUser.includes(termo)
  })

  return (
    <div className="bg-background text-on-background antialiased h-screen overflow-hidden flex animate-fade-in font-body">
      {/* SideNavBar Fixa */}
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
            className="flex items-center px-4 py-3 text-on-surface-variant hover:bg-surface-variant/50 rounded-lg text-label-lg active:scale-95 transition-transform duration-150"
          >
            <span className="material-symbols-outlined mr-3">assessment</span>
            Relatórios
          </Link>
          <Link
            to="/configuracoes"
            className="flex items-center px-4 py-3 bg-primary-container text-on-primary-container rounded-lg font-semibold text-label-lg active:scale-95 transition-transform duration-150"
          >
            <span
              className="material-symbols-outlined mr-3"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              settings
            </span>
            Configurações
          </Link>
        </nav>

        <div className="mt-auto space-y-1 pt-4 border-t border-outline-variant/20 shrink-0">
          <a
            href="#"
            className="flex items-center px-4 py-3 text-on-surface-variant hover:bg-surface-variant/50 rounded-lg text-label-lg active:scale-95 transition-transform duration-150"
          >
            <span className="material-symbols-outlined mr-3">help</span>
            Suporte
          </a>
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
        {/* TopAppBar */}
        <header className="fixed top-0 right-0 h-16 z-40 bg-background/80 backdrop-blur-md border-b border-outline-variant/20 md:left-72">
          <div className="flex justify-between items-center px-8 h-full w-full">
            <div className="flex-1 flex items-center">
              <div className="relative w-64">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-sm">
                  search
                </span>
                <input
                  className="w-full bg-surface-container rounded-full py-1.5 pl-9 pr-4 text-sm border-none focus:ring-1 focus:ring-primary text-on-surface placeholder:text-secondary focus:outline-none"
                  placeholder="Buscar no sistema..."
                  type="text"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="text-secondary hover:text-primary cursor-pointer p-2 rounded-full hover:bg-surface-container-low relative">
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full"></span>
              </button>
              <button className="text-secondary hover:text-primary cursor-pointer p-2 rounded-full hover:bg-surface-container-low">
                <span className="material-symbols-outlined">settings</span>
              </button>
              <div className="flex items-center gap-3 ml-2 cursor-pointer">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-bold text-on-surface">Admin Terra</p>
                  <p className="text-xs text-on-surface-variant">Administrador</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-surface-variant overflow-hidden border border-outline-variant/30">
                  <img
                    alt="User Profile"
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDhoef4fqgB-0WyVLHEoFmwZu7_TqLzLLFx6UBN8vLbPEdFb89RWGSL2_bpY31uGIOcH21vvJr_CM4D0drMxSrieFBwTzOS3tuSlnPwE4x_U5dcRZT1IiyEQvmT1JFvBJf4FbZGu4cn3fAMf4P6VbwUmJGrvu1Np5kpfcj9wdP3d3Tp5H1aNzEiWMFDEl423BYEHW2GOf8MNqWX9VKCQJ_BX1Q6YBss_KXNet7ln5J5cS3fUBLmWfe5hA8ocNzHA3R7Wg3rhQIqSr0"
                  />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Canvas Rolável */}
        <main className="flex-1 mt-16 p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* Page Header */}
          <div className="mb-8 flex items-center gap-4">
            <span className="material-symbols-outlined text-primary text-3xl">
              settings
            </span>
            <div>
              <h2 className="text-3xl font-headline font-semibold text-on-background mb-1">
                Configurações
              </h2>
              <p className="text-secondary text-lg">
                Gerencie suas preferências de conta, segurança e informações de acesso.
              </p>
            </div>
          </div>

          {/* Navegação por Abas */}
          <div className="border-b border-outline-variant/30 mb-8 flex gap-8">
            <button
              onClick={() => {
                setAbaAtiva('geral')
                setMenuAbertoId(null)
              }}
              className={`pb-4 font-label text-base transition-colors relative cursor-pointer ${
                abaAtiva === 'geral'
                  ? 'text-primary font-bold'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              Geral
              {abaAtiva === 'geral' && (
                <span className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-primary rounded-t-full"></span>
              )}
            </button>

            <button
              onClick={() => {
                setAbaAtiva('usuarios')
                setMenuAbertoId(null)
              }}
              className={`pb-4 font-label text-base transition-colors relative cursor-pointer ${
                abaAtiva === 'usuarios'
                  ? 'text-primary font-bold'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              Gerenciar Usuários (Corretores)
              {abaAtiva === 'usuarios' && (
                <span className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-primary rounded-t-full"></span>
              )}
            </button>
          </div>

          {/* CONTEÚDO DA ABA 1: GERAL */}
          {abaAtiva === 'geral' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-16">
              <div className="lg:col-span-8 flex flex-col gap-8">
                {/* Seção: Meus Dados */}
                <section className="bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-outline-variant/20 flex flex-col gap-6 relative overflow-hidden">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-tertiary">
                        badge
                      </span>
                      <h3 className="font-headline text-xl font-bold text-on-surface">
                        Meus Dados
                      </h3>
                    </div>
                    <p className="text-sm text-secondary">
                      Informações básicas da sua conta de corretor.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-secondary uppercase tracking-wider">
                        Nome Completo
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[20px]">
                          person
                        </span>
                        <input
                          className="w-full bg-surface-container rounded-full py-2.5 pl-10 pr-4 text-sm border-none text-on-surface cursor-not-allowed opacity-80"
                          readOnly
                          type="text"
                          value="Eduardo Silva"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-secondary uppercase tracking-wider">
                        E-mail de Acesso
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[20px]">
                          mail
                        </span>
                        <input
                          className="w-full bg-surface-container rounded-full py-2.5 pl-10 pr-4 text-sm border-none text-on-surface cursor-not-allowed opacity-80"
                          readOnly
                          type="text"
                          value="eduardo.silva@terranova.com.br"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-secondary uppercase tracking-wider">
                        Celular / WhatsApp
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[20px]">
                          call
                        </span>
                        <input
                          className="w-full bg-surface-container rounded-full py-2.5 pl-10 pr-4 text-sm border-none text-on-surface cursor-not-allowed opacity-80"
                          readOnly
                          type="text"
                          value="5566999887766"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Seção: Alterar Senha */}
                <section className="bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-outline-variant/20 flex flex-col gap-6 relative overflow-hidden">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">
                        lock
                      </span>
                      <h3 className="font-headline text-xl font-bold text-on-surface">
                        Alterar Senha
                      </h3>
                    </div>
                    <p className="text-sm text-secondary">
                      Mantenha sua conta segura atualizando sua senha periodicamente.
                    </p>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      alert('Senha atualizada com sucesso!')
                    }}
                    className="flex flex-col gap-5 max-w-md mt-2"
                  >
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-secondary uppercase tracking-wider">
                        Senha Atual
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant text-[20px]">
                          key
                        </span>
                        <input
                          className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-full py-2.5 pl-12 pr-4 text-sm font-semibold text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                          type="password"
                          placeholder="********"
                          value={senhaAtual}
                          onChange={(e) => setSenhaAtual(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-secondary uppercase tracking-wider">
                        Nova Senha
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant text-[20px]">
                          password
                        </span>
                        <input
                          className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-full py-2.5 pl-12 pr-4 text-sm font-semibold text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-outline-variant"
                          placeholder="Mínimo 8 caracteres"
                          type="password"
                          value={novaSenhaPerfil}
                          onChange={(e) => setNovaSenhaPerfil(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-secondary uppercase tracking-wider">
                        Confirmar Nova Senha
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant text-[20px]">
                          password
                        </span>
                        <input
                          className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-full py-2.5 pl-12 pr-4 text-sm font-semibold text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-outline-variant"
                          placeholder="Repita a nova senha"
                          type="password"
                          value={confirmarNovaSenha}
                          onChange={(e) => setConfirmarNovaSenha(e.target.value)}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="mt-4 bg-primary text-on-primary hover:bg-primary/90 font-bold py-2.5 px-6 rounded-full flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 w-fit cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        update
                      </span>
                      Atualizar Senha
                    </button>
                  </form>
                </section>
              </div>

              {/* Sidebar Lateral de Dicas */}
              <div className="hidden lg:flex flex-col col-span-4 gap-6 sticky top-4">
                <div className="bg-tertiary-container text-on-tertiary-container rounded-xl p-6 shadow-sm border border-tertiary/20 flex flex-col gap-4 relative overflow-hidden">
                  <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-[120px] opacity-10">
                    verified_user
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-2xl">
                      shield_locked
                    </span>
                    <h3 className="font-headline font-bold text-lg">
                      Dicas de Segurança
                    </h3>
                  </div>
                  <ul className="flex flex-col gap-3 text-sm font-medium">
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-[18px] text-tertiary mt-0.5">
                        check_circle
                      </span>
                      Use senhas longas com mistura de letras, números e símbolos.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-[18px] text-tertiary mt-0.5">
                        check_circle
                      </span>
                      Nunca compartilhe sua senha de acesso com terceiros.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-[18px] text-tertiary mt-0.5">
                        check_circle
                      </span>
                      Altere sua senha a cada 90 dias.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* CONTEÚDO DA ABA 2: GERENCIAR USUÁRIOS */}
          {abaAtiva === 'usuarios' && (
            <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-outline-variant/20 pb-16">
              {/* Barra de Ferramentas */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                {/* Campo de Busca */}
                <div className="relative w-full sm:w-80">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-sm">
                    search
                  </span>
                  <input
                    className="w-full bg-surface-container rounded-full py-2 pl-9 pr-4 text-sm border-none focus:ring-1 focus:ring-primary text-on-surface placeholder:text-secondary outline-none"
                    placeholder="Buscar corretor por nome ou email..."
                    type="text"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                  />
                </div>

                {/* Botão Convidar */}
                <button
                  onClick={() => setModalAberto(true)}
                  className="bg-primary hover:bg-primary/90 text-on-primary font-label font-medium py-2.5 px-6 rounded-full flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap cursor-pointer shadow-sm"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  Convidar Novo Corretor
                </button>
              </div>

              {/* Tabela de Usuários */}
              <div className="overflow-x-auto">
                {carregandoUsuarios ? (
                  <div className="p-12 text-center text-secondary">
                    Carregando usuários do banco de dados...
                  </div>
                ) : usuariosFiltrados.length === 0 ? (
                  <div className="p-12 text-center text-secondary">
                    Nenhum corretor ou usuário encontrado.
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low text-secondary text-sm">
                        <th className="py-3 px-6 font-medium border-b border-outline-variant/20">
                          Nome
                        </th>
                        <th className="py-3 px-6 font-medium border-b border-outline-variant/20">
                          E-mail
                        </th>
                        <th className="py-3 px-6 font-medium border-b border-outline-variant/20">
                          WhatsApp
                        </th>
                        <th className="py-3 px-6 font-medium border-b border-outline-variant/20">
                          Status
                        </th>
                        <th className="py-3 px-6 font-medium border-b border-outline-variant/20">
                          Nível de Acesso
                        </th>
                        <th className="py-3 px-6 font-medium border-b border-outline-variant/20 text-right">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {usuariosFiltrados.map((u) => (
                        <tr
                          key={u.id}
                          className="border-b border-outline-variant/10 hover:bg-surface-container-lowest/50 transition-colors"
                        >
                          <td className="py-4 px-6 text-on-surface">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-bold text-xs uppercase">
                                {getIniciais(u.nome)}
                              </div>
                              <span className="font-bold text-on-surface">{u.nome}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-secondary">{u.email}</td>
                          <td className="py-4 px-6 text-secondary font-mono">
                            {u.telefone || 'Não informado'}
                          </td>
                          <td className="py-4 px-6">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-container/30 text-primary text-xs font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>{' '}
                              Ativo
                            </span>
                          </td>
                          <td className="py-4 px-6 text-on-surface capitalize font-medium">
                            {u.cargo || 'Corretor'}
                          </td>
                          <td className="py-4 px-6 text-right relative">
                            {/* Botão de Engrenagem de Ações */}
                            <button
                              title="Opções de Ação"
                              onClick={() =>
                                setMenuAbertoId(menuAbertoId === u.id ? null : u.id)
                              }
                              className="text-secondary hover:text-primary transition-colors cursor-pointer p-1.5 rounded-full hover:bg-surface-container"
                            >
                              <span className="material-symbols-outlined text-lg">
                                settings
                              </span>
                            </button>

                            {/* Menu de Ações suspenso */}
                            {menuAbertoId === u.id && (
                              <div className="absolute right-6 top-12 z-30 bg-surface-bright border border-outline-variant/30 rounded-xl shadow-lg p-1.5 w-44 text-left font-body">
                                <button
                                  onClick={() => {
                                    setMenuAbertoId(null)
                                    handleDeletarUsuario(u.id, u.nome)
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-error hover:bg-error-container/30 rounded-lg transition-colors cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-sm">
                                    delete
                                  </span>
                                  Excluir Corretor
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Contagem */}
              <div className="mt-6 flex items-center justify-between text-sm text-secondary pt-4 border-t border-outline-variant/10">
                <span>
                  Mostrando {usuariosFiltrados.length} de {usuarios.length} corretores
                </span>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal de Convidar Novo Corretor */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-bright p-6 rounded-2xl shadow-xl max-w-md w-full space-y-6 border border-outline-variant/30">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <h3 className="text-xl font-headline font-bold text-on-surface">
                Cadastrar Novo Corretor
              </h3>
              <button
                onClick={() => setModalAberto(false)}
                className="text-secondary hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCadastrarUsuario} className="space-y-4 font-body">
              <div>
                <label className="block text-xs font-bold uppercase text-secondary mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  placeholder="Ex: Ricardo Oliveira"
                  className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-secondary mb-1">
                  E-mail de Acesso
                </label>
                <input
                  type="email"
                  required
                  value={novoEmail}
                  onChange={(e) => setNovoEmail(e.target.value)}
                  placeholder="ricardo@terranova.com.br"
                  className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-secondary mb-1">
                  WhatsApp / Telefone (Com DDD)
                </label>
                <input
                  type="text"
                  required
                  value={novoTelefone}
                  onChange={(e) => setNovoTelefone(e.target.value)}
                  placeholder="Ex: 66 99988-7766 ou 5566999887766"
                  className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                />
                <p className="text-[10px] text-secondary mt-1">
                  * O código DDI 55 será incluído automaticamente caso seja omitido.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-secondary mb-1">
                  Senha Inicial
                </label>
                <input
                  type="password"
                  required
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Senha temporária de acesso"
                  className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-secondary mb-1">
                  Nível de Acesso (Cargo)
                </label>
                <select
                  value={novoCargo}
                  onChange={(e) => setNovoCargo(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none cursor-pointer"
                >
                  <option value="corretor">Corretor</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-5 py-2.5 rounded-xl border border-outline-variant text-secondary font-bold hover:bg-surface-container-low cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoUsuario}
                  className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-bold hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
                >
                  {salvandoUsuario ? 'Salvando...' : 'Cadastrar Corretor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}