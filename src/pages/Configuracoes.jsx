import { useState, useMemo } from 'react'
import {
  usePerfil,
  useUsuarios,
  useCriarUsuario,
  useEditarUsuario,
  useExcluirUsuario,
  useHistoricos,
  useQrCodeWhatsapp,
} from '../services/queries'
import {
  getIniciais,
  formatarTelefone,
  formatarDataHora,
  formatarNumero,
  normalizarBusca,
  normalizarWhatsapp,
} from '../utils/formatters'
import { EstadoLista, SkeletonTabela } from '../components/ui/PageState'
import Modal, { campoClasse, rotuloClasse } from '../components/ui/Modal'
import { useToast, useConfirm } from '../components/ui/Feedback'

const CARGOS = [
  { id: 'corretor', texto: 'Corretor', classes: 'bg-surface-variant text-on-surface-variant' },
  { id: 'gerente', texto: 'Gerente', classes: 'bg-tertiary-container/50 text-on-tertiary-container' },
  { id: 'admin', texto: 'Administrador', classes: 'bg-primary-container/50 text-on-primary-fixed-variant' },
]

const ACOES = {
  Adicionar: { icone: 'add_circle', classes: 'bg-primary-container/40 text-on-primary-fixed-variant' },
  Alterar: { icone: 'edit', classes: 'bg-tertiary-container/40 text-on-tertiary-container' },
  Deletar: { icone: 'delete', classes: 'bg-error-container text-on-error-container' },
}

// O backend devolve o log inteiro, sem paginação. Limitamos aqui para a tela não travar.
const LIMITE_HISTORICO = 200

const USUARIO_VAZIO = {
  nome: '',
  email: '',
  telefone: '',
  senha: '',
  cargo: 'corretor',
}

