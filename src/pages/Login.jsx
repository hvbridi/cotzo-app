import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')

  const handleLogin = (e) => {
    e.preventDefault()
    navigate('/dashboard')
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-surface animate-fade-in">
      {/* Background Image agrícola em alta definição com Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-500"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1920&auto=format&fit=crop')`
        }}
      >
        <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"></div>
      </div>

      {/* Modal / Card de Login */}
      <div className="relative z-10 w-full max-w-md p-8 bg-surface-bright/95 dark:bg-surface-dim/95 backdrop-blur-md rounded-2xl shadow-2xl border border-outline-variant/30 text-on-surface mx-4">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-2 mb-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-on-primary text-2xl">
                eco
              </span>
            </div>
            <h1 className="font-headline text-2xl font-bold text-on-surface tracking-tight">
              Terra Nova
            </h1>
          </div>
          <h2 className="font-headline text-xl font-bold text-on-surface">
            Acesso ao Sistema
          </h2>
          <p className="text-xs font-semibold text-primary uppercase tracking-wider mt-1">
            Portal de Corretagem
          </p>
          <p className="text-sm text-on-surface-variant mt-3 leading-relaxed">
            Soluções financeiras e estratégicas para o agronegócio, conectando a terra ao capital com segurança e transparência.
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleLogin} className="space-y-5 font-body">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              E-mail corporativo
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                person
              </span>
              <input
                type="email"
                required
                placeholder="seu.nome@terranova.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl py-3 pl-10 pr-4 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              Senha
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                lock
              </span>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl py-3 pl-10 pr-4 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">
                  visibility
                </span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-body pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none text-on-surface-variant">
              <input
                type="checkbox"
                className="w-4 h-4 rounded text-primary accent-primary focus:ring-primary border-outline-variant"
              />
              Lembrar-me
            </label>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                alert('Solicitação de redefinição enviada ao suporte!')
              }}
              className="text-primary font-semibold hover:underline"
            >
              Esqueci minha senha
            </a>
          </div>

          <button
            type="submit"
            className="w-full bg-primary hover:bg-surface-tint text-on-primary font-bold py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all transform active:scale-[0.98] cursor-pointer mt-2"
          >
            Entrar
          </button>
        </form>

        {/* Rodapé */}
        <p className="text-center text-xs text-on-surface-variant mt-6">
          Precisa de ajuda?{' '}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              alert('Entre em contato com o suporte: suporte@terranova.com.br')
            }}
            className="text-primary font-semibold hover:underline"
          >
            Contate o suporte interno
          </a>
          .
        </p>
      </div>
    </div>
  )
}