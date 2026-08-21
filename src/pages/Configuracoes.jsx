import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { apiFetch } from '../services/api'

export default function Configuracoes() {
  const navigate = useNavigate()

  // Controle de Abas
  const [abaAtiva, setAbaAtiva] = useState('geral') // 'geral' ou 'usuarios'

  // Controle do Modal de Suporte
  const [modalSuporteAberto, setModalSuporteAberto] = useState(false)

  // Estados dos Meus Dados (Perfil Logado)
  const [perfil, setPerfil] = useState({
    id: null,
    nome: '',
    email: '',
    telefone: '',
    cargo: '',
  })
  const [carregandoPerfil, setCarregandoPerfil] = useState(true)

  // Estados do Formulário de Alteração de Senha
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenhaPerfil, setNovaSenhaPerfil] = useState('')
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('')
  const [alterandoSenha, setAlterandoSenha] = useState(false)

  // Estados do Gerenciamento de Usuários
  const [usuarios, setUsuarios] = useState([])
  const [busca, setBusca] = useState('')
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(false)
  const [modalAberto, setModalAberto] = useState(false)
  const [menuAbertoId, setMenuAbertoId] = useState(null)

  // Campos do Modal de Novo Usuário
  const [novoNome, setNovoNome] = useState('')
  const [novoEmail, setNovoEmail] = useState('')
  const [novoTelefone, setNovoTelefone] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [novoCargo, setNovoCargo] = useState('corretor')
  const [salvandoUsuario, setSalvandoUsuario] = useState(false)

  // 1. Carrega o perfil do usuário logado
  const carregarPerfil = async () => {
    setCarregandoPerfil(true)
    try {
      const resposta = await apiFetch('/usuarios/me')
      if (resposta.ok) {
        const dados = await resposta.json()
        setPerfil(dados)
        return
      }

      const token = localStorage.getItem('token')
      let emailLogado = ''

      if (token) {
        try {
          const payloadBase64 = token.split('.')[1]
          const payloadJson = JSON.parse(atob(payloadBase64))
          emailLogado = payloadJson.sub || ''
        } catch (e) {
          console.error('Erro ao ler token JWT:', e)
        }
      }

      const resLista = await apiFetch('/usuarios/')
      if (resLista.ok) {
        const lista = await resLista.json()
        const usuarioLogado = lista.find(
          (u) => u.email.toLowerCase() === emailLogado.toLowerCase()
        )

        if (usuarioLogado) {
          setPerfil(usuarioLogado)
        } else if (lista.length > 0) {
          setPerfil(lista[0])
        }
      }
    } catch (err) {
      console.error('Erro ao buscar dados do perfil logado:', err)
    } finally {
      setCarregandoPerfil(false)
    }
  }

  useEffect(() => {
    carregarPerfil()
  }, [])

  // 2. Alteração de Senha
  const handleAlterarSenha = async (e) => {
    e.preventDefault()

    if (novaSenhaPerfil.length < 8) {
      alert('A nova senha deve ter no mínimo 8 caracteres.')
      return
    }

    if (novaSenhaPerfil !== confirmarNovaSenha) {
      alert('A nova senha e a confirmação não coincidem.')
      return
    }

    setAlterandoSenha(true)

    try {
      let resposta

      if (perfil && perfil.id) {
        resposta = await apiFetch(`/usuarios/${perfil.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            nome: perfil.nome,
            email: perfil.email,
            telefone: perfil.telefone,
            cargo: perfil.cargo,
            senha_hash: novaSenhaPerfil,
          }),
        })
      }

      if (!resposta || !resposta.ok) {
        resposta = await apiFetch('/alterar-senha', {
          method: 'POST',
          body: JSON.stringify({
            senha_atual: senhaAtual,
            nova_senha: novaSenhaPerfil,
          }),
        })
      }

      if (!resposta.ok) {
        const erroDados = await resposta.json().catch(() => ({}))
        throw new Error(
          erroDados.detail ||
            'Não foi possível atualizar a senha no servidor. Verifique os dados.'
        )
      }

      alert('Senha atualizada com sucesso!')
      setSenhaAtual('')
      setNovaSenhaPerfil('')
      setConfirmarNovaSenha('')
    } catch (err) {
      alert(err.message)
    } finally {
      setAlterandoSenha(false)
    }
  }

  const sanitizarTelefoneWhatsApp = (num) => {
    let limpo = (num || '').replace(/\D/g, '')
    if (!limpo) throw new Error('O número de WhatsApp é obrigatório.')
    if (limpo.length === 10 || limpo.length === 11) limpo = '55' + limpo
    if ((limpo.length !== 12 && limpo.length !== 13) || !limpo.startsWith('55')) {
      throw new Error(
        'Por favor, digite um número de WhatsApp válido com DDD (ex: 66 99988-7766 ou 5566999887766).'
      )
    }
    return limpo
  }

  // Carrega lista de usuários (Apenas se for Admin ou Gerente)
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
    if (abaAtiva === 'usuarios' && (perfil.cargo === 'admin' || perfil.cargo === 'gerente')) {
      carregarUsuarios()
    }
  }, [abaAtiva, perfil.cargo])

  // Cadastrar novo usuário (Corretor, Gerente ou Admin)
  const handleCadastrarUsuario = async (e) => {
    e.preventDefault()

    try {
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

      alert(`Novo ${novoCargo} cadastrado com sucesso!`)
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

  const handleDeletarUsuario = async (id, nome) => {
    if (!window.confirm(`Tem certeza que deseja remover o usuário "${nome}"?`))
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

      alert('Usuário removido com sucesso!')
      carregarUsuarios()
    } catch (err) {
      alert(err.message)
    }
  }

  const getIniciais = (nome) => {
    if (!nome) return 'US'
    const partes = nome.trim().split(' ')
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase()
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
  }

  const usuariosFiltrados = usuarios.filter((u) => {
    const termo = busca.toLowerCase()
    const nomeUser = (u.nome || '').toLowerCase()
    const emailUser = (u.email || '').toLowerCase()
    const cargoUser = (u.cargo || '').toLowerCase()
    return nomeUser.includes(termo) || emailUser.includes(termo) || cargoUser.includes(termo)
  })

  // Badges de Cargo
  const renderBadgeCargo = (cargo) => {
    switch (cargo?.toLowerCase()) {
      case 'admin':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-primary/15 text-primary text-xs font-bold uppercase">
            Administrador
          </span>
        )
      case 'gerente':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-tertiary-container text-on-tertiary-container text-xs font-bold uppercase">
            Gerente
          </span>
        )
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-xs font-medium uppercase">
            Corretor
          </span>
        )
    }
  }

  const getNavLinkClass = ({ isActive }) =>
    `flex items-center px-4 py-3 rounded-lg font-body text-label-lg active:scale-95 transition-all duration-150 ${
      isActive
        ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
        : 'text-on-surface-variant hover:bg-surface-variant/50'
    }`

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
          <NavLink to="/dashboard" className={getNavLinkClass}>
            <span className="material-symbols-outlined mr-3">dashboard</span>
            Dashboard
          </NavLink>

          <NavLink to="/fechamento" className={getNavLinkClass}>
            <span className="material-symbols-outlined mr-3">handshake</span>
            Novo Fechamento
          </NavLink>

          <NavLink to="/cadastros" className={getNavLinkClass}>
            <span className="material-symbols-outlined mr-3">person_book</span>
            Cadastros
          </NavLink>

          <NavLink to="/ofertas" className={getNavLinkClass}>
            <span className="material-symbols-outlined mr-3">campaign</span>
            Ofertas
          </NavLink>

          <NavLink to="/relatorios" className={getNavLinkClass}>
            <span className="material-symbols-outlined mr-3">assessment</span>
            Relatórios
          </NavLink>

          <NavLink to="/configuracoes" className={getNavLinkClass}>
            <span className="material-symbols-outlined mr-3">settings</span>
            Configurações
          </NavLink>
        </nav>

        <div className="mt-auto space-y-1 pt-4 border-t border-outline-variant/20 shrink-0">
          <button
            type="button"
            onClick={() => setModalSuporteAberto(true)}
            className="w-full flex items-center px-4 py-3 text-on-surface-variant hover:bg-surface-variant/50 rounded-lg text-label-lg active:scale-95 transition-transform duration-150 text-left cursor-pointer"
          >
            <span className="material-symbols-outlined mr-3">help</span>
            Suporte
          </button>
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
                  <p className="text-sm font-bold text-on-surface">
                    {carregandoPerfil ? 'Carregando...' : perfil.nome || 'Usuário'}
                  </p>
                  <p className="text-xs text-on-surface-variant capitalize">
                    {perfil.cargo || 'Corretor'}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-[#dbd8ce] flex items-center justify-center font-bold text-xs text-[#4a5043] shrink-0 border border-outline-variant/30">
                  {getIniciais(perfil.nome)}
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
                Gerencie suas preferências de conta, segurança e equipe.
              </p>
            </div>
          </div>

          {/* Navegação por Abas (Exibe aba de usuários para Admin e Gerente) */}
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

            {(perfil.cargo === 'admin' || perfil.cargo === 'gerente') && (
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
                Gerenciar Usuários / Equipe
                {abaAtiva === 'usuarios' && (
                  <span className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-primary rounded-t-full"></span>
                )}
              </button>
            )}
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
                      Informações básicas da sua conta.
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
                          className="w-full bg-surface-container rounded-full py-2.5 pl-10 pr-4 text-sm border-none text-on-surface cursor-not-allowed opacity-80 font-medium"
                          readOnly
                          type="text"
                          value={
                            carregandoPerfil
                              ? 'Buscando...'
                              : perfil.nome || 'Não informado'
                          }
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
                          className="w-full bg-surface-container rounded-full py-2.5 pl-10 pr-4 text-sm border-none text-on-surface cursor-not-allowed opacity-80 font-medium"
                          readOnly
                          type="text"
                          value={
                            carregandoPerfil
                              ? 'Buscando...'
                              : perfil.email || 'Não informado'
                          }
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
                          className="w-full bg-surface-container rounded-full py-2.5 pl-10 pr-4 text-sm border-none text-on-surface cursor-not-allowed opacity-80 font-mono"
                          readOnly
                          type="text"
                          value={
                            carregandoPerfil
                              ? 'Buscando...'
                              : perfil.telefone || 'Não informado'
                          }
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-secondary uppercase tracking-wider">
                        Nível de Acesso
                      </label>
                      <div className="pt-1.5">
                        {renderBadgeCargo(perfil.cargo)}
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
                    onSubmit={handleAlterarSenha}
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
                          required
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
                          required
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
                          required
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
                      disabled={alterandoSenha}
                      className="mt-4 bg-primary text-on-primary hover:bg-primary/90 disabled:opacity-50 font-bold py-2.5 px-6 rounded-full flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 w-fit cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        update
                      </span>
                      {alterandoSenha ? 'Atualizando...' : 'Atualizar Senha'}
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
                      Altere sua senha periodicamente.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* CONTEÚDO DA ABA 2: GERENCIAR USUÁRIOS (Admin / Gerente) */}
          {abaAtiva === 'usuarios' && (perfil.cargo === 'admin' || perfil.cargo === 'gerente') && (
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
                    placeholder="Buscar por nome, e-mail ou cargo..."
                    type="text"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                  />
                </div>

                {/* Botão Convidar (Apenas Admin pode criar) */}
                {perfil.cargo === 'admin' && (
                  <button
                    onClick={() => setModalAberto(true)}
                    className="bg-primary hover:bg-primary/90 text-on-primary font-label font-medium py-2.5 px-6 rounded-full flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap cursor-pointer shadow-sm"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    Convidar Novo Usuário
                  </button>
                )}
              </div>

              {/* Tabela de Usuários */}
              <div className="overflow-x-auto">
                {carregandoUsuarios ? (
                  <div className="p-12 text-center text-secondary">
                    Carregando usuários do banco de dados...
                  </div>
                ) : usuariosFiltrados.length === 0 ? (
                  <div className="p-12 text-center text-secondary">
                    Nenhum usuário encontrado.
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
                          Nível de Acesso
                        </th>
                        {perfil.cargo === 'admin' && (
                          <th className="py-3 px-6 font-medium border-b border-outline-variant/20 text-right">
                            Ações
                          </th>
                        )}
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
                            {renderBadgeCargo(u.cargo)}
                          </td>
                          {perfil.cargo === 'admin' && (
                            <td className="py-4 px-6 text-right relative">
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
                                    Excluir Usuário
                                  </button>
                                </div>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Contagem */}
              <div className="mt-6 flex items-center justify-between text-sm text-secondary pt-4 border-t border-outline-variant/10">
                <span>
                  Mostrando {usuariosFiltrados.length} de {usuarios.length} usuários
                </span>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal de Suporte */}
      {modalSuporteAberto && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-bright p-6 rounded-2xl shadow-2xl max-w-md w-full border border-outline-variant/30 animate-fade-in flex flex-col gap-5 font-body">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-xl">
                    support_agent
                  </span>
                </div>
                <h3 className="text-xl font-headline font-bold text-on-surface">
                  Suporte Técnico
                </h3>
              </div>
              <button
                onClick={() => setModalSuporteAberto(false)}
                className="text-secondary hover:text-on-surface cursor-pointer p-1 rounded-lg hover:bg-surface-container"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="text-sm text-secondary">
              Precisa de assistência ou quer deixar um feedback? Entre em contato diretamente através dos canais abaixo:
            </p>

            <div className="flex flex-col gap-3">
              {/* WhatsApp */}
              <a
                href="https://wa.me/5566999590301"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 rounded-xl bg-surface-container hover:bg-surface-container-high transition-all border border-outline-variant/20 group hover:border-primary/40"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined">chat</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold uppercase text-secondary">
                    WhatsApp
                  </p>
                  <p className="text-sm font-semibold text-on-surface font-mono">
                    (66) 99959-0301
                  </p>
                </div>
                <span className="material-symbols-outlined text-secondary group-hover:text-primary transition-colors text-sm">
                  open_in_new
                </span>
              </a>

              {/* E-mail */}
              <a
                href="mailto:lolravanello@gmail.com"
                className="flex items-center gap-4 p-4 rounded-xl bg-surface-container hover:bg-surface-container-high transition-all border border-outline-variant/20 group hover:border-primary/40"
              >
                <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined">mail</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold uppercase text-secondary">
                    E-mail
                  </p>
                  <p className="text-sm font-semibold text-on-surface truncate">
                    lolravanello@gmail.com
                  </p>
                </div>
                <span className="material-symbols-outlined text-secondary group-hover:text-primary transition-colors text-sm">
                  open_in_new
                </span>
              </a>
            </div>

            <div className="flex justify-end pt-3 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={() => setModalSuporteAberto(false)}
                className="px-5 py-2 rounded-xl bg-surface-container-high text-on-surface font-bold hover:bg-surface-variant cursor-pointer transition-colors text-sm"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Convidar Novo Usuário */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-bright p-6 rounded-2xl shadow-xl max-w-md w-full space-y-6 border border-outline-variant/30">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <h3 className="text-xl font-headline font-bold text-on-surface">
                Cadastrar Novo Usuário
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

              {/* Nível de Acesso (com cargo Gerente adicionado) */}
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
                  <option value="gerente">Gerente</option>
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
                  {salvandoUsuario ? 'Salvando...' : 'Cadastrar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}