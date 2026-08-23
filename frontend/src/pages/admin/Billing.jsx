import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../../services/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { CreditCard, Check, Sparkles, Building2, Zap } from 'lucide-react'

export default function Billing() {
  const [searchParams] = useSearchParams()
  const [plans, setPlans] = useState([])
  const [sub, setSub] = useState(null)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState('')
  const [error, setError] = useState('')

  const success = searchParams.get('success') === '1'
  const canceled = searchParams.get('canceled') === '1'

  const load = async () => {
    try {
      const [p, s] = await Promise.all([
        api.get('/billing/plans'),
        api.get('/billing/subscription'),
      ])
      setPlans(p.data)
      setSub(s.data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Erro ao carregar planos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleCheckout = async (plan) => {
    setCheckoutLoading(plan)
    setError('')
    try {
      const res = await api.post('/billing/create-checkout-session', null, { params: { plan } })
      window.location.href = res.data.url
    } catch (e) {
      setError(e.response?.data?.detail || 'Erro ao iniciar checkout')
      setCheckoutLoading('')
    }
  }

  const handlePortal = async () => {
    try {
      const res = await api.post('/billing/portal')
      window.location.href = res.data.url
    } catch (e) {
      setError(e.response?.data?.detail || 'Erro ao abrir portal')
    }
  }

  if (loading) {
    return <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full mx-auto mt-20"></div>
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-3">
          <CreditCard className="text-brand-600" /> Planos e cobrança
        </h1>
        <p className="text-sm text-gray-500 mt-1">Cobrança por número de apartamentos — escolha o plano da sua organização</p>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 mb-6 flex items-center gap-2">
          <Check size={18} /> Pagamento confirmado! Seu plano será atualizado em instantes.
        </div>
      )}
      {canceled && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 mb-6">
          Checkout cancelado.
        </div>
      )}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3 mb-6 text-sm">{error}</div>
      )}

      {sub && (
        <Card className="p-5 mb-8 bg-gradient-to-r from-slate-50 to-brand-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm text-gray-500">Plano atual</p>
              <p className="text-xl font-extrabold text-gray-900">
                {sub.plan_name} <Badge color={sub.subscription_status === 'active' ? 'green' : 'gray'}>{sub.subscription_status}</Badge>
              </p>
              <p className="text-sm text-gray-600">{sub.price_label} · até {sub.max_apartments} apartamentos</p>
            </div>
            {sub.stripe_customer_id && (
              <Button variant="outline" onClick={handlePortal}>Gerenciar assinatura</Button>
            )}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const isCurrent = sub?.plan === plan.id
          const isFree = plan.id === 'free'
          return (
            <Card key={plan.id} className={`p-6 flex flex-col ${isCurrent ? 'ring-2 ring-brand-500 shadow-lg' : ''}`}>
              <div className="flex items-center gap-2 mb-2">
                {plan.id === 'pro' ? <Sparkles size={18} className="text-violet-600" /> : plan.id === 'basic' ? <Building2 size={18} className="text-brand-600" /> : <Zap size={18} className="text-amber-500" />}
                <h3 className="font-extrabold text-gray-900">{plan.name}</h3>
                {isCurrent && <Badge color="green">Atual</Badge>}
              </div>
              <p className="text-2xl font-extrabold text-gray-900">{plan.price_label}</p>
              <p className="text-sm text-gray-500 mb-4">até {plan.max_apartments} apartamentos</p>
              <ul className="text-sm text-gray-600 space-y-1 mb-6 flex-1">
                <li className="flex gap-2"><Check size={14} className="text-emerald-500 mt-0.5" /> Escalas flexíveis</li>
                <li className="flex gap-2"><Check size={14} className="text-emerald-500 mt-0.5" /> Diárias avulsas</li>
                <li className="flex gap-2"><Check size={14} className="text-emerald-500 mt-0.5" /> Relatórios e PWA</li>
              </ul>
              {isFree ? (
                <Button variant="outline" disabled>Grátis</Button>
              ) : (
                <Button onClick={() => handleCheckout(plan.id)} disabled={isCurrent || !!checkoutLoading}>
                  {checkoutLoading === plan.id ? 'Redirecionando...' : isCurrent ? 'Plano atual' : `Assinar ${plan.name}`}
                </Button>
              )}
            </Card>
          )
        })}
      </div>

      <p className="text-xs text-gray-400 mt-6 text-center">
        Pagamento processado pelo Stripe. Teste com cartão 4242 4242 4242 4242. Configure STRIPE_SECRET_KEY no Railway para ativar.
      </p>
    </div>
  )
}
