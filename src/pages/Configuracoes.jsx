import { useState, useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { apiFetch } from '../services/api'

export default function Configuracoes() {
  const navigate = useNavigate()
  const location = useLocation()

  // Controle de Abas: 'geral' | 'usuarios' | 'lixeira'
  const [abaAtiva, setAbaAtiva] = useState('geral')
  const [modalSuporteAberto, setModalSuporteAberto] = useState(false)

  // Perfil Logado
  const [perfil, setPerfil] = useState({
    id: null,
    nome: '',
    email: '',
    telefone: '',
    cargo: '',
  })
  const [carregandoPerfil, setCarregandoPerfil] = useState(true)

  // Alteração de Senha
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenhaPerfil, setNovaSenhaPerfil] = useState('')
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('')
  const [alterandoSenha, setAlterandoSenha] = useState(false)

  // Gerenciamento de Usuários
  const [usuarios, setUsuarios] = useState([])
  const [busca, setBusca] = useState('')
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(false)
  const [modalAberto, setModalAberto] = useState(false)
  const [menuAbertoId, setMenuAbertoId] = useState(null)

  // Modal Novo Usuário
  const [novoNome, setNovoNome] = useState('')
  const [novoEmail, setNovoEmail] = useState('')
  const [novoTelefone, setNovoTelefone] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [novoCargo, setNovoCargo] = useState('corretor')
  const [salvandoUsuario, setSalvandoUsuario] = useState(false)

  // -------------------------------------------------------------
  // ESTADOS DA ABA: LIXEIRA & RESTAURAÇÃO (SOFT DELETE)
  // -------------------------------------------------------------
  const [categoriaLixeira, setCategoriaLixeira] = useState('fazendas') // 'fazendas' | 'produtores' | 'empresas' | 'ofertas'
  const [itensInativos, setItensInativos] = useState([])
  const [carregandoLixeira, setCarregandoLixeira] = useState(false)
  const [restaurandoId, setRestaurandoId] = useState(null)

  const getIniciais = (nome) => {
    if (!nome) return 'US'
    const partes = nome.trim().split(' ')
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase()
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
  }

  // 1. Carrega Perfil do Usuário Logado
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
          const payloadJson = JSON.parse(atob(token.split('.')[1]))
          emailLogado = payloadJson.sub || ''
        } catch (e) {}
      }

      const resLista = await apiFetch('/usuarios/')
      if (resLista.ok) {
        const lista = await resLista.json()
        const usuarioLogado = lista.find(
          (u) => u.email.toLowerCase() === emailLogado.toLowerCase()
        )
        if (usuarioLogado) setPerfil(usuarioLogado)
        else if (lista.length > 0) setPerfil(lista[0])
      }
    } catch (err) {
      console.error('Erro ao buscar perfil logado:', err)
    } finally {
      setCarregandoPerfil(false)
    }
  }

  useEffect(() => {
    carregarPerfil()
  }, [])

  // 2. Carrega Usuários (Admin / Gerente)
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

  // 3. Carrega Itens Inativos / Lixeira (Admin Apenas)
  const carregarItensLixeira = async () => {
    if (perfil.cargo !== 'admin') return
    setCarregandoLixeira(true)
    try {
      // Tenta buscar da rota de inativos ou simula filtragem com fallback
      const rota = `/${categoriaLixeira}/?inativos=true`
      const resposta = await apiFetch(rota).catch(() => null)
      if (resposta && resposta.ok) {
        const dados = await resposta.json()
        setItensInativos(Array.isArray(dados) ? dados.filter((item) => item.ativo === false) : [])
      } else {
        setItensInativos([])
      }
    } catch (err) {
      console.error('Erro ao carregar lixeira:', err)
      setItensInativos([])
    } finally {
      setCarregandoLixeira(false)
    }
  }

  useEffect(() => {
    if (abaAtiva === 'lixeira' && perfil.cargo === 'admin') {
      carregarItensLixeira()
    }
  }, [abaAtiva, categoriaLixeira, perfil.cargo])

  // 4. Restaurar Registro Inativo
  const handleRestaurar = async (id, nomeItem) => {
    if (perfil.cargo !== 'admin') {
      alert('Acesso negado: Apenas administradores podem restaurar registros.')
      return
    }

    if (!window.confirm(`Deseja reativar o registro "${nomeItem}" no sistema?`)) return

    setRestaurandoId(id)
    try {
      const resposta = await apiFetch(`/${categoriaLixeira}/${id}/restaurar`, {
        method: 'PUT',
      }).catch(async () => {
        // Fallback caso a rota seja um PUT normal de atualização
        return await apiFetch(`/${categoriaLixeira}/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ ativo: true }),
        })
      })

      if (!resposta.ok) {
        throw new Error('Falha ao restaurar o registro. Verifique com o administrador do backend.')
      }

      alert(`"${nomeItem}" restaurado com sucesso! O registro voltou a ficar ativo no sistema.`)
      carregarItensLixeira()
    } catch (err) {
      alert(err.message)
    } finally {
      setRestaurandoId(null)
    }
  }

  // Alteração de Senha
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
        throw new Error(erroDados.detail || 'Não foi possível atualizar a senha.')
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
    return limpo
  }

  // Cadastrar Novo Usuário
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

      if (!resposta.ok) {
        const erroDados = await resposta.json().catch(() => ({}))
        throw new Error(erroDados.detail || 'Erro ao cadastrar usuário.')
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
    if (!window.confirm(`Tem certeza que deseja remover o usuário "${nome}"?`)) return

    try {
      const resposta = await apiFetch(`/usuarios/${id}`, { method: 'DELETE' })
      if (!resposta.ok) {
        const errData = await resposta.json().catch(() => ({}))
        throw new Error(errData.detail || 'Falha ao remover o usuário.')
      }
      alert('Usuário removido com sucesso!')
      carregarUsuarios()
    } catch (err) {
      alert(err.message)
    }
  }

  const usuariosFiltrados = usuarios.filter((u) => {
    const termo = busca.toLowerCase()
    return (
      (u.nome || '').toLowerCase().includes(termo) ||
      (u.email || '').toLowerCase().includes(termo) ||
      (u.cargo || '').toLowerCase().includes(termo)
    )
  })

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

  const getNavLinkClass = (path) => {
    let isActive = false
    if (path === '/cadastros') {
      const subRotas = ['/cadastros', '/fazendas', '/produtores', '/empresas', '/cadastrar-fazenda', '/cadastrar-empresa', '/detalhes-fazenda', '/detalhes-empresa']
      isActive = subRotas.some((r) => location.pathname.startsWith(r))
    } else if (path === '/relatorios') {
      isActive = ['/relatorios', '/detalhes-contrato'].some((r) => location.pathname.startsWith(r))
    } else {
      isActive = location.pathname === path
    }

    return `flex items-center px-4 py-3 rounded-lg font-body text-label-lg active:scale-95 transition-all duration-150 ${
      isActive
        ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
        : 'text-on-surface-variant hover:bg-surface-variant/50'
    }`
  }

  return (
    <div className="bg-background text-on-background antialiased h-screen overflow-hidden flex animate-fade-in font-body">
      {/* SideNavBar Fixa */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen flex-col p-4 border-r border-outline-variant/20 bg-surface-container dark:bg-surface-container-lowest w-72 z-20">
        <div className="mb-6 px-2 pt-4 shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-on-primary text-xl">eco</span>
            </div>
            <h2 className="font-headline text-xl font-bold text-on-surface">Terra Nova</h2>
          </div>
          <p className="font-body text-label-md text-on-surface-variant ml-10">AgroCapital</p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
          <NavLink to="/dashboard" className={() => getNavLinkClass('/dashboard')}>
            <span className="material-symbols-outlined mr-3">dashboard</span>
            Dashboard
          </NavLink>

          <NavLink to="/fechamento" className={() => getNavLinkClass('/fechamento')}>
            <span className="material-symbols-outlined mr-3">handshake</span>
            Novo Fechamento
          </NavLink>

          <NavLink to="/cadastros" className={() => getNavLinkClass('/cadastros')}>
            <span className="material-symbols-outlined mr-3">person_book</span>
            Cadastros
          </NavLink>

          <NavLink to="/ofertas" className={() => getNavLinkClass('/ofertas')}>
            <span className="material-symbols-outlined mr-3">campaign</span>
            Ofertas
          </NavLink>

          <NavLink to="/relatorios" className={() => getNavLinkClass('/relatorios')}>
            <span className="material-symbols-outlined mr-3">assessment</span>
            Relatórios
          </NavLink>

          <NavLink to="/configuracoes" className={() => getNavLinkClass('/configuracoes')}>
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

        {/* Content Canvas */}
        <main className="flex-1 mt-16 p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* Page Header */}
          <div className="mb-8 flex items-center gap-4">
            <span className="material-symbols-outlined text-primary text-3xl">settings</span>
            <div>
              <h2 className="text-3xl font-headline font-semibold text-on-background mb-1">
                Configurações
              </h2>
              <p className="text-secondary text-lg">
                Gerencie suas preferências de conta, segurança, equipe e restauração de dados.
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
                abaAtiva === 'geral' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary'
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
                  abaAtiva === 'usuarios' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                Gerenciar Usuários / Equipe
                {abaAtiva === 'usuarios' && (
                  <span className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-primary rounded-t-full"></span>
                )}
              </button>
            )}

            {/* ABA 3: LIXEIRA (EXCLUSIVA ADMIN) */}
            {perfil.cargo === 'admin' && (
              <button
                onClick={() => {
                  setAbaAtiva('lixeira')
                  setMenuAbertoId(null)
                }}
                className={`pb-4 font-label text-base transition-colors relative cursor-pointer flex items-center gap-1.5 ${
                  abaAtiva === 'lixeira' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                <span className="material-symbols-outlined text-lg">recycling</span>
                Lixeira & Restauração
                {abaAtiva === 'lixeira' && (
                  <span className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-primary rounded-t-full"></span>
                )}
              </button>
            )}
          </div>

          {/* ABA 1: GERAL */}
          {abaAtiva === 'geral' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-16">
              <div className="lg:col-span-8 flex flex-col gap-8">
                {/* Seção: Meus Dados */}
                <section className="bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-outline-variant/20 flex flex-col gap-6">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-tertiary">badge</span>
                      <h3 className="font-headline text-xl font-bold text-on-surface">Meus Dados</h3>
                    </div>
                    <p className="text-sm text-secondary">Informações básicas da sua conta.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-secondary uppercase tracking-wider">
                        Nome Completo
                      </label>
                      <input
                        className="w-full bg-surface-container rounded-full py-2.5 px-4 text-sm border-none text-on-surface cursor-not-allowed opacity-80 font-medium"
                        readOnly
                        type="text"
                        value={carregandoPerfil ? 'Buscando...' : perfil.nome || 'Não informado'}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-secondary uppercase tracking-wider">
                        E-mail de Acesso
                      </label>
                      <input
                        className="w-full bg-surface-container rounded-full py-2.5 px-4 text-sm border-none text-on-surface cursor-not-allowed opacity-80 font-medium"
                        readOnly
                        type="text"
                        value={carregandoPerfil ? 'Buscando...' : perfil.email || 'Não informado'}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-secondary uppercase tracking-wider">
                        WhatsApp
                      </label>
                      <input
                        className="w-full bg-surface-container rounded-full py-2.5 px-4 text-sm border-none text-on-surface cursor-not-allowed opacity-80 font-mono"
                        readOnly
                        type="text"
                        value={carregandoPerfil ? 'Buscando...' : perfil.telefone || 'Não informado'}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-secondary uppercase tracking-wider">
                        Nível de Acesso
                      </label>
                      <div className="pt-1.5">{renderBadgeCargo(perfil.cargo)}</div>
                    </div>
                  </div>
                </section>

                {/* Seção: Alterar Senha */}
                <section className="bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-outline-variant/20 flex flex-col gap-6">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">lock</span>
                      <h3 className="font-headline text-xl font-bold text-on-surface">Alterar Senha</h3>
                    </div>
                    <p className="text-sm text-secondary">Mantenha sua conta segura atualizando sua senha.</p>
                  </div>

                  <form onSubmit={handleAlterarSenha} className="flex flex-col gap-5 max-w-md mt-2">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-secondary uppercase tracking-wider">
                        Senha Atual
                      </label>
                      <input
                        required
                        className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-full py-2.5 px-5 text-sm font-semibold text-on-surface focus:border-primary outline-none"
                        type="password"
                        placeholder="********"
                        value={senhaAtual}
                        onChange={(e) => setSenhaAtual(e.target.value)}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-secondary uppercase tracking-wider">
                        Nova Senha
                      </label>
                      <input
                        required
                        className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-full py-2.5 px-5 text-sm font-semibold text-on-surface focus:border-primary outline-none"
                        placeholder="Mínimo 8 caracteres"
                        type="password"
                        value={novaSenhaPerfil}
                        onChange={(e) => setNovaSenhaPerfil(e.target.value)}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-secondary uppercase tracking-wider">
                        Confirmar Nova Senha
                      </label>
                      <input
                        required
                        className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-full py-2.5 px-5 text-sm font-semibold text-on-surface focus:border-primary outline-none"
                        placeholder="Repita a nova senha"
                        type="password"
                        value={confirmarNovaSenha}
                        onChange={(e) => setConfirmarNovaSenha(e.target.value)}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={alterandoSenha}
                      className="mt-4 bg-primary text-on-primary hover:bg-primary/90 font-bold py-2.5 px-6 rounded-full flex items-center justify-center gap-2 transition-all cursor-pointer w-fit disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[20px]">update</span>
                      {alterandoSenha ? 'Atualizando...' : 'Atualizar Senha'}
                    </button>
                  </form>
                </section>
              </div>

              {/* Sidebar Lateral de Dicas */}
              <div className="hidden lg:flex flex-col col-span-4 gap-6 sticky top-4">
                <div className="bg-tertiary-container text-on-tertiary-container rounded-xl p-6 shadow-sm border border-tertiary/20 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-2xl">shield_locked</span>
                    <h3 className="font-headline font-bold text-lg">Dicas de Segurança</h3>
                  </div>
                  <ul className="flex flex-col gap-3 text-sm font-medium">
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-[18px] text-tertiary mt-0.5">check_circle</span>
                      Use senhas longas misturando letras, números e símbolos.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-[18px] text-tertiary mt-0.5">check_circle</span>
                      Nunca compartilhe suas credenciais de acesso com terceiros.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ABA 2: GERENCIAR USUÁRIOS */}
          {abaAtiva === 'usuarios' && (perfil.cargo === 'admin' || perfil.cargo === 'gerente') && (
            <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-outline-variant/20 pb-16">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div className="relative w-full sm:w-80">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-sm">search</span>
                  <input
                    className="w-full bg-surface-container rounded-full py-2 pl-9 pr-4 text-sm border-none focus:ring-1 focus:ring-primary outline-none"
                    placeholder="Buscar por nome, e-mail ou cargo..."
                    type="text"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                  />
                </div>

                {perfil.cargo === 'admin' && (
                  <button
                    onClick={() => setModalAberto(true)}
                    className="bg-primary hover:bg-primary/90 text-on-primary font-medium py-2.5 px-6 rounded-full flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    Convidar Novo Usuário
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                {carregandoUsuarios ? (
                  <div className="p-12 text-center text-secondary">Carregando usuários...</div>
                ) : usuariosFiltrados.length === 0 ? (
                  <div className="p-12 text-center text-secondary">Nenhum usuário encontrado.</div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low text-secondary text-sm">
                        <th className="py-3 px-6 border-b border-outline-variant/20">Nome</th>
                        <th className="py-3 px-6 border-b border-outline-variant/20">E-mail</th>
                        <th className="py-3 px-6 border-b border-outline-variant/20">WhatsApp</th>
                        <th className="py-3 px-6 border-b border-outline-variant/20">Nível</th>
                        {perfil.cargo === 'admin' && (
                          <th className="py-3 px-6 border-b border-outline-variant/20 text-right">Ações</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {usuariosFiltrados.map((u) => (
                        <tr key={u.id} className="border-b border-outline-variant/10 hover:bg-surface-container-lowest/50">
                          <td className="py-4 px-6 font-bold text-on-surface">{u.nome}</td>
                          <td className="py-4 px-6 text-secondary">{u.email}</td>
                          <td className="py-4 px-6 text-secondary font-mono">{u.telefone || 'Não informado'}</td>
                          <td className="py-4 px-6">{renderBadgeCargo(u.cargo)}</td>
                          {perfil.cargo === 'admin' && (
                            <td className="py-4 px-6 text-right relative">
                              <button
                                onClick={() => setMenuAbertoId(menuAbertoId === u.id ? null : u.id)}
                                className="text-secondary hover:text-primary p-1.5 rounded-full hover:bg-surface-container cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-lg">settings</span>
                              </button>

                              {menuAbertoId === u.id && (
                                <div className="absolute right-6 top-12 z-30 bg-surface-bright border border-outline-variant/30 rounded-xl shadow-lg p-1.5 w-44 text-left">
                                  <button
                                    onClick={() => {
                                      setMenuAbertoId(null)
                                      handleDeletarUsuario(u.id, u.nome)
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-error hover:bg-error-container/30 rounded-lg cursor-pointer"
                                  >
                                    <span className="material-symbols-outlined text-sm">delete</span>
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
            </div>
          )}

          {/* ABA 3: LIXEIRA & RESTAURAÇÃO (ADMIN APENAS) */}
          {abaAtiva === 'lixeira' && perfil.cargo === 'admin' && (
            <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-outline-variant/20 pb-16 space-y-6">
              <div>
                <h3 className="text-xl font-headline font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">recycling</span>
                  Recuperação de Registros Inativos (Soft Delete)
                </h3>
                <p className="text-secondary text-sm mt-1">
                  Registros inativados não aparecem para novos negócios, mas continuam preservando o histórico financeiro. Clique em "Restaurar" para reativá-los.
                </p>
              </div>

              {/* Seletor de Categoria na Lixeira */}
              <div className="flex gap-2 border-b border-outline-variant/20 pb-4">
                {[
                  { id: 'fazendas', label: 'Fazendas', icon: 'map' },
                  { id: 'produtores', label: 'Produtores', icon: 'agriculture' },
                  { id: 'empresas', label: 'Empresas / Tradings', icon: 'business' },
                  { id: 'ofertas', label: 'Ofertas & BIDs', icon: 'campaign' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoriaLixeira(cat.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      categoriaLixeira === cat.id
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">{cat.icon}</span>
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Tabela de Inativos */}
              <div className="overflow-x-auto">
                {carregandoLixeira ? (
                  <div className="p-12 text-center text-secondary">Buscando registros inativados...</div>
                ) : itensInativos.length === 0 ? (
                  <div className="p-12 text-center text-secondary">
                    <span className="material-symbols-outlined text-4xl text-outline-variant mb-2 block">
                      check_circle
                    </span>
                    Nenhum registro de {categoriaLixeira} inativado no momento. Todos estão ativos!
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low text-secondary text-xs font-bold uppercase">
                        <th className="py-3 px-6 border-b border-outline-variant/20">ID</th>
                        <th className="py-3 px-6 border-b border-outline-variant/20">Identificação</th>
                        <th className="py-3 px-6 border-b border-outline-variant/20">Status</th>
                        <th className="py-3 px-6 border-b border-outline-variant/20 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {itensInativos.map((item) => {
                        const nomeItem = item.nome || item.razao_social || `${item.commodity} - Lote #${item.id}`
                        return (
                          <tr key={item.id} className="border-b border-outline-variant/10 hover:bg-surface-container-low/40">
                            <td className="py-4 px-6 font-mono text-secondary">#{item.id}</td>
                            <td className="py-4 px-6 font-bold text-on-surface">{nomeItem}</td>
                            <td className="py-4 px-6">
                              <span className="px-2.5 py-1 rounded-full bg-error-container text-on-error-container text-xs font-bold uppercase">
                                Inativo
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <button
                                onClick={() => handleRestaurar(item.id, nomeItem)}
                                disabled={restaurandoId === item.id}
                                className="px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs hover:bg-primary/90 transition-all flex items-center gap-1.5 ml-auto cursor-pointer disabled:opacity-50"
                              >
                                <span className="material-symbols-outlined text-sm">restore_from_trash</span>
                                {restaurandoId === item.id ? 'Restaurando...' : 'Restaurar'}
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal de Suporte */}
      {modalSuporteAberto && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-bright p-6 rounded-2xl shadow-2xl max-w-md w-full border border-outline-variant/30 flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <h3 className="text-xl font-headline font-bold text-on-surface">Suporte Técnico</h3>
              <button onClick={() => setModalSuporteAberto(false)} className="text-secondary hover:text-on-surface cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="text-sm text-secondary">Canais diretos de contato:</p>
            <div className="flex flex-col gap-3">
              <a
                href="https://wa.me/5566999590301"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 rounded-xl bg-surface-container hover:bg-surface-container-high transition-all"
              >
                <span className="material-symbols-outlined text-primary">chat</span>
                <div>
                  <p className="text-xs font-bold uppercase text-secondary">WhatsApp</p>
                  <p className="text-sm font-semibold text-on-surface font-mono">(66) 99959-0301</p>
                </div>
              </a>
              <a
                href="mailto:lolravanello@gmail.com"
                className="flex items-center gap-4 p-4 rounded-xl bg-surface-container hover:bg-surface-container-high transition-all"
              >
                <span className="material-symbols-outlined text-secondary">mail</span>
                <div>
                  <p className="text-xs font-bold uppercase text-secondary">E-mail</p>
                  <p className="text-sm font-semibold text-on-surface truncate">lolravanello@gmail.com</p>
                </div>
              </a>
            </div>
            <div className="flex justify-end pt-3 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={() => setModalSuporteAberto(false)}
                className="px-5 py-2 rounded-xl bg-surface-container-high text-on-surface font-bold text-sm cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Convidar Usuário */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-bright p-6 rounded-2xl shadow-xl max-w-md w-full space-y-6 border border-outline-variant/30">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <h3 className="text-xl font-headline font-bold text-on-surface">Cadastrar Novo Usuário</h3>
              <button onClick={() => setModalAberto(false)} className="text-secondary hover:text-on-surface cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCadastrarUsuario} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-secondary mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  placeholder="Ex: Ricardo Oliveira"
                  className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-secondary mb-1">E-mail</label>
                <input
                  type="email"
                  required
                  value={novoEmail}
                  onChange={(e) => setNovoEmail(e.target.value)}
                  placeholder="ricardo@terranova.com.br"
                  className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-secondary mb-1">WhatsApp</label>
                <input
                  type="text"
                  required
                  value={novoTelefone}
                  onChange={(e) => setNovoTelefone(e.target.value)}
                  placeholder="Ex: 66 99988-7766"
                  className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-secondary mb-1">Senha Inicial</label>
                <input
                  type="password"
                  required
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-secondary mb-1">Nível de Acesso</label>
                <select
                  value={novoCargo}
                  onChange={(e) => setNovoCargo(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary cursor-pointer"
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
                  className="px-5 py-2.5 rounded-xl border border-outline-variant text-secondary font-bold text-sm cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoUsuario}
                  className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-sm hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
                >
                  {salvandoUsuario ? 'Salvando...' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}