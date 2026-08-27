import { useState, useEffect, useRef, useCallback } from 'react'

const PREFIXO = 'rascunho:'

/**
 * Guarda o formulário no navegador enquanto o usuário digita.
 *
 * Motivo: o token expira em 60 minutos e o backend não tem refresh. Sem isso,
 * preencher o Novo Fechamento com calma e clicar em emitir depois do prazo
 * significa tomar 401, cair no login e perder tudo que foi digitado.
 *
 *   const [form, setForm, limparRascunho, recuperado] =
 *     useRascunho('contrato', CONTRATO_VAZIO)
 */
/**
 * Campos preenchidos sozinhos pelo sistema (data de hoje, usuário logado) não
 * contam como conteúdo — senão o rascunho nasceria "sujo" e o aviso apareceria
 * mesmo sem o usuário ter digitado nada.
 */
function temConteudo(valor, inicial, ignorar) {
  return Object.keys({ ...inicial, ...valor }).some((campo) => {
    if (ignorar.includes(campo)) return false
    const atual = valor?.[campo]
    const base = inicial?.[campo]
    // '' , null e undefined são todos "vazio"
    const vazioAtual = atual === '' || atual === null || atual === undefined
    const vazioBase = base === '' || base === null || base === undefined
    if (vazioAtual && vazioBase) return false
    return JSON.stringify(atual) !== JSON.stringify(base)
  })
}

export function useRascunho(chave, valorInicial, { atraso = 600, ignorar = [] } = {}) {
  const chaveCompleta = PREFIXO + chave
  const inicialRef = useRef(valorInicial)
  const ignorarRef = useRef(ignorar)

  // Lê o rascunho uma única vez, já decidindo se ele tem algo aproveitável
  const [{ inicial, achouRascunho }] = useState(() => {
    try {
      const salvo = localStorage.getItem(chaveCompleta)
      if (salvo) {
        const mesclado = { ...valorInicial, ...JSON.parse(salvo) }
        if (temConteudo(mesclado, valorInicial, ignorar)) {
          return { inicial: mesclado, achouRascunho: true }
        }
        // Rascunho só com campos automáticos: não serve para nada
        localStorage.removeItem(chaveCompleta)
      }
    } catch {
      // rascunho corrompido: começa do zero
    }
    return { inicial: valorInicial, achouRascunho: false }
  })

  const [valor, setValor] = useState(inicial)
  const [recuperado, setRecuperado] = useState(achouRascunho)

  // Grava com atraso para não escrever no disco a cada tecla
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (temConteudo(valor, inicialRef.current, ignorarRef.current)) {
          localStorage.setItem(chaveCompleta, JSON.stringify(valor))
        } else {
          localStorage.removeItem(chaveCompleta)
        }
      } catch {
        // cota cheia ou modo privado: seguir sem rascunho é melhor que quebrar
      }
    }, atraso)

    return () => clearTimeout(timer)
  }, [valor, chaveCompleta, atraso])

  const limparRascunho = useCallback(() => {
    try {
      localStorage.removeItem(chaveCompleta)
    } catch {
      // ignorado
    }
    setValor(inicialRef.current)
    setRecuperado(false)
  }, [chaveCompleta])

  const descartarAviso = useCallback(() => setRecuperado(false), [])

  return [valor, setValor, limparRascunho, recuperado, descartarAviso]
}

/** Apaga todos os rascunhos. Usado no logout, para não vazar dados entre usuários. */
export function limparTodosRascunhos() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIXO))
      .forEach((k) => localStorage.removeItem(k))
  } catch {
    // ignorado
  }
}

/** Faixa que aparece quando um rascunho foi recuperado */
export function AvisoRascunho({ aoDescartar, aoLimpar }) {
  return (
    <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-tertiary-container/30 border border-tertiary/30">
      <span className="material-symbols-outlined text-on-tertiary-container">
        history
      </span>
      <p className="flex-1 text-sm text-on-tertiary-container font-body min-w-[200px]">
        Recuperamos o que você estava preenchendo antes de sair.
      </p>
      <div className="flex gap-2 shrink-0">
        <button
          type="button"
          onClick={aoLimpar}
          className="px-4 py-2 rounded-lg text-sm font-bold text-on-tertiary-container hover:bg-tertiary-container/40 cursor-pointer"
        >
          Começar do zero
        </button>
        <button
          type="button"
          onClick={aoDescartar}
          className="px-4 py-2 rounded-lg text-sm font-bold bg-tertiary text-on-tertiary hover:opacity-90 cursor-pointer"
        >
          Continuar
        </button>
      </div>
    </div>
  )
}