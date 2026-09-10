import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../contexts/I18nContext'
import { getApartments, createApartment, getEmployees, createUser, createSchedule } from '../services'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import { Building2, Users, CalendarDays, Check, ArrowRight, Sparkles } from 'lucide-react'

export default function Welcome() {
  const { user } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [apartmentForm, setApartmentForm] = useState({ name: '', address: '', city: '', state: '' })
  const [employeeForm, setEmployeeForm] = useState({ full_name: '', username: '', password: '', phone: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    const check = async () => {
      try {
        const [apts, emps] = await Promise.all([getApartments(), getEmployees()])
        if (apts.data.length > 0 && emps.data.length > 1) {
          // Já tem dados, pular wizard
          navigate('/', { replace: true })
        } else if (apts.data.length > 0) {
          setStep(2)
        }
      } catch {}
      setLoading(false)
    }
    check()
  }, [navigate])

  const handleApartment = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await createApartment({
        name: apartmentForm.name,
        address: apartmentForm.address,
        city: apartmentForm.city,
        state: apartmentForm.state || 'SC',
      })
      setStep(2)
    } catch (err) {
      setError(err.response?.data?.detail || t('welcome.errorApartment') || 'Erro ao criar apartamento')
    }
  }

  const handleEmployee = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await createUser({
        full_name: employeeForm.full_name,
        username: employeeForm.username,
        password: employeeForm.password,
        phone: employeeForm.phone,
        role: 'employee',
      })
      setStep(3)
    } catch (err) {
      setError(err.response?.data?.detail || t('welcome.errorEmployee') || 'Erro ao criar funcionária')
    }
  }

  const handleSchedule = async () => {
    const today = new Date().toISOString().split('T')[0]
    const end = new Date()
    end.setDate(end.getDate() + 6)
    const endStr = end.toISOString().split('T')[0]
    try {
      await createSchedule({ schedule_type: 'date_range', start_date: today, end_date: endStr, notes: 'Primeira escala' })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.response?.data?.detail || t('welcome.errorSchedule') || 'Erro ao criar escala')
    }
  }

  if (loading) {
    return <div className="min-h-screen grid place-items-center"><div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" /></div>
  }

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 max-w-md text-center">
          <p className="font-bold">{t('welcome.employeeWelcome', { name: user?.full_name })}</p>
          <p className="text-sm text-gray-500 mt-2">{t('welcome.employeeOrg', { org: user?.organization_name || '...' })}</p>
          <p className="text-sm text-gray-500 mt-1">{t('welcome.employeeHint')}</p>
          <Button onClick={() => navigate('/')} className="mt-6">{t('welcome.viewMySchedule')}</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <img src="/logo.svg" alt="Verus Sweeply" className="h-8 mx-auto" />
          <h1 className="text-2xl font-extrabold mt-4">{t('welcome.welcomeTo', { org: user?.organization_name || '' })}</h1>
          <p className="text-sm text-gray-500">{t('welcome.setupIn3')}</p>
          <div className="flex items-center justify-center gap-2 mt-4">
            {[1,2,3].map((n) => (
              <div key={n} className={`w-8 h-8 rounded-full grid place-items-center text-sm font-bold ${step >= n ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {step > n ? <Check size={16} /> : n}
              </div>
            ))}
          </div>
        </div>

        {step === 1 && (
          <Card className="p-6">
            <h2 className="font-bold flex items-center gap-2"><Building2 size={18} className="text-brand-600" /> {t('welcome.step1t')}</h2>
            <p className="text-sm text-gray-500 mb-4">{t('welcome.step1d')}</p>
            <form onSubmit={handleApartment} className="space-y-3">
              <Input label={t('common.name')} value={apartmentForm.name} onChange={(e) => setApartmentForm({ ...apartmentForm, name: e.target.value })} placeholder="Apto Praia Azul" required />
              <Input label={t('common.address')} value={apartmentForm.address} onChange={(e) => setApartmentForm({ ...apartmentForm, address: e.target.value })} placeholder="Av. Beira Mar, 1200" required />
              <div className="grid grid-cols-2 gap-3">
                <Input label={t('common.city')} value={apartmentForm.city} onChange={(e) => setApartmentForm({ ...apartmentForm, city: e.target.value })} placeholder="Florianópolis" required />
                <Input label={t('common.state')} value={apartmentForm.state} onChange={(e) => setApartmentForm({ ...apartmentForm, state: e.target.value })} placeholder="SC" />
              </div>
              {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3 text-sm">{error}</div>}
              <Button type="submit" className="w-full">{t('welcome.continue')} <ArrowRight size={16} className="ml-1" /></Button>
            </form>
          </Card>
        )}

        {step === 2 && (
          <Card className="p-6">
            <h2 className="font-bold flex items-center gap-2"><Users size={18} className="text-brand-600" /> {t('welcome.step2t')}</h2>
            <p className="text-sm text-gray-500 mb-4">{t('welcome.step2d')}</p>
            <form onSubmit={handleEmployee} className="space-y-3">
              <Input label={t('common.name')} value={employeeForm.full_name} onChange={(e) => setEmployeeForm({ ...employeeForm, full_name: e.target.value })} required />
              <Input label={t('common.username')} value={employeeForm.username} onChange={(e) => setEmployeeForm({ ...employeeForm, username: e.target.value })} required />
              <Input label={t('common.phone')} value={employeeForm.phone} onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })} placeholder="(11) 99999-0000" />
              <Input label={t('common.password')} type="password" value={employeeForm.password} onChange={(e) => setEmployeeForm({ ...employeeForm, password: e.target.value })} required />
              {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3 text-sm">{error}</div>}
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} type="button">{t('welcome.back')}</Button>
                <Button type="submit" className="flex-1">{t('welcome.continue')} <ArrowRight size={16} className="ml-1" /></Button>
              </div>
            </form>
          </Card>
        )}

        {step === 3 && (
          <Card className="p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 grid place-items-center mx-auto mb-4 text-white">
              <CalendarDays size={28} />
            </div>
            <h2 className="font-bold text-lg">{t('welcome.step3t')}</h2>
            <p className="text-sm text-gray-500 mt-1">{t('welcome.step3d')}</p>
            {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3 text-sm mt-4">{error}</div>}
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">{t('welcome.back')}</Button>
              <Button onClick={handleSchedule} className="flex-1">{t('welcome.createAndStart')} <Sparkles size={16} className="ml-1" /></Button>
            </div>
            <button onClick={() => navigate('/')} className="text-sm text-gray-500 hover:text-gray-700 mt-4">{t('welcome.skip')}</button>
          </Card>
        )}
      </div>
    </div>
  )
}
