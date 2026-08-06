// Cole aqui o link da nuvem que seu colega te passar (sem a barra / no final)
export const API_URL = "https://cotzo-app-production.up.railway.app" 

// Função auxiliar para fazer requisições enviando o Token de acesso automaticamente
export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('token')

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  // Se já tiver feito login, envia o crachá (Token) em todas as chamadas
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const resposta = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })

  return resposta
}