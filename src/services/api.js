export const API_URL =
  import.meta.env.VITE_API_URL ||
  'https://teste-gratis-production.up.railway.app'

/**
 * Erro de API com o status HTTP preservado.
 * Permite tratar 403 (sem permissão) diferente de 404 (não existe)
 * sem precisar ler o texto da mensagem.
 */
export class ApiError extends Error {
  constructor(mensagem, status) {
    super(mensagem)
    this.name = 'ApiError'
    this.status = status
  }
}

function encerrarSessao() {
  localStorage.removeItem('token')
  // Evita loop de redirecionamento quando já estamos no login
  if (window.location.pathname !== '/') {
    window.location.href = '/'
  }
}

/**
 * Fetch cru. Mantido com a mesma assinatura de antes para não quebrar
 * as páginas que ainda não foram migradas.
 */
export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('token')

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const resposta = await fetch(`${API_URL}${endpoint}`, { ...options, headers })

  if (resposta.status === 401) {
    encerrarSessao()
  }

  return resposta
}

/**
 * Extrai a mensagem de erro do FastAPI.
 * O campo `detail` pode vir como string ou como lista de erros de validação.
 */
async function extrairMensagemErro(resposta) {
  try {
    const dados = await resposta.json()
    const detail = dados?.detail

    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
      return detail
        .map((e) => {
          const campo = Array.isArray(e.loc) ? e.loc[e.loc.length - 1] : ''
          return campo ? `${campo}: ${e.msg}` : e.msg
        })
        .join('\n')
    }
    if (detail) return JSON.stringify(detail)
  } catch {
    // resposta sem corpo JSON
  }

  const genericas = {
    400: 'Dados inválidos. Confira os campos preenchidos.',
    403: 'Você não tem permissão para esta ação.',
    404: 'Registro não encontrado.',
    409: 'Este registro já existe.',
    422: 'Dados inválidos. Confira os campos preenchidos.',
    429: 'Muitas tentativas. Aguarde um instante.',
    500: 'Erro interno no servidor. Tente novamente em instantes.',
  }
  return genericas[resposta.status] || `Erro inesperado (${resposta.status}).`
}

/**
 * Fetch que já devolve o JSON pronto e lança ApiError quando falha.
 * É o que os hooks de dados usam — elimina o `if (!resposta.ok) throw new Error(...)`
 * repetido em toda página.
 */
export async function apiJson(endpoint, options = {}) {
  const resposta = await apiFetch(endpoint, options)

  if (!resposta.ok) {
    throw new ApiError(await extrairMensagemErro(resposta), resposta.status)
  }

  if (resposta.status === 204) return null

  const texto = await resposta.text()
  if (!texto) return null

  try {
    return JSON.parse(texto)
  } catch {
    return texto
  }
}

// Atalhos — o corpo é serializado automaticamente
export const api = {
  get: (endpoint) => apiJson(endpoint),

  post: (endpoint, corpo) =>
    apiJson(endpoint, { method: 'POST', body: JSON.stringify(corpo) }),

  put: (endpoint, corpo) =>
    apiJson(endpoint, {
      method: 'PUT',
      ...(corpo !== undefined ? { body: JSON.stringify(corpo) } : {}),
    }),

  del: (endpoint) => apiJson(endpoint, { method: 'DELETE' }),
}

/**
 * Lê o cargo direto do JWT, sem chamada de rede.
 * Útil só para decidir o que renderizar antes do /usuarios/me responder.
 * Nunca use isso como controle de segurança — quem valida é o backend.
 */
export function lerTokenLocal() {
  const token = localStorage.getItem('token')
  if (!token) return null
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch {
    return null
  }
}