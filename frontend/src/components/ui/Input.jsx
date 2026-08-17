export default function Input({ label, error, className = '', icon, ...props }) {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>
        )}
        <input
          className={`w-full px-3.5 py-2.5 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all placeholder:text-gray-400 ${
            icon ? 'pl-10' : ''
          } ${
            error
              ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-200'
              : 'border-gray-200 focus:border-brand-400 focus:ring-brand-200'
          } ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-rose-500 text-xs mt-1.5">{error}</p>}
    </div>
  )
}