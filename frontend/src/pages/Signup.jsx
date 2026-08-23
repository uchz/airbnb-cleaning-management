import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { Building2, User, Lock, Phone, Sparkles } from 'lucide-react'
import api from '../services/api'

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function Signup() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({
    org_name: '',
    org_slug: '',
    admin_full_name: '',
    admin_username: '',
    admin_phone: '',
    admin_password: '',
    admin_password_confirm: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleOrgNameChange = (v) => {
    setForm((prev) => ({
      ...prev,
      org_name: v,
      org_slug: prev.org_slug === slugify(prev.org_name) || prev.org_slug === '' ? slugify(v) : prev.org_slug
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.admin_password !== form.admin_password_confirm) {
      setError('As senhas não conferem')
      return
    }
    if (form.admin_password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      return
    }
    setLoading(true)
    try {
      const res = await api.post('/organizations/signup', {
        org_name: form.org_name,
        org_slug: form.org_slug || slugify(form.org_name),
        admin_username: form.admin_username,
        admin_password: form.admin_password,
        admin_full_name: form.admin_full_name,
        admin_phone: form.admin_phone || null,
      })
      localStorage.setItem('token', res.data.access_token)
      // Buscar usuário logado via getMe implícito no AuthProvider reload
      window.location.href = '/'
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950 flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-brand-600/30 blur-3xl"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-violet-600/30 blur-3xl"></div>
        <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-rose-500/20 blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-xl animate-scale-in">
        <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl p-8 sm:p-10 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <img src="/logo-light.svg" alt="Verus Sweeply" className="h-12 sm:h-14 w-auto max-w-full mb-3" />
            <p className="text-sm text-gray-400 flex items-center gap-1.5">
              <Sparkles size={14} className="text-brand-400" />
              Crie sua organização e comece em minutos
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Input
                  label="Nome da organização"
                  value={form.org_name}
                  onChange={(e) => handleOrgNameChange(e.target.value)}
                  placeholder="Ex: Limpezas Litoral"
                  required
                  icon={<Building2 size={16} />}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  label="Slug (identificador único)"
                  value={form.org_slug}
                  onChange={(e) => setForm({ ...form, org_slug: slugify(e.target.value) })}
                  placeholder="limpezas-litoral"
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
                <p className="text-[11px] text-gray-500 -mt-2 mb-2">Usado na URL da sua organização</p>
              </div>
              <div className="sm:col-span-2 pt-2 border-t border-white/10">
                <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Administrador</p>
              </div>
              <Input
                label="Nome completo"
                value={form.admin_full_name}
                onChange={(e) => setForm({ ...form, admin_full_name: e.target.value })}
                placeholder="Seu nome"
                required
                icon={<User size={16} />}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
              />
              <Input
                label="Telefone"
                value={form.admin_phone}
                onChange={(e) => setForm({ ...form, admin_phone: e.target.value })}
                placeholder="(11) 99999-0000"
                icon={<Phone size={16} />}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
              />
              <div className="sm:col-span-2">
                <Input
                  label="Usuário (login)"
                  value={form.admin_username}
                  onChange={(e) => setForm({ ...form, admin_username: e.target.value })}
                  placeholder="admin"
                  required
                  icon={<User size={16} />}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
              </div>
              <Input
                label="Senha"
                type="password"
                value={form.admin_password}
                onChange={(e) => setForm({ ...form, admin_password: e.target.value })}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                icon={<Lock size={16} />}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
              />
              <Input
                label="Confirmar senha"
                type="password"
                value={form.admin_password_confirm}
                onChange={(e) => setForm({ ...form, admin_password_confirm: e.target.value })}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                icon={<Lock size={16} />}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
              />
            </div>

            {error && (
              <div className="bg-rose-500/15 border border-rose-500/30 text-rose-200 text-sm rounded-xl p-3 mt-4 animate-fade-in">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full !py-3 !text-base mt-6" disabled={loading}>
              {loading ? 'Criando conta...' : 'Criar organização'}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            Já tem conta? <Link to="/login" className="text-brand-400 hover:text-brand-300 font-semibold">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
