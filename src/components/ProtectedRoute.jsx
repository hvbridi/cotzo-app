import { Navigate, Outlet } from 'react-router-dom'

export default function ProtectedRoute() {
  const token = localStorage.getItem('token')

  // 1. Se não houver token, bloqueia e manda para o Login
  if (!token) {
    return <Navigate to="/" replace />
  }

  // 2. Validação de expiração do Token JWT
  try {
    const payloadBase64 = token.split('.')[1]
    const payload = JSON.parse(atob(payloadBase64))
    const agora = Math.floor(Date.now() / 1000)

    // Se o token expirou, desloga e redireciona
    if (payload.exp && payload.exp < agora) {
      localStorage.removeItem('token')
      return <Navigate to="/" replace />
    }
  } catch (e) {
    // Se o token estiver corrompido, limpa e redireciona
    localStorage.removeItem('token')
    return <Navigate to="/" replace />
  }

  // Se o token for válido, permite a renderização das telas internas
  return <Outlet />
}