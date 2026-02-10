export default function Card({ className = '', children }) {
  return (
    <div
      className={`rounded-3xl border border-slate-800/80 bg-slate-900/70 text-slate-100 shadow-sm ${className}`}
    >
      {children}
    </div>
  )
}
