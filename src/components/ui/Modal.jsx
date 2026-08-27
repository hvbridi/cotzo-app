import { useEffect } from 'react'
import { createPortal } from 'react-dom'

/**
 * Casca de modal reutilizável. Cuida do overlay, do fechar com Esc,
 * do clique fora e do scroll interno quando o formulário é longo.
 *
 *   <Modal aberto={x} titulo="Novo produtor" aoFechar={() => setX(false)}>
 *     <form>...</form>
 *   </Modal>
 *
 * O conteúdo é enviado para o <body> por portal. Motivo: a área de conteúdo
 * usa a animação de transição entre páginas, que deixa um `transform`
 * aplicado no elemento. Qualquer ancestral com transform vira o bloco de
 * referência dos descendentes `position: fixed` — sem o portal, o modal
 * centralizaria na área de conteúdo em vez da tela inteira.
 */
export default function Modal({
  aberto,
  titulo,
  descricao,
  aoFechar,
  largura = 'max-w-lg',
  children,
}) {
  useEffect(() => {
    if (!aberto) return
    const aoTeclar = (e) => e.key === 'Escape' && aoFechar?.()
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [aberto, aoFechar])

  if (!aberto) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={aoFechar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${largura} max-h-[90vh] flex flex-col bg-surface-bright rounded-2xl shadow-xl border border-outline-variant/30 animate-fade-in`}
      >
        <div className="flex items-start justify-between gap-4 p-6 pb-4 border-b border-outline-variant/20 shrink-0">
          <div>
            <h3 className="text-xl font-headline font-bold text-on-surface">{titulo}</h3>
            {descricao && (
              <p className="font-body text-sm text-on-surface-variant mt-1">
                {descricao}
              </p>
            )}
          </div>
          <button
            onClick={aoFechar}
            aria-label="Fechar"
            className="text-secondary hover:text-on-surface cursor-pointer p-1 -mr-1 rounded-full hover:bg-surface-variant/50 shrink-0"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>,
    document.body
  )
}

/** Classes padronizadas dos campos, para os formulários ficarem idênticos entre telas */
export const campoClasse =
  'w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-sm text-on-surface placeholder:text-secondary focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all disabled:opacity-50'

export const rotuloClasse =
  'block text-xs font-bold uppercase tracking-wide text-secondary mb-1'