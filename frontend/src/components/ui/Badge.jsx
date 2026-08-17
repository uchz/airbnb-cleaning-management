export default function Badge({ children, color = 'gray' }) {
  const colors = {
    gray: 'bg-gray-100 text-gray-600',
    blue: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
    green: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    red: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
    yellow: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    purple: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
    brand: 'bg-brand-50 text-brand-700 ring-1 ring-brand-200',
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors[color]}`}>
      {children}
    </span>
  )
}