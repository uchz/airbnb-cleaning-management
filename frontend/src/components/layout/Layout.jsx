import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useEffect, useState } from 'react'
import { getLowStockProducts, changePassword } from '../../services'
import { LogOut, Home, Building2, Users, CalendarDays, BarChart3, ClipboardList, Package, Sparkles, KeyRound } from 'lucide-react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import NotificationBell from './NotificationBell'

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const isAdmin = user?.role === 'admin'
  const [lowStockCount, setLowStockCount] = useState(0)
  const [showPwdModal, setShowPwdModal] = useState(false)
  const [pwdForm, setPwdForm] = useState({ current: '', next: '', confirm: '' })
  const [pwdError, setPwdError] = useState('')
  const [pwdSuccess, setPwdSuccess] = useState('')

  const openPwdModal = () => {
    setPwdForm({ current: '', next: '', confirm: '' })
    setPwdError('')
    setPwdSuccess('')
    setShowPwdModal(true)
  }

  const handlePwdSubmit = async (e) => {
    e.preventDefault()
    setPwdError('')
    if (pwdForm.next !== pwdForm.confirm) {
      setPwdError('A confirmação não confere com a nova senha.')
      return
    }
    if (pwdForm.next.length < 6) {
      setPwdError('A nova senha deve ter pelo menos 6 caracteres.')
      return
    }
    try {
      await changePassword(pwdForm.current, pwdForm.next)
      setShowPwdModal(false)
    } catch (err) {
      setPwdError(err.response?.data?.detail || 'Erro ao trocar senha')
    }
  }

  useEffect(() => {
    if (!isAdmin) return
    const loadLowStock = async () => {
      try {
        const res = await getLowStockProducts()
        setLowStockCount(res.data.length)
      } catch {
        setLowStockCount(0)
      }
    }
    loadLowStock()
    const interval = setInterval(loadLowStock, 60000)
    return () => clearInterval(interval)
  }, [isAdmin])

  const navItems = isAdmin
    ? [
        { to: '/', label: 'Dashboard', icon: Home },
        { to: '/apartments', label: 'Apartamentos', icon: Building2 },
        { to: '/employees', label: 'Funcionários', icon: Users },
        { to: '/schedules', label: 'Escalas', icon: CalendarDays },
        { to: '/reports', label: 'Relatórios', icon: BarChart3 },
        { to: '/products', label: 'Estoque', icon: Package },
      ]
    : [{ to: '/', label: 'Minha Escala', icon: ClipboardList }]

  const initials = user?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col bg-slate-950 text-gray-300">
        {/* Logo */}
        <div className="px-6 py-6">
          <img src="/logo-light.svg" alt="Verus Sweeply" className="h-9 w-auto max-w-[180px]" />
        </div>

        {/* Navegação */}
        <nav className="flex-1 px-3 mt-2">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-600 mb-2">
            {isAdmin ? 'Gerenciamento' : 'Portal'}
          </p>
          <ul className="space-y-1">
            {navItems.map((item) => {
              const active = location.pathname === item.to
              const Icon = item.icon
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      active
                        ? 'bg-gradient-to-r from-brand-600 to-violet-600 text-white shadow-lg shadow-brand-600/30'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon size={18} className={active ? '' : 'group-hover:text-brand-300'} />
                    {item.label}
                    {item.to === '/products' && lowStockCount > 0 && (
                      <span className="ml-auto bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                        {lowStockCount}
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Usuário + sair */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {initials || '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{user?.full_name}</p>
              <p className="text-xs text-gray-500 truncate">@{user?.username}</p>
            </div>
            <NotificationBell />
            <button
              onClick={openPwdModal}
              title="Trocar senha"
              className="p-2 text-gray-400 hover:text-brand-300 hover:bg-white/5 rounded-lg transition-colors"
            >
              <KeyRound size={16} />
            </button>
            <button
              onClick={logout}
              title="Sair"
              className="p-2 text-gray-400 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Topbar mobile */}
      <header className="lg:hidden bg-slate-950 text-white sticky top-0 z-20">
        <div className="px-4 py-3 flex items-center justify-between">
          <img src="/logo-light.svg" alt="Verus Sweeply" className="h-7 w-auto" />
          <div className="flex items-center gap-1">
            <NotificationBell />
            <button
              onClick={openPwdModal}
              title="Trocar senha"
              className="p-2 text-gray-400 hover:text-brand-300 rounded-lg"
            >
              <KeyRound size={18} />
            </button>
            <button
              onClick={logout}
              className="p-2 text-gray-400 hover:text-rose-400 rounded-lg"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
        <div className="px-4 pb-3 flex items-center gap-2 text-xs text-gray-400">
          <span className="text-white font-semibold">{user?.full_name}</span>
          {isAdmin && <span className="bg-brand-600/20 text-brand-300 px-2 py-0.5 rounded-full font-medium">Admin</span>}
        </div>
      </header>

      <div className="lg:pl-64">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 min-h-[calc(100vh-56px)] pb-24 lg:pb-8">
          <div className="animate-fade-in" key={location.pathname}>
            {children}
          </div>
        </main>
      </div>

      {/* Nav mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-white/90 backdrop-blur-lg border-t border-gray-200 pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-around px-2 py-1.5">
          {navItems.map((item) => {
            const active = location.pathname === item.to
            const Icon = item.icon
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center text-[10px] px-3 py-1.5 rounded-lg transition-colors ${
                  active ? 'text-brand-600' : 'text-gray-500'
                }`}
              >
                <Icon size={20} />
                <span className="mt-0.5 font-medium">{item.label.split(' ')[0]}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Modal Trocar Senha */}
      {showPwdModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                <KeyRound size={18} className="text-brand-600" /> Trocar Senha
              </h2>
              <p className="text-sm text-gray-500 mb-4">Conta de <strong>{user?.username}</strong></p>
              <form onSubmit={handlePwdSubmit}>
                <Input
                  label="Senha atual"
                  type="password"
                  value={pwdForm.current}
                  onChange={(e) => setPwdForm({ ...pwdForm, current: e.target.value })}
                  required
                />
                <Input
                  label="Nova senha (mín. 6 caracteres)"
                  type="password"
                  value={pwdForm.next}
                  onChange={(e) => setPwdForm({ ...pwdForm, next: e.target.value })}
                  required
                />
                <Input
                  label="Confirmar nova senha"
                  type="password"
                  value={pwdForm.confirm}
                  onChange={(e) => setPwdForm({ ...pwdForm, confirm: e.target.value })}
                  required
                />
                {pwdError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm rounded-xl p-3 mb-4">
                    {pwdError}
                  </div>
                )}
                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="outline" onClick={() => setShowPwdModal(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Salvar Nova Senha</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}