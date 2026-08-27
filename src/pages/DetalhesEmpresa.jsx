import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  useEmpresas,
  useCompradoresDaEmpresa,
  useCriarComprador,
  useEditarComprador,
  useExcluirComprador,
  useEditarEmpresa,
  useExcluirEmpresa,
  usePerfil,
} from '../services/queries'
import {
  formatarTelefone,
  formatarCpfCnpj,
  normalizarWhatsapp,
} from '../utils/formatters'
import { EstadoErro, EstadoVazio, SkeletonCards } from '../components/ui/PageState'
import Modal, { campoClasse, rotuloClasse } from '../components/ui/Modal'
import FormularioEmpresa, {
  montarPayloadEmpresa,
  empresaParaForm,
} from '../components/FormularioEmpresa'
import { useToast, useConfirm } from '../components/ui/Feedback'

const COMPRADOR_VAZIO = { nome: '', email: '', telefone: '' }

/** O backend precisa do número com DDI para disparar as ofertas */
function validarWhatsapp(valor) {
  const digitos = normalizarWhatsapp(valor)
  if (!digitos) throw new Error('Informe o WhatsApp do comprador.')
  if (digitos.length !== 12 && digitos.length !== 13) {
    throw new Error('WhatsApp inválido. Use DDD + número, ex: (66) 99988-7766.')
  }
  return digitos
}

function Campo({ rotulo, valor, mono }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-label uppercase tracking-wider text-secondary">
        {rotulo}
      </span>
      <span
        className={`text-base font-body text-on-surface leading-relaxed ${
          mono ? 'font-mono' : ''
        }`}
      >
        {valor || '—'}
      </span>
    </div>
  )
}

