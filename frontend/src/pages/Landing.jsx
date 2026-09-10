import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../contexts/I18nContext'
import LanguageSwitcher from '../components/ui/LanguageSwitcher'
import { Check, Sparkles, CalendarDays, Video, ClipboardList, Package, BarChart3, Bell, Smartphone, Copy, ArrowRight, ShieldCheck, Zap, Clock } from 'lucide-react'

export default function Landing() {
  const { user } = useAuth()
  const { t } = useI18n()
  const cta = user ? '/schedules' : '/signup'

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-gray-100 overflow-x-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
          <img src="/logo.svg" alt="Verus Sweeply" className="h-6 sm:h-7 w-auto shrink-0" />
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>
            <Link to="/login" className="px-2 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 whitespace-nowrap">{t('auth.login')}</Link>
            <Link to={cta} className="px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-violet-600 text-white text-xs sm:text-sm font-bold shadow-lg shadow-brand-600/25 hover:from-brand-700 hover:to-violet-700 whitespace-nowrap">
              <span className="hidden sm:inline">{t('landing.ctaFree')}</span>
              <span className="sm:hidden">Criar conta</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-50 to-white" />
        <div className="absolute -top-24 right-0 w-[600px] h-[600px] rounded-full bg-violet-200/30 blur-3xl" />
        <div className="absolute -bottom-24 left-0 w-[500px] h-[500px] rounded-full bg-brand-200/30 blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-semibold text-slate-700 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> {t('landing.badge')}
              </div>
              <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.05]">
                {t('landing.heroTitle1')} <br />
                {t('landing.heroTitle2')} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-violet-600">{t('landing.heroTitle3')}</span>
              </h1>
              <p className="mt-4 text-lg text-slate-600 leading-relaxed">
                {t('landing.heroSubtitle')}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link to={cta} className="px-6 py-3 rounded-xl bg-slate-950 text-white font-bold hover:bg-slate-900 inline-flex items-center gap-2">
                  {t('landing.ctaFree')} <ArrowRight size={16} />
                </Link>
                <Link to="/login" className="px-6 py-3 rounded-xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
                  {t('landing.ctaDemo')}
                </Link>
              </div>
              <p className="mt-3 text-xs text-slate-500">{t('landing.demoHint')} <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">admin / admin123</span> • PWA instalável • Vídeos com prova</p>
              <div className="mt-6 flex items-center gap-6 text-sm text-slate-600">
                <span className="flex items-center gap-2"><ShieldCheck size={16} className="text-emerald-600" /> {t('landing.noCard')}</span>
                <span className="flex items-center gap-2"><Clock size={16} className="text-brand-600" /> {t('landing.setupTime')}</span>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
                <div className="h-10 bg-slate-950 flex items-center gap-1.5 px-4">
                  <span className="w-3 h-3 rounded-full bg-white/20" /><span className="w-3 h-3 rounded-full bg-white/20" /><span className="w-3 h-3 rounded-full bg-white/20" />
                  <span className="ml-3 text-xs text-white/70">Verus Sweeply • Escala por período</span>
                </div>
                <div className="p-4 grid grid-cols-3 gap-3">
                  {[
                    { d: '22/08', n: 'Apto 101', t: 'Diária' },
                    { d: '23/08', n: 'Apto 202', t: 'Meia' },
                    { d: '24/08', n: 'Apto 101', t: 'Diária' },
                    { d: '25/08', n: 'Avulsa • Apto 305', t: 'Avulsa' },
                    { d: '26/08', n: 'Apto 404', t: 'Diária' },
                    { d: '27/08', n: 'Apto 202', t: 'Concluída', ok: true },
                  ].map((c) => (
                    <div key={c.d} className={`rounded-2xl border p-3 ${c.ok ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-100'}`}>
                      <p className="text-xs font-bold text-slate-900">{c.d}</p>
                      <p className="text-xs text-slate-600 truncate">{c.n}</p>
                      <span className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${c.ok ? 'bg-emerald-600 text-white' : c.t === 'Avulsa' ? 'bg-amber-500 text-white' : 'bg-white border'}`}>{c.t}</span>
                    </div>
                  ))}
                </div>
                <div className="px-4 pb-4 flex gap-2">
                  <span className="px-3 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold">+ Nova diária</span>
                  <span className="px-3 py-2 rounded-xl bg-white border text-xs font-semibold">Duplicar escala</span>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-xl border p-3 hidden sm:flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 grid place-items-center"><Check size={18} /></div>
                <div><p className="text-sm font-bold">Check-out com vídeo</p><p className="text-xs text-slate-500">Prova que a limpeza foi feita</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dor */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid md:grid-cols-3 gap-4">
          {[
            [t('landing.pain1t'), t('landing.pain1d')],
            [t('landing.pain2t'), t('landing.pain2d')],
            [t('landing.pain3t'), t('landing.pain3d')],
          ].map(([t1, d]) => (
            <div key={t1} className="rounded-2xl border bg-white p-5">
              <p className="font-bold text-slate-900">{t1}</p><p className="text-sm text-slate-600 mt-1">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Como funciona */}
      <section className="bg-slate-950 text-white py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold">{t('landing.howTitle')}</h2>
          <p className="text-slate-400 mt-1">{t('landing.howSubtitle')}</p>
          <div className="grid md:grid-cols-3 gap-4 mt-8">
            {[
              { n: '01', t: t('landing.step1t'), d: t('landing.step1d') },
              { n: '02', t: t('landing.step2t'), d: t('landing.step2d') },
              { n: '03', t: t('landing.step3t'), d: t('landing.step3d') },
            ].map((s) => (
              <div key={s.n} className="rounded-2xl bg-white/5 border border-white/10 p-6">
                <p className="text-4xl font-extrabold text-white/20">{s.n}</p>
                <p className="font-bold mt-2">{s.t}</p><p className="text-sm text-slate-400 mt-1">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <h3 className="text-xl font-extrabold">{t('landing.featuresTitle')}</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {[
            [CalendarDays, t('landing.f1t'), t('landing.f1d')],
            [Zap, t('landing.f2t'), t('landing.f2d')],
            [Copy, t('landing.f3t'), t('landing.f3d')],
            [Video, t('landing.f4t'), t('landing.f4d')],
            [ClipboardList, t('landing.f5t'), t('landing.f5d')],
            [Bell, t('landing.f6t'), t('landing.f6d')],
            [BarChart3, t('landing.f7t'), t('landing.f7d')],
            [Package, t('landing.f8t'), t('landing.f8d')],
            [Smartphone, t('landing.f9t'), t('landing.f9d')],
          ].map(([Icon, t1, d]) => (
            <div key={t1} className="rounded-2xl border p-5 bg-white">
              <Icon size={18} className="text-brand-600" /><p className="font-bold mt-2">{t1}</p><p className="text-sm text-slate-600 mt-1">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Preços */}
      <section className="bg-gray-50 border-y py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h3 className="text-xl font-extrabold">{t('landing.pricingTitle')}</h3>
          <p className="text-sm text-slate-500">{t('landing.pricingSubtitle')}</p>
          <div className="grid md:grid-cols-3 gap-4 mt-6">
            {[
              { n: t('landing.free'), p: t('landing.freePrice'), l: t('landing.freeLimit'), c: t('landing.startFree'), to: '/signup', hl: false },
              { n: t('landing.basic'), p: t('landing.basicPrice'), l: t('landing.basicLimit'), c: t('landing.subscribe', { plan: 'Basic' }), to: '/signup', hl: true },
              { n: t('landing.pro'), p: t('landing.proPrice'), l: t('landing.proLimit'), c: t('landing.subscribe', { plan: 'Pro' }), to: '/signup', hl: false },
            ].map((pl) => (
              <div key={pl.n} className={`rounded-2xl border bg-white p-6 flex flex-col ${pl.hl ? 'ring-2 ring-brand-500 shadow-lg' : ''}`}>
                <p className="font-extrabold">{pl.n}</p><p className="text-2xl font-extrabold mt-1">{pl.p}</p><p className="text-sm text-slate-500">{pl.l}</p>
                <Link to={pl.to} className={`mt-6 text-center px-5 py-3 rounded-xl font-bold ${pl.hl ? 'bg-brand-600 text-white' : 'bg-slate-900 text-white'}`}>{pl.c}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <h3 className="text-xl font-extrabold">{t('landing.faqTitle')}</h3>
        <div className="mt-6 grid md:grid-cols-2 gap-4">
          {[
            [t('landing.faq1q'), t('landing.faq1a')],
            [t('landing.faq2q'), t('landing.faq2a')],
            [t('landing.faq3q'), t('landing.faq3a')],
            [t('landing.faq4q'), t('landing.faq4a')],
          ].map(([q, a]) => (
            <div key={q} className="rounded-2xl border p-5 bg-white"><p className="font-bold">{q}</p><p className="text-sm text-slate-600 mt-1">{a}</p></div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-slate-950 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-xl font-extrabold">{t('landing.finalTitle')}</p>
            <p className="text-slate-400 text-sm">{t('landing.finalSubtitle')}</p>
          </div>
          <Link to={cta} className="px-6 py-3 rounded-xl bg-white text-slate-900 font-bold inline-flex items-center gap-2">
            {t('landing.createAccount')} <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <footer className="py-8 text-center text-xs text-slate-500">
        {t('landing.footer')}
      </footer>
    </div>
  )
}
