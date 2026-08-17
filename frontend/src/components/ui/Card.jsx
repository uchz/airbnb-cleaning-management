export default function Card({ children, className = '', hover = false }) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)] border border-gray-100 ${
        hover ? 'transition-all duration-300 hover:shadow-[0_4px_16px_rgba(0,0,0,0.10)] hover:-translate-y-0.5' : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}