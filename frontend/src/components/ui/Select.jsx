export default function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      )}
      <select
        className={`w-full px-3.5 py-2.5 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
          error
            ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-200'
            : 'border-gray-200 focus:border-brand-400 focus:ring-brand-200'
        } ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-rose-500 text-xs mt-1.5">{error}</p>}
    </div>
  )
}