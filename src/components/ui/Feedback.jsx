import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'

/**
 * Substitui alert() e window.confirm() em todo o app.
 *
 *   const toast = useToast()
 *   toast.sucesso('Fazenda cadastrada')
 *   toast.erro(err.message)
 *
 *   const confirmar = useConfirm()
 *   if (await confirmar({ titulo: 'Excluir fazenda?', perigo: true })) { ... }
 */

const ContextoFeedback = createContext(null)

export function useToast() {
  const ctx = useContext(ContextoFeedback)
  if (!ctx) throw new Error('useToast precisa estar dentro de <FeedbackProvider>')
  return ctx.toast
}

export function useConfirm() {
  const ctx = useContext(ContextoFeedback)
  if (!ctx) throw new Error('useConfirm precisa estar dentro de <FeedbackProvider>')
  return ctx.confirmar
}

const ESTILOS_TOAST = {
  sucesso: { icone: 'check_circle', classes: 'bg-primary text-on-primary' },
  erro: { icone: 'error', classes: 'bg-error text-on-error' },
  aviso: { icone: 'warning', classes: 'bg-tertiary text-on-tertiary' },
  info: { icone: 'info', classes: 'bg-inverse-surface text-inverse-on-surface' },
}

export function FeedbackProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const [dialogo, setDialogo] = useState(null)
  const resolverRef = useRef(null)
  const proximoId = useRef(0)

  const removerToast = useCallback((id) => {
    setToasts((atuais) => atuais.filter((t) => t.id !== id))
  }, [])

  const adicionarToast = useCallback(
    (tipo, mensagem, duracao = 4000) => {
      if (!mensagem) return
      const id = proximoId.current++
      setToasts((atuais) => [...atuais, { id, tipo, mensagem: String(mensagem) }])
      setTimeout(() => removerToast(id), duracao)
    },
    [removerToast]
  )

  const toast = useRef({
    sucesso: (msg) => adicionarToast('sucesso', msg),
    erro: (msg) => adicionarToast('erro', msg, 6000),
    aviso: (msg) => adicionarToast('aviso', msg),
    info: (msg) => adicionarToast('info', msg),
  }).current

  const confirmar = useCallback((opcoes) => {
    setDialogo({
      titulo: 'Confirmar ação',
      mensagem: '',
      textoConfirmar: 'Confirmar',
      textoCancelar: 'Cancelar',
      perigo: false,
      ...(typeof opcoes === 'string' ? { titulo: opcoes } : opcoes),
    })
    return new Promise((resolve) => {
      resolverRef.current = resolve
    })
  }, [])

  const responder = useCallback((resposta) => {
    setDialogo(null)
    resolverRef.current?.(resposta)
    resolverRef.current = null
  }, [])

  /*
   * Toasts e diálogo saem por portal no <body>. A área de conteúdo carrega a
   * animação de transição entre páginas, que deixa um `transform` aplicado —
   * e ancestral com transform passa a ser o bloco de referência de qualquer
   * `position: fixed`, tirando essas camadas do lugar.
   */
  const camadas = (
    <>
      {/* Pilha de toasts */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none max-w-sm">
        {toasts.map((t) => {
          const estilo = ESTILOS_TOAST[t.tipo] || ESTILOS_TOAST.info
          return (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg animate-fade-in font-body text-sm ${estilo.classes}`}
            >
              <span className="material-symbols-outlined text-xl shrink-0">
                {estilo.icone}
              </span>
              <p className="flex-1 whitespace-pre-line leading-snug">{t.mensagem}</p>
              <button
                onClick={() => removerToast(t.id)}
                aria-label="Fechar aviso"
                className="shrink-0 opacity-70 hover:opacity-100 cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
          )
        })}
      </div>

      {/* Diálogo de confirmação */}
      {dialogo && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4"
          onClick={() => responder(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/30 p-6 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4 mb-4">
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
                  dialogo.perigo
                    ? 'bg-error-container text-on-error-container'
                    : 'bg-primary-container/40 text-primary'
                }`}
              >
                <span className="material-symbols-outlined">
                  {dialogo.perigo ? 'delete' : 'help'}
                </span>
              </div>
              <div className="flex-1 pt-1">
                <h3 className="font-headline text-lg font-semibold text-on-surface">
                  {dialogo.titulo}
                </h3>
                {dialogo.mensagem && (
                  <p className="font-body text-sm text-on-surface-variant mt-1 leading-relaxed">
                    {dialogo.mensagem}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => responder(false)}
                className="px-5 py-2.5 rounded-xl font-body font-semibold text-sm text-on-surface-variant hover:bg-surface-variant/50 transition-colors cursor-pointer"
              >
                {dialogo.textoCancelar}
              </button>
              <button
                autoFocus
                onClick={() => responder(true)}
                className={`px-5 py-2.5 rounded-xl font-body font-bold text-sm shadow-sm transition-colors cursor-pointer active:scale-95 ${
                  dialogo.perigo
                    ? 'bg-error text-on-error hover:bg-error/90'
                    : 'bg-primary text-on-primary hover:bg-primary/90'
                }`}
              >
                {dialogo.textoConfirmar}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )

  return (
    <ContextoFeedback.Provider value={{ toast, confirmar }}>
      {children}
      {createPortal(camadas, document.body)}
    </ContextoFeedback.Provider>
  )
}