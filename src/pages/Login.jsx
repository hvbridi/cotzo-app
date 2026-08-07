import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../services/api'

export default function Login() {
  const navigate = useNavigate()

  // Controle de Modo: 'login' | 'esqueci' | 'redefinir'
  const [modo, setModo] = useState('login')

  // Estados dos Campos
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [token, setToken] = useState('')
  const [novaSenha, setNovaSenha] = useState('')

  // Estados de Feedback
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [mensagemSucesso, setMensagemSucesso] = useState('')

  // 1. Ação de Login Padrão
  const handleLogin = async (e) => {
    e.preventDefault()
    setCarregando(true)
    setErro('')
    setMensagemSucesso('')

    const formData = new URLSearchParams()
    formData.append('username', email)
    formData.append('password', senha)

    try {
      const resposta = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      })

      if (!resposta.ok) {
        throw new Error('E-mail ou senha incorretos.')
      }

      const dados = await resposta.json()
      localStorage.setItem('token', dados.access_token)
      navigate('/dashboard')
    } catch (err) {
      setErro('Erro ao conectar com o servidor. Verifique suas credenciais.')
    } finally {
      setCarregando(false)
    }
  }

  // 2. Solicitar Código via WhatsApp (POST /esqueci-senha)
  const handleSolicitarToken = async (e) => {
    e.preventDefault()
    setCarregando(true)
    setErro('')
    setMensagemSucesso('')

    try {
      const resposta = await fetch(
        `${API_URL}/esqueci-senha?email=${encodeURIComponent(email)}`,
        { method: 'POST' }
      )

      const dados = await resposta.json()

      if (!resposta.ok) {
        throw new Error(dados.detail || 'Erro ao solicitar código de recuperação.')
      }

      setMensagemSucesso(dados.msg)
      setModo('redefinir')
    } catch (err) {
      setErro(err.message)
    } finally {
      setCarregando(false)
    }
  }

  // 3. Redefinir Senha com Token (POST /redefinir-senha)
  const handleRedefinirSenha = async (e) => {
    e.preventDefault()
    setCarregando(true)
    setErro('')
    setMensagemSucesso('')

    try {
      const resposta = await fetch(`${API_URL}/redefinir-senha`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          nova_senha: novaSenha,
        }),
      })

      const dados = await resposta.json()

      if (!resposta.ok) {
        throw new Error(dados.detail || 'Token inválido ou expirado.')
      }

      alert(dados.msg)
      setModo('login')
      setSenha('')
      setToken('')
      setNovaSenha('')
    } catch (err) {
      setErro(err.message)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-surface animate-fade-in">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1920&auto=format&fit=crop')`,
        }}
      >
        <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"></div>
      </div>

      {/* Card Principal */}
      <div className="relative z-10 w-full max-w-md p-8 bg-surface-bright/95 backdrop-blur-md rounded-2xl shadow-2xl border border-outline-variant/30 text-on-surface mx-4">
        {/* Header */}
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
            {modo === 'login' && 'Acesso ao Sistema'}
            {modo === 'esqueci' && 'Recuperar Senha'}
            {modo === 'redefinir' && 'Cadastrar Nova Senha'}
          </h2>
          <p className="text-xs font-semibold text-primary uppercase tracking-wider mt-1">
            Portal de Corretagem
          </p>
        </div>

        {/* Mensagens de Alerta */}
        {erro && (
          <div className="mb-4 p-3 bg-error-container text-on-error-container text-sm rounded-xl text-center font-medium">
            {erro}
          </div>
        )}

        {mensagemSucesso && (
          <div className="mb-4 p-3 bg-primary-container text-on-primary-container text-sm rounded-xl text-center font-medium">
            {mensagemSucesso}
          </div>
        )}

        {/* MODO 1: LOGIN */}
        {modo === 'login' && (
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
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Senha
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setErro('')
                    setMensagemSucesso('')
                    setModo('esqueci')
                  }}
                  className="text-xs text-primary font-bold hover:underline cursor-pointer"
                >
                  Esqueceu a senha?
                </button>
              </div>
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
        )}

        {/* MODO 2: ESQUECI A SENHA (Solicitar Token no WhatsApp) */}
        {modo === 'esqueci' && (
          <form onSubmit={handleSolicitarToken} className="space-y-4 font-body">
            <p className="text-xs text-secondary text-center mb-2">
              Informe seu e-mail de acesso para enviarmos o código de verificação ao Whatsapp cadastrado.
            </p>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                E-mail corporativo
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                  mail
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

            <button
              type="submit"
              disabled={carregando}
              className="w-full bg-primary hover:bg-surface-tint text-on-primary font-bold py-3.5 px-4 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">chat</span>
              {carregando ? 'Enviando Código...' : 'Enviar Código no WhatsApp'}
            </button>

            <button
              type="button"
              onClick={() => {
                setErro('')
                setMensagemSucesso('')
                setModo('login')
              }}
              className="w-full text-center text-xs font-bold text-secondary hover:text-on-surface cursor-pointer pt-2"
            >
              ← Voltar para o Login
            </button>
          </form>
        )}

        {/* MODO 3: REDEFINIR SENHA (Com Token e Nova Senha) */}
        {modo === 'redefinir' && (
          <form onSubmit={handleRedefinirSenha} className="space-y-4 font-body">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Código do WhatsApp (6 dígitos)
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                  pin
                </span>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="123456"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl py-3 pl-10 pr-4 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary font-mono tracking-widest text-center font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Nova Senha
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                  lock_reset
                </span>
                <input
                  type="password"
                  required
                  placeholder="Mínimo 8 caracteres"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl py-3 pl-10 pr-4 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="w-full bg-primary hover:bg-surface-tint text-on-primary font-bold py-3.5 px-4 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {carregando ? 'Redefinindo...' : 'Cadastrar Nova Senha'}
            </button>

            <button
              type="button"
              onClick={() => {
                setErro('')
                setMensagemSucesso('')
                setModo('login')
              }}
              className="w-full text-center text-xs font-bold text-secondary hover:text-on-surface cursor-pointer pt-2"
            >
              ← Cancelar e voltar ao Login
            </button>
          </form>
        )}
      </div>
    </div>
  )
}