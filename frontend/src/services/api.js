import axios from 'axios'

import axios from 'axios'

// Em dev (Vite), o backend roda em localhost:8000.
// Em produção, frontend e backend são servidos pelo mesmo domínio (FastAPI),
// então usamos a rota relativa /api — não precisa de configuração.
const api = axios.create({
  baseURL: import.meta.env.DEV ? 'http://localhost:8000/api' : '/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api