import { useState, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  useContratosEnriquecidos,
  useProdutores,
  useEmpresas,
  useEditarContrato,
  useExcluirContrato,
  usePerfil,
} from '../services/queries'
import {
  formatarData,
  formatarMoeda,
  formatarNumero,
  formatarCpfCnpj,
  formatarTelefone,
  classesStatus,
} from '../utils/formatters'
import { EstadoErro, EstadoVazio, SkeletonCards } from '../components/ui/PageState'
import Modal, { campoClasse, rotuloClasse } from '../components/ui/Modal'
import { useToast, useConfirm } from '../components/ui/Feedback'

const STATUS = ['Fechado', 'Emitido', 'Concluído', 'Cancelado']

function Cartao({ icone, titulo, children }) {
  return (
    <div className="bg-surface-bright rounded-2xl p-6 border border-outline-variant/20 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-primary-container/40 flex items-center justify-center text-primary shrink-0">
          <span className="material-symbols-outlined">{icone}</span>
        </div>
        <h2 className="font-headline text-xl font-bold text-on-surface">{titulo}</h2>
      </div>
      {children}
    </div>
  )
}

function Linha({ rotulo, valor, destaque, mono }) {
  return (
    <div>
      <span className="text-xs font-bold text-secondary uppercase tracking-wider block mb-1">
        {rotulo}
      </span>
      <span
        className={`block ${mono ? 'font-mono' : ''} ${
          destaque
            ? 'text-lg font-bold text-on-surface font-headline'
            : 'text-base text-on-surface'
        }`}
      >
        {valor || '—'}
      </span>
    </div>
  )
}

