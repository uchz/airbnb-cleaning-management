import { useI18n } from '../../contexts/I18nContext'

const LABELS = { pt: 'PT', en: 'EN', es: 'ES' }

export default function LanguageSwitcher({ variant = 'default' }) {
  const { lang, setLang, langs } = useI18n()

  const base =
    variant === 'dark'
      ? 'text-gray-400 hover:text-white hover:bg-white/5'
      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'

  return (
    <div className="flex items-center gap-1">
      {langs.map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-label={`Switch to ${l}`}
          className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${
            lang === l ? 'bg-brand-600 text-white shadow' : base
          }`}
        >
          {LABELS[l]}
        </button>
      ))}
    </div>
  )
}