export default function DetalhesEmpresa() {
  const navigate = useNavigate()
  const toast = useToast()
  const confirmar = useConfirm()
  const [searchParams] = useSearchParams()
  const empresaId = searchParams.get('id')

  const { ehAdmin } = usePerfil()

  const [modalComprador, setModalComprador] = useState(null) // { editando, form }
  const [formEmpresa, setFormEmpresa] = useState(null)

  // A lista já está em cache desde a tela de Empresas, então é só filtrar.
  const { data: empresas = [], isLoading, error, refetch } = useEmpresas()
  const empresa = useMemo(
    () => empresas.find((e) => String(e.id) === String(empresaId)),
    [empresas, empresaId]
  )

  const { data: compradores = [] } = useCompradoresDaEmpresa(empresa?.id)

  // ---------- Empresa ----------
  const editarEmpresa = useEditarEmpresa({
    onSuccess: () => {
      toast.sucesso('Empresa atualizada.')
      setFormEmpresa(null)
    },
    onError: (err) => toast.erro(err.message),
  })

  const excluirEmpresa = useExcluirEmpresa({
    onSuccess: () => {
      toast.sucesso('Empresa removida.')
      navigate('/empresas')
    },
    onError: (err) => toast.erro(err.message),
  })

  const salvarEmpresa = (e) => {
    e.preventDefault()
    editarEmpresa.mutate({ id: empresa.id, ...montarPayloadEmpresa(formEmpresa) })
  }

  const removerEmpresa = async () => {
    const confirmado = await confirmar({
      titulo: `Excluir ${empresa.razao_social || empresa.nome}?`,
      mensagem:
        'A empresa e seus compradores saem das listas de novos fechamentos. Contratos já registrados são preservados.',
      textoConfirmar: 'Excluir',
      perigo: true,
    })
    if (confirmado) excluirEmpresa.mutate(empresa.id)
  }

  // ---------- Compradores ----------
  const criarComprador = useCriarComprador({
    onSuccess: () => {
      toast.sucesso('Comprador vinculado à empresa.')
      setModalComprador(null)
    },
    onError: (err) => toast.erro(err.message),
  })

  const editarComprador = useEditarComprador({
    onSuccess: () => {
      toast.sucesso('Comprador atualizado.')
      setModalComprador(null)
    },
    onError: (err) => toast.erro(err.message),
  })

  const excluirComprador = useExcluirComprador({
    onSuccess: () => toast.sucesso('Comprador removido.'),
    onError: (err) => toast.erro(err.message),
  })

  const salvandoComprador = criarComprador.isPending || editarComprador.isPending

  const mudarComprador = (campo) => (e) =>
    setModalComprador((atual) => ({
      ...atual,
      form: { ...atual.form, [campo]: e.target.value },
    }))

  const salvarComprador = (e) => {
    e.preventDefault()
    let telefone
    try {
      telefone = validarWhatsapp(modalComprador.form.telefone)
    } catch (err) {
      toast.erro(err.message)
      return
    }

    const dados = {
      nome: modalComprador.form.nome.trim(),
      email: modalComprador.form.email.trim(),
      telefone,
    }

    if (modalComprador.editando) {
      editarComprador.mutate({ id: modalComprador.editando.id, ...dados })
    } else {
      criarComprador.mutate({ ...dados, empresa_id: Number(empresa.id) })
    }
  }

  const removerComprador = async (comprador) => {
    const confirmado = await confirmar({
      titulo: `Remover ${comprador.nome}?`,
      mensagem: 'O contato deixa de aparecer nas ofertas enviadas para esta empresa.',
      textoConfirmar: 'Remover',
      perigo: true,
    })
    if (confirmado) excluirComprador.mutate(comprador.id)
  }

  // ---------- Estados ----------
  if (isLoading) return <SkeletonCards quantidade={3} />

  if (error) {
    return <EstadoErro mensagem={error.message} onTentarNovamente={refetch} />
  }

  if (!empresa) {
    return (
      <EstadoVazio
        icone="business"
        titulo="Empresa não encontrada"
        descricao={
          empresaId
            ? `Nenhuma empresa com o ID #${empresaId}. Ela pode ter sido excluída.`
            : 'Nenhum ID de empresa foi informado no endereço.'
        }
        acao={
          <button
            onClick={() => navigate('/empresas')}
            className="inline-flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:bg-primary/90 transition-colors cursor-pointer active:scale-95"
          >
            Voltar para empresas
          </button>
        }
      />
    )
  }

  const nomeEmpresa = empresa.razao_social || empresa.nome

  return (
    <div className="space-y-8 pb-12">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/empresas')}
            className="flex items-center gap-2 text-sm font-label text-primary hover:opacity-80 transition-opacity cursor-pointer mb-2"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Voltar para a lista
          </button>
          <h1 className="text-3xl font-headline font-bold text-on-surface">
            {nomeEmpresa}
          </h1>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setFormEmpresa(empresaParaForm(empresa))}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-sm hover:bg-primary/90 transition-colors cursor-pointer active:scale-95"
          >
            <span className="material-symbols-outlined text-base">edit</span>
            Editar
          </button>

          {/* Exclusão é restrita a admin no backend */}
          {ehAdmin && (
            <button
              onClick={removerEmpresa}
              disabled={excluirEmpresa.isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-error/40 text-error font-bold text-sm hover:bg-error-container/40 transition-colors cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-base">delete</span>
              Excluir
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dados corporativos */}
        <div className="lg:col-span-1">
          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/20 flex flex-col gap-6">
            <h2 className="text-lg font-headline font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">apartment</span>
              Dados corporativos
            </h2>
            <div className="flex flex-col gap-4">
              <Campo rotulo="CNPJ" valor={formatarCpfCnpj(empresa.cnpj)} mono />
              <Campo rotulo="Inscrição estadual" valor={empresa.inscricao_estadual} mono />
              <Campo
                rotulo="Telefone geral"
                valor={empresa.telefone ? formatarTelefone(empresa.telefone) : null}
                mono
              />
              <Campo rotulo="E-mail institucional" valor={empresa.email} />
              <Campo rotulo="Endereço" valor={empresa.endereco} />
              <Campo rotulo="Contato principal" valor={empresa.contato_nome} />
            </div>
          </div>
        </div>

        {/* Compradores */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/20 flex flex-col gap-6 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-headline font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">groups</span>
                Compradores da trading
              </h2>
              <button
                onClick={() =>
                  setModalComprador({ editando: null, form: COMPRADOR_VAZIO })
                }
                className="flex items-center gap-2 bg-primary px-4 py-2 rounded-xl text-on-primary text-sm font-bold hover:bg-primary/90 transition-all shadow-sm cursor-pointer active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Adicionar comprador
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {compradores.length === 0 ? (
                <div className="p-8 text-center bg-surface-container-low rounded-xl">
                  <p className="text-on-surface font-semibold mb-1 font-body">
                    Nenhum comprador cadastrado
                  </p>
                  <p className="text-secondary text-sm font-body">
                    Adicione os negociadores desta trading para incluí-los no envio de
                    ofertas.
                  </p>
                </div>
              ) : (
                compradores.map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-surface hover:bg-surface-container transition-colors border border-outline-variant/10"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-headline font-bold uppercase shrink-0">
                        {c.nome.slice(0, 2)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-base font-body font-bold text-on-surface truncate">
                          {c.nome}
                        </span>
                        <span className="text-xs font-body text-secondary truncate">
                          {c.email}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={`https://wa.me/${normalizarWhatsapp(c.telefone)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-sm font-bold text-on-surface hover:text-primary transition-colors font-mono bg-surface-container-low px-3 py-1.5 rounded-lg border border-outline-variant/20"
                      >
                        <span className="material-symbols-outlined text-[#25D366] text-[18px]">
                          chat
                        </span>
                        {formatarTelefone(c.telefone)}
                      </a>

                      <button
                        onClick={() =>
                          setModalComprador({
                            editando: c,
                            form: {
                              nome: c.nome ?? '',
                              email: c.email ?? '',
                              telefone: c.telefone ?? '',
                            },
                          })
                        }
                        title={`Editar ${c.nome}`}
                        className="p-2 rounded-lg text-secondary hover:text-primary hover:bg-primary-container/30 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          edit
                        </span>
                      </button>

                      <button
                        onClick={() => removerComprador(c)}
                        disabled={excluirComprador.isPending}
                        title={`Remover ${c.nome}`}
                        className="p-2 rounded-lg text-secondary hover:text-error hover:bg-error-container/30 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          delete
                        </span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="w-full rounded-2xl bg-surface-container-low border border-outline-variant/20 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-headline font-bold text-on-surface text-lg">
                Fechar negócio com a {nomeEmpresa}?
              </h3>
              <p className="text-secondary text-sm mt-1 font-body">
                Registre o contrato de corretagem para esta empresa.
              </p>
            </div>
            <button
              onClick={() => navigate('/fechamento')}
              className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all cursor-pointer whitespace-nowrap active:scale-95 shrink-0"
            >
              Novo fechamento
            </button>
          </div>
        </div>
      </div>

      {/* Edição da empresa — mesmo formulário do cadastro */}
      <Modal
        aberto={!!formEmpresa}
        titulo="Editar empresa"
        descricao={`Alterando os dados de ${nomeEmpresa}.`}
        largura="max-w-3xl"
        aoFechar={() => !editarEmpresa.isPending && setFormEmpresa(null)}
      >
        {formEmpresa && (
          <form onSubmit={salvarEmpresa} className="space-y-6">
            <FormularioEmpresa form={formEmpresa} setForm={setFormEmpresa} semCartao />

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={editarEmpresa.isPending}
                onClick={() => setFormEmpresa(null)}
                className="px-5 py-2.5 rounded-xl border border-outline-variant text-secondary font-bold hover:bg-surface-container-low cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={editarEmpresa.isPending}
                className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-bold hover:bg-primary/90 disabled:opacity-50 cursor-pointer active:scale-95 transition-all"
              >
                {editarEmpresa.isPending ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Cadastro e edição de comprador */}
      <Modal
        aberto={!!modalComprador}
        titulo={
          modalComprador?.editando ? 'Editar comprador' : 'Adicionar comprador'
        }
        descricao={`Vinculado a ${nomeEmpresa}.`}
        aoFechar={() => !salvandoComprador && setModalComprador(null)}
      >
        {modalComprador && (
          <form onSubmit={salvarComprador} className="space-y-4 font-body">
            <div>
              <label className={rotuloClasse}>Nome do negociador</label>
              <input
                type="text"
                required
                autoFocus
                value={modalComprador.form.nome}
                onChange={mudarComprador('nome')}
                placeholder="Ex: Marcos Andrade"
                className={campoClasse}
              />
            </div>

            <div>
              <label className={rotuloClasse}>E-mail</label>
              <input
                type="email"
                required
                value={modalComprador.form.email}
                onChange={mudarComprador('email')}
                placeholder="marcos@trading.com.br"
                className={campoClasse}
              />
            </div>

            <div>
              <label className={rotuloClasse}>WhatsApp</label>
              <input
                type="text"
                required
                value={modalComprador.form.telefone}
                onChange={mudarComprador('telefone')}
                placeholder="(66) 99988-7766"
                className={campoClasse}
              />
              <p className="text-xs text-secondary mt-1.5">
                É por aqui que as ofertas chegam até ele.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={salvandoComprador}
                onClick={() => setModalComprador(null)}
                className="px-5 py-2.5 rounded-xl border border-outline-variant text-secondary font-bold hover:bg-surface-container-low cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvandoComprador}
                className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-bold hover:bg-primary/90 disabled:opacity-50 cursor-pointer active:scale-95 transition-all"
              >
                {salvandoComprador
                  ? 'Salvando...'
                  : modalComprador.editando
                  ? 'Salvar alterações'
                  : 'Salvar comprador'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}