export default function DetalhesContrato() {
  const navigate = useNavigate()
  const toast = useToast()
  const confirmar = useConfirm()
  const [searchParams] = useSearchParams()
  const contratoId = searchParams.get('id')

  const [modalAberto, setModalAberto] = useState(false)
  const [form, setForm] = useState(null)

  const { ehAdmin } = usePerfil()
  const { data: contratos = [], isLoading, error, refetch } = useContratosEnriquecidos()
  const { data: produtores = [] } = useProdutores()
  const { data: empresas = [] } = useEmpresas()

  const contrato = useMemo(
    () => contratos.find((c) => String(c.id) === String(contratoId)),
    [contratos, contratoId]
  )

  const produtor = produtores.find((p) => p.id === contrato?.produtor_id)
  const empresa = empresas.find((e) => e.id === contrato?.empresa_id)

  const editar = useEditarContrato({
    onSuccess: () => {
      toast.sucesso('Contrato atualizado.')
      setModalAberto(false)
    },
    onError: (err) => toast.erro(err.message),
  })

  const excluir = useExcluirContrato({
    onSuccess: () => {
      toast.sucesso('Contrato cancelado.')
      navigate('/relatorios')
    },
    onError: (err) => toast.erro(err.message),
  })

  const abrirEdicao = () => {
    setForm({
      status: contrato.status || 'Fechado',
      numero_contrato_trading: contrato.numero_contrato_trading || '',
      data_entrega: contrato.data_entrega || '',
      data_pagamento: contrato.data_pagamento || '',
      observacoes: contrato.observacoes || '',
    })
    setModalAberto(true)
  }

  const salvar = (e) => {
    e.preventDefault()
    editar.mutate({
      id: contrato.id,
      status: form.status,
      numero_contrato_trading: form.numero_contrato_trading.trim() || null,
      data_entrega: form.data_entrega || null,
      data_pagamento: form.data_pagamento || null,
      observacoes: form.observacoes.trim() || null,
    })
  }

  const removerContrato = async () => {
    const confirmado = await confirmar({
      titulo: `Cancelar o contrato #${contrato.id}?`,
      mensagem:
        'Ele sai dos relatórios e do dashboard, mas o registro é preservado no banco.',
      textoConfirmar: 'Cancelar contrato',
      perigo: true,
    })
    if (confirmado) excluir.mutate(contrato.id)
  }

  if (isLoading) return <SkeletonCards quantidade={4} />

  if (error) {
    return <EstadoErro mensagem={error.message} onTentarNovamente={refetch} />
  }

  if (!contrato) {
    return (
      <EstadoVazio
        icone="description"
        titulo="Contrato não encontrado"
        descricao={
          contratoId
            ? `Nenhum contrato com o ID #${contratoId}. Ele pode ter sido cancelado.`
            : 'Nenhum ID de contrato foi informado no endereço.'
        }
        acao={
          <Link
            to="/relatorios"
            className="inline-flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:bg-primary/90 transition-colors cursor-pointer active:scale-95"
          >
            Voltar para relatórios
          </Link>
        }
      />
    )
  }

  const unidade = contrato.tipo_medida || 'saca'

  return (
    <div className="space-y-8 pb-12">
      <Link
        to="/relatorios"
        className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:opacity-80 transition-opacity w-fit"
      >
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        Voltar para relatórios
      </Link>

      {/* Cabeçalho */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-outline-variant/20 pb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <h1 className="font-headline text-4xl font-bold text-on-surface">
            Contrato #{contrato.id}
          </h1>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${classesStatus(
              contrato.status
            )}`}
          >
            {contrato.status || 'Fechado'}
          </span>
          {contrato.numero_contrato_trading && (
            <span className="text-sm text-secondary font-mono">
              Nº trading: {contrato.numero_contrato_trading}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={abrirEdicao}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-sm hover:bg-primary/90 transition-colors cursor-pointer active:scale-95"
          >
            <span className="material-symbols-outlined text-base">edit</span>
            Atualizar
          </button>
          {ehAdmin && (
            <button
              onClick={removerContrato}
              disabled={excluir.isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-error/40 text-error font-bold text-sm hover:bg-error-container/40 transition-colors cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-base">delete</span>
              Cancelar
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Valores */}
        <Cartao icone="payments" titulo="Valores e condições">
          <div className="mb-5">
            <span className="text-3xl font-bold font-headline text-primary">
              {formatarMoeda(contrato.preco_unitario, contrato.moeda)}
            </span>
            <span className="text-secondary text-sm ml-1">/ {unidade}</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Linha
              rotulo="Commodity"
              valor={`${contrato.commodity} (${contrato.safra})`}
              destaque
            />
            <Linha
              rotulo="Volume"
              valor={`${formatarNumero(contrato.volume)} ${unidade}`}
              destaque
              mono
            />
          </div>
        </Cartao>

        {/* Partes */}
        <Cartao icone="person" titulo="Partes envolvidas">
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold text-secondary uppercase tracking-wider block mb-1">
                Produtor vendedor
              </span>
              <span className="text-base font-bold text-on-surface block">
                {contrato.produtor_nome}
              </span>
              <span className="text-sm text-secondary block">
                CPF/CNPJ: {formatarCpfCnpj(produtor?.cpf_cnpj)}
              </span>
              <span className="text-sm text-secondary block">
                WhatsApp:{' '}
                {produtor?.whatsapp ? formatarTelefone(produtor.whatsapp) : '—'}
              </span>
            </div>

            <div>
              <span className="text-xs font-bold text-secondary uppercase tracking-wider block mb-1">
                Empresa compradora
              </span>
              <span className="text-base font-bold text-on-surface block">
                {contrato.empresa_nome}
              </span>
              {empresa?.cnpj && (
                <span className="text-sm text-secondary block">
                  CNPJ: {formatarCpfCnpj(empresa.cnpj)}
                </span>
              )}
            </div>

            <Linha rotulo="Fazenda de origem" valor={contrato.fazenda_nome} />
          </div>
        </Cartao>

        {/* Logística */}
        <Cartao icone="local_shipping" titulo="Logística e prazos">
          <div className="grid grid-cols-2 gap-4">
            <Linha rotulo="Frete" valor={contrato.tipo_frete || 'FOB Fazenda'} />
            <Linha
              rotulo="Fechamento"
              valor={formatarData(contrato.data_fechamento)}
              mono
            />
            <Linha rotulo="Entrega" valor={formatarData(contrato.data_entrega)} mono />
            <Linha
              rotulo="Pagamento"
              valor={formatarData(contrato.data_pagamento)}
              mono
            />
          </div>
          {contrato.observacoes && (
            <div className="mt-5 pt-4 border-t border-outline-variant/20">
              <span className="text-xs font-bold text-secondary uppercase tracking-wider block mb-1">
                Observações
              </span>
              <p className="text-sm text-on-surface leading-relaxed whitespace-pre-line">
                {contrato.observacoes}
              </p>
            </div>
          )}
        </Cartao>

        {/* Financeiro */}
        <Cartao icone="analytics" titulo="Resumo financeiro">
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold text-secondary uppercase tracking-wider block mb-1">
                Valor total da operação
              </span>
              <span className="text-2xl font-bold font-headline text-on-surface">
                {formatarMoeda(contrato.valor_total, contrato.moeda)}
              </span>
            </div>
            <div>
              <span className="text-xs font-bold text-secondary uppercase tracking-wider block mb-1">
                Comissão da corretora ({contrato.comissao_porcentagem}%)
              </span>
              <span className="text-2xl font-bold font-headline text-tertiary">
                {formatarMoeda(contrato.valor_comissao, contrato.moeda)}
              </span>
            </div>
            <div className="pt-4 border-t border-outline-variant/20">
              <Linha rotulo="Corretor responsável" valor={contrato.corretor_nome} />
            </div>
          </div>
        </Cartao>
      </div>

      {/* Acompanhamento */}
      <Modal
        aberto={modalAberto && !!form}
        titulo={`Atualizar contrato #${contrato.id}`}
        descricao="Acompanhamento da operação. Valores e volume não mudam aqui."
        aoFechar={() => !editar.isPending && setModalAberto(false)}
      >
        {form && (
          <form onSubmit={salvar} className="space-y-4 font-body">
            <div>
              <label className={rotuloClasse}>Status</label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((atual) => ({ ...atual, status: e.target.value }))
                }
                className={campoClasse}
              >
                {STATUS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={rotuloClasse}>Nº do contrato na trading</label>
              <input
                type="text"
                placeholder="Ex: CG-2026-04871"
                value={form.numero_contrato_trading}
                onChange={(e) =>
                  setForm((atual) => ({
                    ...atual,
                    numero_contrato_trading: e.target.value,
                  }))
                }
                className={`${campoClasse} font-mono`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={rotuloClasse}>Data de entrega</label>
                <input
                  type="date"
                  value={form.data_entrega}
                  onChange={(e) =>
                    setForm((atual) => ({ ...atual, data_entrega: e.target.value }))
                  }
                  className={campoClasse}
                />
              </div>
              <div>
                <label className={rotuloClasse}>Data de pagamento</label>
                <input
                  type="date"
                  value={form.data_pagamento}
                  onChange={(e) =>
                    setForm((atual) => ({ ...atual, data_pagamento: e.target.value }))
                  }
                  className={campoClasse}
                />
              </div>
            </div>

            <div>
              <label className={rotuloClasse}>Observações</label>
              <textarea
                rows={3}
                placeholder="Anotações sobre a operação, pendências, combinados..."
                value={form.observacoes}
                onChange={(e) =>
                  setForm((atual) => ({ ...atual, observacoes: e.target.value }))
                }
                className={`${campoClasse} resize-y leading-relaxed`}
              />
            </div>

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