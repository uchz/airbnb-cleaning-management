import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../contexts/I18nContext'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import LanguageSwitcher from '../components/ui/LanguageSwitcher'
import { User, Lock, Sparkles } from 'lucide-react'

export default function Login() {
  const { t } = useI18n()
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
      <div className="absolute top-4 right-4">
        <LanguageSwitcher variant="dark" />
      </div>
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
            <img src="/logo-light.svg" alt="Verus Sweeply" className="h-14 sm:h-16 w-auto max-w-full" />
            <p className="text-sm text-gray-400 mt-3 flex items-center gap-1.5">
              <Sparkles size={14} className="text-brand-400" />
              {t('auth.loginSubtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <Input
              label={t('common.username')}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('auth.usernamePlaceholder')}
              required
              autoComplete="username"
              icon={<User size={16} />}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
            />
            <Input
              label={t('common.password')}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.passwordPlaceholder')}
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
              {loading ? t('auth.entering') : t('auth.login')}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            {t('auth.noAccount')} <Link to="/signup" className="text-brand-400 hover:text-brand-300 font-semibold">{t('auth.createAccountLink')}</Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          {t('auth.restricted')}
        </p>
      </div>
    </div>
  )
}