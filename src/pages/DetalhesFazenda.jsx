import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  useFazendas,
  useProdutores,
  useEditarFazenda,
  useExcluirFazenda,
  usePerfil,
} from '../services/queries'
import { formatarTelefone, formatarNumero } from '../utils/formatters'
import { EstadoErro, EstadoVazio, SkeletonCards } from '../components/ui/PageState'
import Modal from '../components/ui/Modal'
import FormularioFazenda, {
  montarPayloadFazenda,
  fazendaParaForm,
} from '../components/FormularioFazenda'
import { useToast, useConfirm } from '../components/ui/Feedback'

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

function Metrica({ rotulo, valor, destaque }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-label uppercase tracking-wider text-secondary">
        {rotulo}
      </span>
      <span
        className={`text-lg font-bold font-headline ${
          destaque ? 'text-primary' : 'text-on-surface'
        }`}
      >
        {valor}
      </span>
    </div>
  )
}

export default function DetalhesFazenda() {
  const navigate = useNavigate()
  const toast = useToast()
  const confirmar = useConfirm()
  const [searchParams] = useSearchParams()
  const fazendaId = searchParams.get('id')

  const [modalAberto, setModalAberto] = useState(false)
  const [form, setForm] = useState(null)

  const { ehAdmin } = usePerfil()
  const { data: fazendas = [], isLoading, error, refetch } = useFazendas()
  const { data: produtores = [] } = useProdutores()

  // Antes esta tela varria produtor por produtor até achar a fazenda.
  // Agora é uma busca na lista que já está em cache.
  const fazenda = useMemo(
    () => fazendas.find((f) => String(f.id) === String(fazendaId)),
    [fazendas, fazendaId]
  )

  const editar = useEditarFazenda({
    onSuccess: () => {
      toast.sucesso('Fazenda atualizada.')
      setModalAberto(false)
    },
    onError: (err) => toast.erro(err.message),
  })

  const excluir = useExcluirFazenda({
    onSuccess: () => {
      toast.sucesso('Fazenda removida.')
      navigate('/fazendas')
    },
    onError: (err) => toast.erro(err.message),
  })

  const abrirEdicao = () => {
    setForm(fazendaParaForm(fazenda))
    setModalAberto(true)
  }

  const salvarEdicao = (e) => {
    e.preventDefault()
    editar.mutate({ id: fazenda.id, ...montarPayloadFazenda(form) })
  }

  const removerFazenda = async () => {
    const confirmado = await confirmar({
      titulo: `Excluir ${fazenda.nome}?`,
      mensagem:
        'A fazenda deixa de aparecer em novos fechamentos, mas os contratos já registrados são preservados.',
      textoConfirmar: 'Excluir',
      perigo: true,
    })
    if (confirmado) excluir.mutate(fazenda.id)
  }

  if (isLoading) return <SkeletonCards quantidade={3} />

  if (error) {
    return <EstadoErro mensagem={error.message} onTentarNovamente={refetch} />
  }

  if (!fazenda) {
    return (
      <EstadoVazio
        icone="map"
        titulo="Fazenda não encontrada"
        descricao={
          fazendaId
            ? `Nenhuma fazenda com o ID #${fazendaId}. Ela pode ter sido excluída.`
            : 'Nenhum ID de fazenda foi informado no endereço.'
        }
        acao={
          <button
            onClick={() => navigate('/fazendas')}
            className="inline-flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:bg-primary/90 transition-colors cursor-pointer active:scale-95"
          >
            Voltar para fazendas
          </button>
        }
      />
    )
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/fazendas')}
            className="flex items-center gap-2 text-sm font-label text-primary hover:opacity-80 transition-opacity cursor-pointer mb-2"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Voltar para a lista
          </button>
          <h1 className="text-3xl font-headline font-bold text-on-surface">
            {fazenda.nome}
          </h1>
          <p className="text-secondary mt-1">
            Produtor: <span className="font-semibold">{fazenda.produtor_nome}</span>
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={abrirEdicao}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-sm hover:bg-primary/90 transition-colors cursor-pointer active:scale-95"
          >
            <span className="material-symbols-outlined text-base">edit</span>
            Editar
          </button>

          {/* Só admin exclui — o backend devolve 403 para os demais cargos */}
          {ehAdmin && (
            <button
              onClick={removerFazenda}
              disabled={excluir.isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-error/40 text-error font-bold text-sm hover:bg-error-container/40 transition-colors cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-base">delete</span>
              Excluir
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cadastro */}
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/20 flex flex-col gap-6">
          <h2 className="text-lg font-headline font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">landscape</span>
            Dados cadastrais
          </h2>
          <div className="flex flex-col gap-4">
            <Campo rotulo="Produtor proprietário" valor={fazenda.produtor_nome} />
            <Campo rotulo="Município" valor={fazenda.municipio} />
            <Campo rotulo="Inscrição estadual" valor={fazenda.inscricao_estadual} mono />
            <Campo
              rotulo="Telefone da sede"
              valor={fazenda.telefone ? formatarTelefone(fazenda.telefone) : null}
              mono
            />
          </div>
        </div>

        {/* Logística */}
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/20 flex flex-col gap-6">
          <h2 className="text-lg font-headline font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">local_shipping</span>
            Logística
          </h2>
          <div className="flex flex-col gap-4">
            <Metrica
              rotulo="Condição de frete"
              valor={fazenda.condicao_frete || 'FOB Fazenda'}
              destaque
            />
            <Metrica
              rotulo="Capacidade de carregamento"
              valor={
                fazenda.capacidade_carregamento
                  ? `${formatarNumero(fazenda.capacidade_carregamento)} ton/dia`
                  : 'Não informada'
              }
            />
            <Metrica
              rotulo="Balança"
              valor={
                fazenda.comprimento_balanca
                  ? `${fazenda.comprimento_balanca} metros`
                  : 'Sem balança'
              }
            />
          </div>
        </div>

        {/* Acesso */}
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/20 flex flex-col gap-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-headline font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">explore</span>
              Acesso
            </h2>
            {fazenda.coordenadas && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  fazenda.coordenadas
                )}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline shrink-0"
              >
                <span className="material-symbols-outlined text-base">map</span>
                Ver no mapa
              </a>
            )}
          </div>
          <div className="flex flex-col gap-4">
            <Campo rotulo="Coordenadas GPS" valor={fazenda.coordenadas} mono />
            <Campo rotulo="Roteiro até a sede" valor={fazenda.descricao_roteiro} />
          </div>
        </div>
      </div>

      {/* Banner */}
      <div className="w-full rounded-2xl bg-surface-container-low border border-outline-variant/20 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-headline font-bold text-on-surface text-lg">
            Negociar grãos da {fazenda.nome}?
          </h3>
          <p className="text-secondary text-sm mt-1 font-body">
            Registre o contrato de corretagem para esta propriedade.
          </p>
        </div>
        <button
          onClick={() => navigate('/fechamento')}
          className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all cursor-pointer whitespace-nowrap active:scale-95 shrink-0"
        >
          Novo fechamento
        </button>
      </div>

      {/* Edição — mesmo formulário do cadastro */}
      <Modal
        aberto={modalAberto && !!form}
        titulo="Editar fazenda"
        descricao="As alterações valem para novos fechamentos."
        largura="max-w-3xl"
        aoFechar={() => !editar.isPending && setModalAberto(false)}
      >
        {form && (
          <form onSubmit={salvarEdicao} className="space-y-6">
            <FormularioFazenda
              form={form}
              setForm={setForm}
              produtores={produtores}
              semCartao
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={editar.isPending}
                onClick={() => setModalAberto(false)}
                className="px-5 py-2.5 rounded-xl border border-outline-variant text-secondary font-bold hover:bg-surface-container-low cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={editar.isPending}
                className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-bold hover:bg-primary/90 disabled:opacity-50 cursor-pointer active:scale-95 transition-all"
              >
                {editar.isPending ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}