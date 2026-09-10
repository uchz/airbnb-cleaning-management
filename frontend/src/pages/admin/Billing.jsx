import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../../services/api'
import { getApartments } from '../../services'
import { useI18n } from '../../contexts/I18nContext'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { CreditCard, Check, Sparkles, Building2, Zap } from 'lucide-react'

export default function Billing() {
  const { t } = useI18n()
  const [searchParams] = useSearchParams()
  const [plans, setPlans] = useState([])
  const [sub, setSub] = useState(null)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState('')
  const [error, setError] = useState('')
  const [apartmentCount, setApartmentCount] = useState(0)
  const [showConfirmPortal, setShowConfirmPortal] = useState(false)
  const [showConfirmCancel, setShowConfirmCancel] = useState(false)

  const success = searchParams.get('success') === '1'
  const canceled = searchParams.get('canceled') === '1'
  const sessionId = searchParams.get('session_id')
  const [verifying, setVerifying] = useState(false)

  const statusLabel = {
    active: t('employees.active'),
    trial: 'Trial',
    inactive: t('employees.inactive'),
    canceled: t('employees.inactive'),
    past_due: 'past_due',
  }

  const load = async () => {
    try {
      const [p, s, apts] = await Promise.all([
        api.get('/billing/plans'),
        api.get('/billing/subscription'),
        getApartments().catch(() => ({ data: [] })),
      ])
      setPlans(p.data)
      setSub(s.data)
      setApartmentCount(apts.data?.length || 0)
    } catch (e) {
      setError(e.response?.data?.detail || t('billing.errorLoad') || 'Erro ao carregar planos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // Sem webhook: verifica sessão do Stripe e ativa o plano
  useEffect(() => {
    if (success && sessionId) {
      setVerifying(true)
      api.post('/billing/verify-session', null, { params: { session_id: sessionId } })
        .then(() => load())
        .catch((e) => setError(e.response?.data?.detail || t('billing.errorVerify') || 'Erro ao verificar pagamento'))
        .finally(() => setVerifying(false))
    }
  }, [success, sessionId])

  const handleCheckout = async (plan) => {
    setCheckoutLoading(plan)
    setError('')
    try {
      const res = await api.post('/billing/create-checkout-session', null, { params: { plan } })
      window.location.href = res.data.url
    } catch (e) {
      setError(e.response?.data?.detail || t('billing.errorCheckout') || 'Erro ao iniciar checkout')
      setCheckoutLoading('')
    }
  }

  const handlePortal = async () => {
    try {
      const res = await api.post('/billing/portal')
      window.location.href = res.data.url
    } catch (e) {
      const msg = e.response?.data?.detail || t('billing.errorPortal') || 'Erro ao abrir portal'
      if (msg.includes('Portal do Stripe não configurado')) {
        setShowConfirmPortal(true)
      } else {
        setError(msg)
      }
    }
  }

  const handleCancel = () => {
    setShowConfirmCancel(true)
  }

  const confirmCancel = async () => {
    setShowConfirmCancel(false)
    setShowConfirmPortal(false)
    try {
      await api.post('/billing/cancel')
      await load()
    } catch (e) {
      setError(e.response?.data?.detail || t('billing.errorCancel') || 'Erro ao cancelar')
    }
  }

  if (loading) {
    return <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full mx-auto mt-20"></div>
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-3">
          <CreditCard className="text-brand-600" /> {t('billing.title')}
        </h1>
        <p className="text-sm text-gray-500 mt-1">{t('billing.subtitle')}</p>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 mb-6 flex items-center gap-2">
          <Check size={18} /> {verifying ? t('billing.verifying') : t('billing.verified')}
        </div>
      )}
      {canceled && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 mb-6">
          {t('billing.canceled')}
        </div>
      )}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3 mb-6 text-sm">{error}</div>
      )}

      {sub && (
        <Card className="p-5 mb-8 bg-gradient-to-r from-slate-50 to-brand-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm text-gray-500">{t('billing.currentPlan')}</p>
              <p className="text-xl font-extrabold text-gray-900">
                {sub.plan_name}{' '}
                <Badge color={sub.subscription_status === 'active' ? 'green' : sub.subscription_status === 'trial' ? 'blue' : 'gray'}>
                  {statusLabel[sub.subscription_status] || sub.subscription_status}
                </Badge>
              </p>
              <p className="text-sm text-gray-600">{sub.price_label}</p>
              
              {/* Trial info */}
              {sub.subscription_status === 'trial' && sub.trial_days_remaining !== null && (
                <div className="mt-2 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-3 text-sm">
                  <strong>🎉 Período de teste:</strong> {sub.trial_days_remaining} dias restantes
                  <br />
                  <span className="text-xs">Adicione um cartão de crédito antes do término para continuar sem interrupções.</span>
                </div>
              )}
              
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{apartmentCount} / {sub.max_apartments} apartamentos</span>
                  <span>{sub.max_apartments > 0 ? Math.round((apartmentCount / sub.max_apartments) * 100) : 0}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${apartmentCount >= sub.max_apartments ? 'bg-amber-500' : 'bg-brand-500'}`}
                    style={{ width: `${Math.min(100, sub.max_apartments > 0 ? (apartmentCount / sub.max_apartments) * 100 : 0)}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              {sub.stripe_customer_id && (
                <Button variant="outline" onClick={handlePortal}>{t('billing.manage')}</Button>
              )}
              {sub.subscription_status === 'active' && (
                <Button variant="outline" onClick={handleCancel} className="!text-rose-600 !border-rose-200 hover:!bg-rose-50">
                  {t('billing.cancelPlan')}
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map((plan) => {
          const isCurrent = sub?.plan === plan.id
          return (
            <Card key={plan.id} className={`p-6 flex flex-col ${isCurrent ? 'ring-2 ring-brand-500 shadow-lg' : ''}`}>
              <div className="flex items-center gap-2 mb-2">
                {plan.id === 'pro' ? <Sparkles size={20} className="text-violet-600" /> : <Building2 size={20} className="text-brand-600" />}
                <h3 className="font-extrabold text-xl text-gray-900">{plan.name}</h3>
                {isCurrent && <Badge color="green">{t('billing.current')}</Badge>}
              </div>
              <p className="text-3xl font-extrabold text-gray-900 mb-1">{plan.price_label}</p>
              <p className="text-sm text-gray-500 mb-4">
                {plan.id === 'basic' ? 'Ideal para começar' : 'Ilimitado e completo'}
              </p>
              <ul className="text-sm text-gray-700 space-y-2 mb-6 flex-1">
                {plan.features?.map((feature, idx) => (
                  <li key={idx} className="flex gap-2">
                    <Check size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button 
                onClick={() => handleCheckout(plan.id)} 
                disabled={isCurrent || !!checkoutLoading}
                variant={plan.id === 'pro' ? 'primary' : 'secondary'}
              >
                {checkoutLoading === plan.id ? t('billing.redirecting') : isCurrent ? t('billing.currentPlanBtn') : t('billing.subscribe', { plan: plan.name })}
              </Button>
            </Card>
          )
        })}
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <p><strong>🎉 Trial de 7 dias grátis!</strong></p>
        <p className="mt-1">Novos cadastros iniciam com 7 dias gratuitos do plano Basic. Cartão de crédito necessário no cadastro.</p>
      </div>

      <p className="text-xs text-gray-400 mt-6 text-center">
        {t('billing.paymentStripe')}
      </p>

      {showConfirmPortal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h3 className="font-bold text-gray-900">Portal indisponível</h3>
            <p className="text-sm text-gray-600 mt-2">{t('billing.portalNotConfigured')}</p>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowConfirmPortal(false)}>
                {t('common.cancel')}
              </Button>
              <Button variant="danger" onClick={confirmCancel}>
                {t('common.confirm')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showConfirmCancel && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h3 className="font-bold text-gray-900">{t('billing.cancelPlan')}?</h3>
            <p className="text-sm text-gray-600 mt-2">{t('billing.cancelConfirm')}</p>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowConfirmCancel(false)}>
                {t('common.cancel')}
              </Button>
              <Button variant="danger" onClick={confirmCancel}>
                {t('common.delete')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
