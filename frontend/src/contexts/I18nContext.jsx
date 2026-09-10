import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import pt from '../i18n/locales/pt'
import en from '../i18n/locales/en'
import es from '../i18n/locales/es'
import { format as fnsFormat } from 'date-fns'
import { ptBR, enUS, es as esLocale } from 'date-fns/locale'

const locales = { pt, en, es }
const dateLocales = { pt: ptBR, en: enUS, es: esLocale }
const LANGS = ['pt', 'en', 'es']

function detectLang() {
  const saved = localStorage.getItem('lang')
  if (saved && LANGS.includes(saved)) return saved
  const nav = (navigator.language || 'pt').slice(0, 2).toLowerCase()
  return LANGS.includes(nav) ? nav : 'pt'
}

function getNested(obj, path) {
  return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj)
}

const I18nContext = createContext(null)

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(detectLang)

  const setLang = useCallback((l) => {
    if (!LANGS.includes(l)) return
    localStorage.setItem('lang', l)
    setLangState(l)
    document.documentElement.lang = l
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const t = useCallback((key, params) => {
    const dict = locales[lang] || pt
    let val = getNested(dict, key)
    if (val === undefined) {
      val = getNested(pt, key) ?? key
    }
    if (params && typeof val === 'string') {
      Object.entries(params).forEach(([k, v]) => {
        val = val.replaceAll(`{${k}}`, v)
      })
    }
    return val
  }, [lang])

  const formatDate = useCallback((date, fmt = 'dd/MM/yyyy') => {
    try {
      const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date
      return fnsFormat(d, fmt, { locale: dateLocales[lang] || ptBR })
    } catch {
      return String(date)
    }
  }, [lang])

  return (
    <I18nContext.Provider value={{ lang, setLang, t, formatDate, langs: LANGS }}>
      {children}
    </I18nContext.Provider>
  )
}

export const useI18n = () => {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