function BadgeCargo({ cargo }) {
  const info = CARGOS.find((c) => c.id === cargo) || CARGOS[0]
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${info.classes}`}
    >
      {info.texto}
    </span>
  )
}

function CampoLeitura({ rotulo, valor }) {
  return (
    <div>
      <label className={rotuloClasse}>{rotulo}</label>
      <input
        readOnly
        value={valor || 'Não informado'}
        className={`${campoClasse} bg-surface-container-high cursor-default`}
      />
    </div>
  )
}

/** Aviso para funcionalidade que depende de rota inexistente no servidor */
function BlocoIndisponivel({ titulo, descricao }) {
  return (
    <div className="p-6 rounded-2xl bg-tertiary-container/30 border border-tertiary/30">
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-on-tertiary-container shrink-0">
          construction
        </span>
        <div>
          <h4 className="font-headline font-bold text-on-tertiary-container mb-1">
            {titulo}
          </h4>
          <p className="text-sm text-on-tertiary-container/90 leading-relaxed">
            {descricao}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function Configuracoes() {
  const toast = useToast()
  const confirmar = useConfirm()

  const { perfil, ehAdmin, podeGerenciar, isLoading: carregandoPerfil } = usePerfil()
  const [aba, setAba] = useState('geral')

  // ---------- Senha ----------
  const [senhas, setSenhas] = useState({ nova: '', confirmar: '' })

  const trocarSenha = useEditarUsuario({
    onSuccess: () => {
      toast.sucesso('Senha atualizada.')
      setSenhas({ nova: '', confirmar: '' })
    },
    onError: (err) => toast.erro(err.message),
  })

  const salvarSenha = (e) => {
    e.preventDefault()
    if (senhas.nova.length < 8) {
      toast.aviso('A nova senha precisa ter ao menos 8 caracteres.')
      return
    }
    if (senhas.nova !== senhas.confirmar) {
      toast.aviso('A nova senha e a confirmação não coincidem.')
      return
    }
    trocarSenha.mutate({ id: perfil.id, senha_hash: senhas.nova })
  }

  // ---------- Usuários ----------
  const [busca, setBusca] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [form, setForm] = useState(USUARIO_VAZIO)

  const {
    data: usuarios = [],
    isLoading: carregandoUsuarios,
    error: erroUsuarios,
    refetch,
  } = useUsuarios()

  // ---------- Histórico ----------
  const [buscaLog, setBuscaLog] = useState('')
  const [acaoFiltro, setAcaoFiltro] = useState('Todas')

  // Só busca quando a aba está aberta — é a resposta mais pesada da API
  const {
    data: historicos = [],
    isLoading: carregandoLog,
    error: erroLog,
    refetch: recarregarLog,
  } = useHistoricos(aba === 'historico' && ehAdmin)

  const historicosFiltrados = useMemo(() => {
    const termo = normalizarBusca(buscaLog)
    return historicos
      .filter((h) => {
        if (acaoFiltro !== 'Todas' && h.acao !== acaoFiltro) return false
        if (!termo) return true
        return [h.usuario_nome, h.tabela_afetada, h.acao, h.detalhes].some((campo) =>
          normalizarBusca(campo).includes(termo)
        )
      })
      .slice(0, LIMITE_HISTORICO)
  }, [historicos, buscaLog, acaoFiltro])

  const criar = useCriarUsuario({
    onSuccess: () => {
      toast.sucesso(`Novo ${form.cargo} cadastrado.`)
      setForm(USUARIO_VAZIO)
      setModalAberto(false)
    },
    onError: (err) => toast.erro(err.message),
  })

  const excluir = useExcluirUsuario({
    onSuccess: () => toast.sucesso('Usuário desativado.'),
    onError: (err) => toast.erro(err.message),
  })

  const mudar = (campo) => (e) =>
    setForm((atual) => ({ ...atual, [campo]: e.target.value }))

  const salvarUsuario = (e) => {
    e.preventDefault()
    const telefone = normalizarWhatsapp(form.telefone)
    if (telefone.length !== 12 && telefone.length !== 13) {
      toast.erro('WhatsApp inválido. Use DDD + número, ex: (66) 99988-7766.')
      return
    }
    if (form.senha.length < 8) {
      toast.aviso('A senha precisa ter ao menos 8 caracteres.')
      return
    }
    criar.mutate({
      nome: form.nome.trim(),
      email: form.email.trim().toLowerCase(),
      telefone,
      senha_hash: form.senha, // o backend gera o hash antes de gravar
      cargo: form.cargo,
    })
  }

  const removerUsuario = async (usuario) => {
    const confirmado = await confirmar({
      titulo: `Desativar ${usuario.nome}?`,
      mensagem:
        'A pessoa perde o acesso ao sistema, mas os contratos lançados por ela são preservados.',
      textoConfirmar: 'Desativar',
      perigo: true,
    })
    if (confirmado) excluir.mutate(usuario.id)
  }

  const usuariosFiltrados = useMemo(() => {
    const termo = normalizarBusca(busca)
    if (!termo) return usuarios
    return usuarios.filter((u) =>
      [u.nome, u.email, u.cargo].some((campo) => normalizarBusca(campo).includes(termo))
    )
  }, [usuarios, busca])

  // ---------- WhatsApp ----------
  const {
    data: whatsapp,
    isFetching: carregandoQr,
    error: erroQr,
    refetch: gerarQr,
  } = useQrCodeWhatsapp(aba === 'whatsapp' && podeGerenciar)

  const abas = [
    { id: 'geral', icone: 'person', texto: 'Geral', visivel: true },
    { id: 'usuarios', icone: 'group', texto: 'Usuários / Equipe', visivel: podeGerenciar },
    { id: 'whatsapp', icone: 'qr_code_2', texto: 'WhatsApp', visivel: podeGerenciar },
    { id: 'historico', icone: 'history', texto: 'Histórico', visivel: ehAdmin },
    { id: 'lixeira', icone: 'recycling', texto: 'Lixeira', visivel: ehAdmin },
  ].filter((a) => a.visivel)

  return (
    <div className="space-y-8 pb-12">
      {/* Cabeçalho */}
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-primary text-3xl mt-1">
          settings
        </span>
        <div>
          <h2 className="text-3xl font-headline font-semibold text-on-background mb-1">
            Configurações
          </h2>
          <p className="text-secondary text-lg">
            Gerencie seus dados de acesso, a equipe e os registros arquivados.
          </p>
        </div>
      </div>

      {/* Abas */}
      <div className="border-b border-outline-variant/30 flex gap-6 overflow-x-auto">
        {abas.map((a) => (
          <button
            key={a.id}
            onClick={() => setAba(a.id)}
            className={`pb-3 flex items-center gap-2 font-body font-semibold text-sm whitespace-nowrap border-b-2 -mb-px transition-colors cursor-pointer ${
              aba === a.id
                ? 'border-primary text-primary'
                : 'border-transparent text-secondary hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">{a.icone}</span>
            {a.texto}
          </button>
        ))}
      </div>

      {/* ================= GERAL ================= */}
      {aba === 'geral' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Meus dados */}
          <div className="bg-surface-bright rounded-2xl p-6 border border-outline-variant/20 shadow-sm space-y-5">
            <div className="flex items-center gap-4 pb-4 border-b border-outline-variant/20">
              <div className="h-14 w-14 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold shrink-0">
                {getIniciais(perfil.nome)}
              </div>
              <div>
                <h3 className="font-headline text-xl font-bold text-on-surface">
                  Meus dados
                </h3>
                <p className="text-sm text-secondary capitalize">{perfil.cargo}</p>
              </div>
            </div>

            <div className="space-y-4">
              <CampoLeitura
                rotulo="Nome completo"
                valor={carregandoPerfil ? 'Buscando...' : perfil.nome}
              />
              <CampoLeitura
                rotulo="E-mail de acesso"
                valor={carregandoPerfil ? 'Buscando...' : perfil.email}
              />
              <CampoLeitura
                rotulo="WhatsApp"
                valor={
                  perfil.telefone ? formatarTelefone(perfil.telefone) : 'Não informado'
                }
              />
            </div>

            <p className="text-xs text-secondary">
              Para corrigir estes dados, peça a um administrador.
            </p>
          </div>

          {/* Senha */}
          <div className="bg-surface-bright rounded-2xl p-6 border border-outline-variant/20 shadow-sm space-y-5">
            <div className="flex items-center gap-2.5 pb-4 border-b border-outline-variant/20">
              <span className="material-symbols-outlined text-primary">lock_reset</span>
              <h3 className="font-headline text-xl font-bold text-on-surface">
                Alterar senha
              </h3>
            </div>

            {ehAdmin ? (
              <form onSubmit={salvarSenha} className="space-y-4">
                <div>
                  <label className={rotuloClasse}>Nova senha</label>
                  <input
                    type="password"
                    required
                    placeholder="Mínimo 8 caracteres"
                    value={senhas.nova}
                    onChange={(e) =>
                      setSenhas((atual) => ({ ...atual, nova: e.target.value }))
                    }
                    className={campoClasse}
                  />
                </div>
                <div>
                  <label className={rotuloClasse}>Confirmar nova senha</label>
                  <input
                    type="password"
                    required
                    placeholder="Repita a nova senha"
                    value={senhas.confirmar}
                    onChange={(e) =>
                      setSenhas((atual) => ({ ...atual, confirmar: e.target.value }))
                    }
                    className={campoClasse}
                  />
                </div>
                <button
                  type="submit"
                  disabled={trocarSenha.isPending || !perfil.id}
                  className="bg-primary text-on-primary hover:bg-primary/90 font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 transition-all cursor-pointer w-fit disabled:opacity-50 active:scale-95"
                >
                  <span className="material-symbols-outlined text-base">save</span>
                  {trocarSenha.isPending ? 'Salvando...' : 'Atualizar senha'}
                </button>
              </form>
            ) : (
              <BlocoIndisponivel
                titulo="Disponível apenas para administradores"
                descricao="A rota de troca de senha própria (POST /alterar-senha) ainda não existe no servidor. Enquanto isso, use 'Esqueci a senha' na tela de login para receber um código no WhatsApp, ou peça a um administrador."
              />
            )}
          </div>
        </div>
      )}

      {/* ================= USUÁRIOS ================= */}
      {aba === 'usuarios' && podeGerenciar && (
        <div className="bg-surface-bright rounded-2xl border border-outline-variant/20 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-outline-variant/20 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:max-w-md">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary text-sm">
                search
              </span>
              <input
                type="text"
                placeholder="Buscar por nome, e-mail ou cargo..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low focus:ring-2 focus:ring-primary outline-none text-sm text-on-surface placeholder:text-secondary"
              />
            </div>

            {ehAdmin && (
              <button
                onClick={() => setModalAberto(true)}
                className="bg-primary text-on-primary px-6 py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2 cursor-pointer active:scale-95 whitespace-nowrap"
              >
                <span className="material-symbols-outlined">person_add</span>
                Novo usuário
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <EstadoLista
              carregando={carregandoUsuarios}
              erro={erroUsuarios}
              vazio={usuariosFiltrados.length === 0}
              onTentarNovamente={refetch}
              skeleton={<SkeletonTabela colunas={5} />}
              vazioProps={{
                icone: 'group_off',
                titulo: busca
                  ? 'Nenhum usuário corresponde à busca'
                  : 'Nenhum usuário cadastrado',
                descricao: busca
                  ? `Nada encontrado para "${busca}".`
                  : 'Cadastre os corretores da equipe para dar acesso ao sistema.',
              }}
            >
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low text-secondary text-xs font-bold uppercase">
                    <th className="py-3 px-6 border-b border-outline-variant/20">Nome</th>
                    <th className="py-3 px-6 border-b border-outline-variant/20">
                      E-mail
                    </th>
                    <th className="py-3 px-6 border-b border-outline-variant/20">
                      WhatsApp
                    </th>
                    <th className="py-3 px-6 border-b border-outline-variant/20">
                      Nível
                    </th>
                    {ehAdmin && (
                      <th className="py-3 px-6 border-b border-outline-variant/20 text-right">
                        Ações
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {usuariosFiltrados.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors"
                    >
                      <td className="py-4 px-6 font-bold text-on-surface">
                        {u.nome}
                        {u.id === perfil.id && (
                          <span className="text-secondary font-normal"> (você)</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-secondary">{u.email}</td>
                      <td className="py-4 px-6 text-secondary font-mono">
                        {formatarTelefone(u.telefone)}
                      </td>
                      <td className="py-4 px-6">
                        <BadgeCargo cargo={u.cargo} />
                      </td>
                      {ehAdmin && (
                        <td className="py-4 px-6 text-right">
                          {u.id === perfil.id ? (
                            <span className="text-xs text-secondary">—</span>
                          ) : (
                            <button
                              onClick={() => removerUsuario(u)}
                              disabled={excluir.isPending}
                              className="p-2 rounded-lg text-secondary hover:text-error hover:bg-error-container/30 transition-colors cursor-pointer disabled:opacity-50"
                              title={`Desativar ${u.nome}`}
                            >
                              <span className="material-symbols-outlined text-[20px]">
                                person_remove
                              </span>
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </EstadoLista>
          </div>
        </div>
      )}

      {/* ================= WHATSAPP ================= */}
      {aba === 'whatsapp' && podeGerenciar && (
        <div className="max-w-2xl space-y-6">
          <div className="bg-surface-bright rounded-2xl p-6 border border-outline-variant/20 shadow-sm">
            <div className="flex items-center gap-2.5 mb-2">
              <span className="material-symbols-outlined text-primary">smartphone</span>
              <h3 className="font-headline text-xl font-bold text-on-surface">
                Número que envia as ofertas
              </h3>
            </div>
            <p className="text-secondary text-sm leading-relaxed">
              As ofertas disparadas no Novo Fechamento e os códigos de recuperação de
              senha saem deste WhatsApp. Pareie o aparelho lendo o código abaixo.
            </p>
            <p className="text-secondary text-sm leading-relaxed mt-2">
              Já existe um número conectado? O código só é gerado quando a sessão está
              livre — trocar de aparelho depende de uma rota de desconexão que ainda não
              existe no servidor.
            </p>
          </div>

          <div className="bg-surface-bright rounded-2xl p-6 border border-outline-variant/20 shadow-sm flex flex-col items-center gap-5">
            {carregandoQr ? (
              <>
                <div className="w-64 h-64 rounded-2xl bg-surface-variant animate-pulse" />
                <p className="text-sm text-secondary font-body">Gerando código...</p>
              </>
            ) : erroQr ? (
              <div className="text-center py-6">
                <span className="material-symbols-outlined text-4xl text-error mb-3 block">
                  cloud_off
                </span>
                <p className="text-on-surface font-semibold mb-1">
                  Não foi possível gerar o código
                </p>
                <p className="text-on-surface-variant text-sm max-w-sm mx-auto">
                  {erroQr.message}
                </p>
              </div>
            ) : whatsapp?.qrcode ? (
              <>
                <img
                  src={whatsapp.qrcode}
                  alt="QR Code para parear o WhatsApp"
                  className="w-64 h-64 rounded-2xl border border-outline-variant/30 bg-white p-2"
                />
                <ol className="text-sm text-on-surface-variant font-body space-y-1.5 list-decimal list-inside">
                  <li>Abra o WhatsApp no celular que vai enviar as mensagens</li>
                  <li>Toque em Aparelhos conectados</li>
                  <li>Toque em Conectar um aparelho e aponte para o código</li>
                </ol>
                <p className="text-xs text-secondary text-center">
                  O código expira em poucos segundos. Se demorar, gere outro.
                </p>
              </>
            ) : whatsapp ? (
              <div className="text-center py-6">
                <span className="material-symbols-outlined text-4xl text-primary mb-3 block">
                  check_circle
                </span>
                <p className="text-on-surface font-semibold mb-1">
                  Nenhum código pendente
                </p>
                <p className="text-on-surface-variant text-sm max-w-sm mx-auto">
                  O servidor não devolveu um QR Code. Em geral isso significa que o
                  aparelho já está pareado — gere um novo código apenas se as mensagens
                  pararem de sair.
                </p>
              </div>
            ) : (
              <div className="text-center py-6">
                <span className="material-symbols-outlined text-4xl text-outline mb-3 block">
                  qr_code_2
                </span>
                <p className="text-on-surface-variant text-sm">
                  Clique abaixo para gerar o código de pareamento.
                </p>
              </div>
            )}

            <button
              onClick={() => gerarQr()}
              disabled={carregandoQr}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-sm hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50 active:scale-95"
            >
              <span className="material-symbols-outlined text-base">refresh</span>
              {carregandoQr ? 'Gerando...' : 'Gerar novo código'}
            </button>
          </div>
        </div>
      )}

      {/* ================= HISTÓRICO ================= */}
      {aba === 'historico' && ehAdmin && (
        <div className="bg-surface-bright rounded-2xl border border-outline-variant/20 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-outline-variant/20 space-y-4">
            <div>
              <h3 className="font-headline text-xl font-bold text-on-surface">
                Registro de atividades
              </h3>
              <p className="text-secondary text-sm mt-1">
                Cada criação, alteração e exclusão feita no sistema, da mais recente
                para a mais antiga.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary text-sm">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Buscar por usuário, tabela ou detalhe..."
                  value={buscaLog}
                  onChange={(e) => setBuscaLog(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low focus:ring-2 focus:ring-primary outline-none text-sm text-on-surface placeholder:text-secondary"
                />
              </div>
              <select
                value={acaoFiltro}
                onChange={(e) => setAcaoFiltro(e.target.value)}
                className={`${campoClasse} sm:max-w-[200px]`}
              >
                <option value="Todas">Todas as ações</option>
                <option value="Adicionar">Criações</option>
                <option value="Alterar">Alterações</option>
                <option value="Deletar">Exclusões</option>
              </select>
            </div>

            {!carregandoLog && !erroLog && historicos.length > 0 && (
              <p className="text-xs text-secondary">
                Exibindo {formatarNumero(historicosFiltrados.length)} de{' '}
                {formatarNumero(historicos.length)} registros
                {historicos.length > LIMITE_HISTORICO &&
                  ` (limitado aos ${LIMITE_HISTORICO} mais recentes)`}
              </p>
            )}
          </div>

          <div className="overflow-x-auto">
            <EstadoLista
              carregando={carregandoLog}
              erro={erroLog}
              vazio={historicosFiltrados.length === 0}
              onTentarNovamente={recarregarLog}
              skeleton={<SkeletonTabela colunas={5} />}
              vazioProps={{
                icone: 'history_toggle_off',
                titulo:
                  buscaLog || acaoFiltro !== 'Todas'
                    ? 'Nenhum registro corresponde ao filtro'
                    : 'Nenhuma atividade registrada',
                descricao:
                  buscaLog || acaoFiltro !== 'Todas'
                    ? 'Ajuste a busca ou o tipo de ação.'
                    : 'As ações feitas no sistema vão aparecer aqui.',
              }}
            >
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low text-secondary text-xs font-bold uppercase">
                    <th className="py-3 px-6 border-b border-outline-variant/20">
                      Quando
                    </th>
                    <th className="py-3 px-6 border-b border-outline-variant/20">
                      Quem
                    </th>
                    <th className="py-3 px-6 border-b border-outline-variant/20">
                      Ação
                    </th>
                    <th className="py-3 px-6 border-b border-outline-variant/20">
                      Registro
                    </th>
                    <th className="py-3 px-6 border-b border-outline-variant/20">
                      Detalhes
                    </th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {historicosFiltrados.map((h) => {
                    const info = ACOES[h.acao] || ACOES.Alterar
                    return (
                      <tr
                        key={h.id}
                        className="border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors"
                      >
                        <td className="py-4 px-6 text-secondary whitespace-nowrap">
                          {formatarDataHora(h.horario)}
                        </td>
                        <td className="py-4 px-6 font-medium text-on-surface">
                          {h.usuario_nome || `Usuário #${h.usuario_id}`}
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${info.classes}`}
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {info.icone}
                            </span>
                            {h.acao}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-on-surface whitespace-nowrap">
                          {h.tabela_afetada}{' '}
                          <span className="font-mono text-secondary">#{h.id_afetado}</span>
                        </td>
                        <td className="py-4 px-6 text-secondary">{h.detalhes || '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </EstadoLista>
          </div>
        </div>
      )}

      {/* ================= LIXEIRA ================= */}
      {aba === 'lixeira' && ehAdmin && (
        <div className="space-y-6">
          <div className="bg-surface-bright rounded-2xl p-6 border border-outline-variant/20 shadow-sm">
            <div className="flex items-center gap-2.5 mb-2">
              <span className="material-symbols-outlined text-primary">recycling</span>
              <h3 className="font-headline text-xl font-bold text-on-surface">
                Recuperação de registros inativos
              </h3>
            </div>
            <p className="text-secondary text-sm leading-relaxed">
              Registros excluídos no sistema não somem do banco: eles ficam marcados como
              inativos, para preservar o histórico dos contratos que dependem deles.
            </p>
          </div>

          <BlocoIndisponivel
            titulo="Aguardando o backend"
            descricao="A exclusão suave já funciona, mas ainda não existem as rotas para listar e restaurar os registros arquivados (GET /{recurso}/?inativos=true e PUT /{recurso}/{id}/restaurar). Assim que forem publicadas, esta aba passa a listar produtores, fazendas, empresas e ofertas inativos com botão de restaurar. Nenhum dado foi perdido nesse meio-tempo."
          />
        </div>
      )}

      {/* Novo usuário */}
      <Modal
        aberto={modalAberto}
        titulo="Cadastrar novo usuário"
        descricao="A pessoa acessa o sistema com o e-mail e a senha definidos aqui."
        aoFechar={() => !criar.isPending && setModalAberto(false)}
      >
        <form onSubmit={salvarUsuario} className="space-y-4 font-body">
          <div>
            <label className={rotuloClasse}>Nome completo</label>
            <input
              type="text"
              required
              autoFocus
              value={form.nome}
              onChange={mudar('nome')}
              placeholder="Ex: Maria Fernandes"
              className={campoClasse}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={rotuloClasse}>E-mail de acesso</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={mudar('email')}
                placeholder="maria@terranova.com.br"
                className={campoClasse}
              />
            </div>
            <div>
              <label className={rotuloClasse}>WhatsApp</label>
              <input
                type="text"
                required
                value={form.telefone}
                onChange={mudar('telefone')}
                placeholder="(66) 99988-7766"
                className={campoClasse}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={rotuloClasse}>Senha provisória</label>
              <input
                type="password"
                required
                value={form.senha}
                onChange={mudar('senha')}
                placeholder="Mínimo 8 caracteres"
                className={campoClasse}
              />
            </div>
            <div>
              <label className={rotuloClasse}>Nível de acesso</label>
              <select value={form.cargo} onChange={mudar('cargo')} className={campoClasse}>
                {CARGOS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.texto}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-xs text-secondary">
            O WhatsApp é usado para recuperar a senha, então precisa estar correto.
          </p>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={criar.isPending}
              onClick={() => setModalAberto(false)}
              className="px-5 py-2.5 rounded-xl border border-outline-variant text-secondary font-bold hover:bg-surface-container-low cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={criar.isPending}
              className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-bold hover:bg-primary/90 disabled:opacity-50 cursor-pointer active:scale-95 transition-all"
            >
              {criar.isPending ? 'Salvando...' : 'Cadastrar usuário'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}