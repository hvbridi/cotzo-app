import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  useProdutores,
  useCriarProdutor,
  useEditarProdutor,
  useExcluirProdutor,
  usePerfil,
} from '../services/queries'
import {
  normalizarBusca,
  formatarNumero,
  formatarCpfCnpj,
  formatarTelefone,
} from '../utils/formatters'
import { EstadoLista, SkeletonTabela } from '../components/ui/PageState'
import Modal from '../components/ui/Modal'
import FormularioProdutor, {
  PRODUTOR_VAZIO,
  montarPayloadProdutor,
  produtorParaForm,
} from '../components/FormularioProdutor'
import { useToast, useConfirm } from '../components/ui/Feedback'

export default function Produtores() {
  const toast = useToast()
  const confirmar = useConfirm()
  const { ehAdmin } = usePerfil()

  const [busca, setBusca] = useState('')
  // editando = null -> cadastro novo | objeto -> edição daquele produtor
  const [modal, setModal] = useState(null) // { editando, form }

  const { data: produtores = [], isLoading, error, refetch } = useProdutores()

  const criar = useCriarProdutor({
    onSuccess: (novo) => {
      toast.sucesso(`Produtor ${novo?.nome || ''} cadastrado.`)
      setModal(null)
    },
    onError: (err) => toast.erro(err.message),
  })

  const editar = useEditarProdutor({
    onSuccess: () => {
      toast.sucesso('Produtor atualizado.')
      setModal(null)
    },
    onError: (err) => toast.erro(err.message),
  })

  const excluir = useExcluirProdutor({
    onSuccess: () => toast.sucesso('Produtor removido.'),
    onError: (err) => toast.erro(err.message),
  })

  const salvando = criar.isPending || editar.isPending

  const abrirCadastro = () => setModal({ editando: null, form: PRODUTOR_VAZIO })
  const abrirEdicao = (p) =>
    setModal({ editando: p, form: produtorParaForm(p) })

  const definirForm = (atualizador) =>
    setModal((atual) => ({
      ...atual,
      form:
        typeof atualizador === 'function' ? atualizador(atual.form) : atualizador,
    }))

  const salvar = (e) => {
    e.preventDefault()
    const payload = montarPayloadProdutor(modal.form)
    if (modal.editando) {
      editar.mutate({ id: modal.editando.id, ...payload })
    } else {
      criar.mutate(payload)
    }
  }

  const removerProdutor = async (produtor) => {
    const confirmado = await confirmar({
      titulo: `Excluir ${produtor.nome}?`,
      mensagem:
        'As fazendas dele deixam de aparecer em novos fechamentos. Contratos já registrados são preservados.',
      textoConfirmar: 'Excluir',
      perigo: true,
    })
    if (confirmado) excluir.mutate(produtor.id)
  }

  const produtoresFiltrados = useMemo(() => {
    const termo = normalizarBusca(busca)
    if (!termo) return produtores
    return produtores.filter((p) =>
      [p.nome, p.cpf_cnpj, p.whatsapp, p.cidade].some((campo) =>
        normalizarBusca(campo).includes(termo)
      )
    )
  }, [produtores, busca])

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
            <span className="text-primary font-medium">Produtores</span>
          </div>
          <h2 className="font-headline text-3xl font-semibold text-on-background mb-1">
            Produtores Rurais
          </h2>
          <p className="text-secondary text-lg">
            Gerencie os produtores rurais parceiros do sistema.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={abrirCadastro}
            className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2 active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined">person_add</span>
            Novo produtor
          </button>
          <Link
            to="/cadastrar-fazenda"
            className="bg-secondary-container text-on-secondary-container px-6 py-3 rounded-xl font-bold hover:bg-surface-container-highest transition-colors shadow-sm flex items-center gap-2 active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined">landscape</span>
            Nova fazenda
          </Link>
        </div>
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
              placeholder="Buscar por nome, CPF/CNPJ ou WhatsApp..."
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          {!isLoading && !error && (
            <p className="text-sm text-secondary font-body shrink-0">
              {formatarNumero(produtoresFiltrados.length)}{' '}
              {produtoresFiltrados.length === 1 ? 'produtor' : 'produtores'}
            </p>
          )}
        </div>

        <div className="overflow-x-auto">
          <EstadoLista
            carregando={isLoading}
            erro={error}
            vazio={produtoresFiltrados.length === 0}
            onTentarNovamente={refetch}
            skeleton={<SkeletonTabela colunas={6} />}
            vazioProps={
              busca
                ? {
                    icone: 'search_off',
                    titulo: 'Nenhum produtor corresponde à busca',
                    descricao: `Nada encontrado para "${busca}". Tente outro termo.`,
                  }
                : {
                    icone: 'agriculture',
                    titulo: 'Nenhum produtor cadastrado',
                    descricao:
                      'Cadastre o primeiro produtor para poder registrar fazendas e fechamentos.',
                    acao: (
                      <button
                        onClick={abrirCadastro}
                        className="inline-flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:bg-primary/90 transition-colors cursor-pointer active:scale-95"
                      >
                        <span className="material-symbols-outlined text-lg">
                          person_add
                        </span>
                        Cadastrar produtor
                      </button>
                    ),
                  }
            }
          >
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-secondary text-xs font-bold uppercase">
                  <th className="py-3 px-6 border-b border-outline-variant/20">ID</th>
                  <th className="py-3 px-6 border-b border-outline-variant/20">
                    Nome do produtor
                  </th>
                  <th className="py-3 px-6 border-b border-outline-variant/20">
                    CPF / CNPJ
                  </th>
                  <th className="py-3 px-6 border-b border-outline-variant/20">
                    WhatsApp
                  </th>
                  <th className="py-3 px-6 border-b border-outline-variant/20">
                    Localização
                  </th>
                  <th className="py-3 px-6 border-b border-outline-variant/20 text-right">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {produtoresFiltrados.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors"
                  >
                    <td className="py-4 px-6 font-mono text-secondary">#{p.id}</td>
                    <td className="py-4 px-6 font-medium text-on-surface">{p.nome}</td>
                    <td className="py-4 px-6 text-secondary">
                      {formatarCpfCnpj(p.cpf_cnpj)}
                    </td>
                    <td className="py-4 px-6 text-secondary">
                      {formatarTelefone(p.whatsapp)}
                    </td>
                    <td className="py-4 px-6 text-on-surface">
                      {p.cidade ? `${p.cidade}${p.uf ? ` - ${p.uf}` : ''}` : '—'}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => abrirEdicao(p)}
                          title={`Editar ${p.nome}`}
                          className="p-2 rounded-lg text-secondary hover:text-primary hover:bg-primary-container/30 transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            edit
                          </span>
                        </button>

                        {/* Exclusão é restrita a admin no backend */}
                        {ehAdmin && (
                          <button
                            onClick={() => removerProdutor(p)}
                            disabled={excluir.isPending}
                            title={`Excluir ${p.nome}`}
                            className="p-2 rounded-lg text-secondary hover:text-error hover:bg-error-container/30 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              delete
                            </span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </EstadoLista>
        </div>
      </div>

      {/* Cadastro e edição usam o mesmo formulário */}
      <Modal
        aberto={!!modal}
        titulo={modal?.editando ? 'Editar produtor' : 'Cadastrar novo produtor'}
        descricao={
          modal?.editando
            ? `Alterando os dados de ${modal.editando.nome}.`
            : 'O WhatsApp é usado para enviar as ofertas.'
        }
        aoFechar={() => !salvando && setModal(null)}
      >
        {modal && (
          <form onSubmit={salvar} className="space-y-4 font-body">
            <FormularioProdutor form={modal.form} setForm={definirForm} />

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={salvando}
                onClick={() => setModal(null)}
                className="px-5 py-2.5 rounded-xl border border-outline-variant text-secondary font-bold hover:bg-surface-container-low cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvando}
                className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-bold hover:bg-primary/90 disabled:opacity-50 cursor-pointer active:scale-95 transition-all"
              >
                {salvando
                  ? 'Salvando...'
                  : modal.editando
                  ? 'Salvar alterações'
                  : 'Salvar produtor'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}