import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../services/api'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setCarregando(true)
    setErro('')

    const formData = new URLSearchParams()
    formData.append('username', email)
    formData.append('password', senha)

    try {
      // Usa a URL base do servidor que está rodando na nuvem
      const resposta = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      })

      if (!resposta.ok) {
        throw new Error('E-mail ou senha incorretos')
      }

      const dados = await resposta.json()
      
      // Salva o Token de Acesso no navegador
      localStorage.setItem('token', dados.access_token)

      navigate('/dashboard')
    } catch (err) {
      setErro('Erro ao conectar com o servidor. Verifique o link da API ou suas credenciais.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-surface animate-fade-in">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1920&auto=format&fit=crop')`
        }}
      >
        <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-md p-8 bg-surface-bright/95 backdrop-blur-md rounded-2xl shadow-2xl border border-outline-variant/30 text-on-surface mx-4">
        <div className="text-center mb-6">
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
        </div>

        {erro && (
          <div className="mb-4 p-3 bg-error-container text-on-error-container text-sm rounded-xl text-center font-medium">
            {erro}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 font-body">
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
                className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl py-3 pl-10 pr-4 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
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
                className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl py-3 pl-10 pr-4 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-primary hover:bg-surface-tint text-on-primary font-bold py-3.5 px-4 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 mt-2"
          >
            {carregando ? 'Autenticando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}