export const API_URL = import.meta.env.VITE_API_URL || 'https://teste-gratis-production.up.railway.app'

export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('token')

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const resposta = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })

  // SE O SERVIDOR RETORNAR 401 (TOKEN INVÁLIDO OU EXPIRADO)
  if (resposta.status === 401) {
    localStorage.removeItem('token')
    window.location.href = '/' // Força o redirecionamento global para a página de login
  }

  return resposta
}