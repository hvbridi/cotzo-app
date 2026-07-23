import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    // Agora vai direto para o Dashboard do Stitch!
    navigate('/dashboard')
  }

  return (
    <div className="bg-background min-h-screen h-screen relative flex items-center justify-center p-4 sm:p-8 antialiased overflow-hidden">
      {/* Full Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          alt="Agricultural background"
          className="w-full h-full object-cover"
          src="https://lh3.googleusercontent.com/aida/AP1WRLuuBE4t7RWwfhLCdzKy58w1x6NjDxexb-wolKohqt5gVfFqDCqm_Xh0FRl8kTl8-P2m48CIbbpclQQUpGg6aVHsp6geKzeBM6L-iFoppZMszWYIToIwqe77xS3sBcODz26H0110WqvkLT4FE2Fml3dfBEtoj79CrAwdFexHjpJ122gNZdW9e-G2Zbkby3yFHjg_rRoIHDQEw3oHwiGc1bHpSYxHiBT9_BFHYayjbQut_CcSuyPhsqRCdCM"
        />
        <div className="absolute inset-0 bg-on-surface/60 mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-on-surface/80"></div>
      </div>

      {/* Centered Login Card */}
      <div className="relative z-10 w-full max-w-lg glass-card rounded-2xl strong-shadow p-8 sm:p-12">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center gap-3 mb-4">
            <span
              className="material-symbols-outlined text-primary text-4xl sm:text-5xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              eco
            </span>
            <span className="font-headline text-3xl sm:text-4xl font-bold text-primary tracking-tight">
              Terra Nova
            </span>
          </div>
          <h1 className="font-headline text-3xl sm:text-4xl font-semibold text-on-surface mt-2">
            Acesso ao Sistema
          </h1>
          <p className="font-body text-lg font-medium text-primary mt-2">
            Portal de Corretagem
          </p>
          <p className="font-body text-on-surface-variant mt-4 text-base leading-relaxed px-4">
            Soluções financeiras e estratégicas para o agronegócio, conectando a
            terra ao capital com segurança e transparência.
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label
              className="block font-body text-sm font-medium text-on-surface mb-2"
              htmlFor="email"
            >
              E-mail corporativo
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-outline text-xl">
                  person
                </span>
              </div>
              <input
                className="w-full pl-12 pr-4 py-4 bg-white/60 border border-outline-variant/50 rounded-xl font-body text-base text-on-surface placeholder-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm focus:bg-white"
                id="email"
                name="email"
                placeholder="seu.nome@terranova.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label
              className="block font-body text-sm font-medium text-on-surface mb-2"
              htmlFor="password"
            >
              Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-outline text-xl">
                  lock
                </span>
              </div>
              <input
                className="w-full pl-12 pr-12 py-4 bg-white/60 border border-outline-variant/50 rounded-xl font-body text-base text-on-surface placeholder-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm focus:bg-white"
                id="password"
                name="password"
                placeholder="••••••••"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-outline hover:text-primary transition-colors focus:outline-none"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                <span className="material-symbols-outlined text-xl">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center">
              <input
                className="h-5 w-5 rounded border-outline-variant text-primary focus:ring-primary bg-white/60 cursor-pointer"
                id="remember-me"
                name="remember-me"
                type="checkbox"
              />
              <label
                className="ml-3 block font-body text-sm text-on-surface font-medium cursor-pointer"
                htmlFor="remember-me"
              >
                Lembrar-me
              </label>
            </div>
            <div className="text-sm">
              <a
                className="font-body font-semibold text-primary hover:text-on-primary-fixed-variant transition-colors"
                href="#"
              >
                Esqueci minha senha
              </a>
            </div>
          </div>

          <div className="pt-2">
            <button
              className="w-full flex justify-center py-4 px-6 border border-transparent rounded-xl shadow-md font-body text-lg font-bold text-on-primary bg-primary hover:bg-on-primary-fixed-variant focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 cursor-pointer"
              type="submit"
            >
              Entrar
            </button>
          </div>
        </form>

        <div className="mt-8 text-center text-sm text-on-surface-variant font-medium">
          <p className="font-body">
            Precisa de ajuda?{' '}
            <a
              className="font-semibold text-primary hover:text-on-primary-fixed-variant transition-colors"
              href="#"
            >
              Contate o suporte interno
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  )
}