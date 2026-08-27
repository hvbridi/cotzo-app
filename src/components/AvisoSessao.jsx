import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { lerTokenLocal } from '../services/api'
import { limparTodosRascunhos } from '../hooks/useRascunho'

/**
 * O token dura 60 minutos e o backend não tem refresh. Sem aviso, o usuário
 * descobre que a sessão caiu ao clicar em salvar — e leva um redirecionamento
 * seco para o login.
 *
 * Aqui a expiração vira algo previsível: faixa de aviso nos últimos minutos e
 * uma tela explicativa quando acaba. Os rascunhos ficam salvos.
 */

const AVISO_ANTES_MS = 5 * 60 * 1000
const INTERVALO_MS = 20 * 1000

function formatarRestante(ms) {
  const totalSegundos = Math.max(0, Math.floor(ms / 1000))
  const minutos = Math.floor(totalSegundos / 60)
  const segundos = totalSegundos % 60
  if (minutos > 0) return `${minutos} min`
  return `${segundos} s`
}

export default function AvisoSessao() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [restante, setRestante] = useState(null)

  useEffect(() => {
    const verificar = () => {
      const payload = lerTokenLocal()
      if (!payload?.exp) {
        setRestante(null)
        return
      }
      setRestante(payload.exp * 1000 - Date.now())
    }

    verificar()
    const timer = setInterval(verificar, INTERVALO_MS)
    return () => clearInterval(timer)
  }, [])

  const sair = () => {
    localStorage.removeItem('token')
    queryClient.clear()
    // Os rascunhos NÃO são apagados aqui: a sessão caiu sozinha e o
    // trabalho em andamento deve sobreviver ao novo login.
    navigate('/', { replace: true })
  }

  if (restante === null) return null

  // ---------- Sessão expirada ----------
  if (restante <= 0) {
    // Portal pelo mesmo motivo do Modal: a página tem transform da animação
    return createPortal(
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4">
        <div
          role="alertdialog"
          aria-modal="true"
          className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/30 p-6 animate-fade-in"
        >
          <div className="flex items-start gap-4 mb-4">
            <div className="w-11 h-11 rounded-full bg-tertiary-container/50 text-on-tertiary-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined">schedule</span>
            </div>
            <div className="pt-1">
              <h3 className="font-headline text-lg font-semibold text-on-surface">
                Sua sessão expirou
              </h3>
              <p className="font-body text-sm text-on-surface-variant mt-1 leading-relaxed">
                Por segurança, o acesso vale por 60 minutos. O que você estava
                preenchendo ficou salvo e volta ao entrar de novo.
              </p>
            </div>
          </div>

          <button
            onClick={sair}
            autoFocus
            className="w-full py-3 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-sm hover:bg-primary/90 transition-colors cursor-pointer active:scale-95"
          >
            Entrar novamente
          </button>
        </div>
      </div>,
      document.body
    )
  }

  // ---------- Faixa de aviso ----------
  if (restante <= AVISO_ANTES_MS) {
    return (
      <div className="shrink-0 flex flex-wrap items-center gap-3 px-4 md:px-8 py-2.5 bg-tertiary-container/40 border-b border-tertiary/30">
        <span className="material-symbols-outlined text-on-tertiary-container text-[20px]">
          schedule
        </span>
        <p className="flex-1 text-sm font-body text-on-tertiary-container min-w-[200px]">
          Sua sessão expira em <strong>{formatarRestante(restante)}</strong>. Salve o
          que estiver fazendo — formulários em andamento são guardados
          automaticamente.
        </p>
        <button
          onClick={sair}
          className="px-4 py-1.5 rounded-lg text-sm font-bold bg-tertiary text-on-tertiary hover:opacity-90 cursor-pointer shrink-0"
        >
          Entrar de novo agora
        </button>
      </div>
    )
  }

  return null
}