import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { User, Lock, Sparkles } from 'lucide-react'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950 flex items-center justify-center px-4">
      {/* Fundo decorativo */}
      <div className="absolute inset-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-brand-600/30 blur-3xl"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-violet-600/30 blur-3xl"></div>
        <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-rose-500/20 blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md animate-scale-in">
        <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl p-8 sm:p-10 shadow-2xl">
          {/* Marca */}
          <div className="flex flex-col items-center mb-8">
            <img src="/logo-light.svg" alt="Verus Sweeply" className="h-10 w-auto" />
            <p className="text-sm text-gray-400 mt-3 flex items-center gap-1.5">
              <Sparkles size={14} className="text-brand-400" />
              Gestão inteligente de limpeza
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <Input
              label="Usuário"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="seu usuário"
              required
              autoComplete="username"
              icon={<User size={16} />}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
            />
            <Input
              label="Senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              icon={<Lock size={16} />}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
            />

            {error && (
              <div className="bg-rose-500/15 border border-rose-500/30 text-rose-200 text-sm rounded-xl p-3 mb-4 animate-fade-in">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full !py-3 !text-base"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          Portal da equipe de limpeza · Acesso restrito
        </p>
      </div>
    </div>
  )
}