export default function Input({
  label,
  helper,
  as: Component = 'input',
  className = '',
  ...props
}) {
  return (
    <label className="flex w-full flex-col gap-2 text-sm font-medium text-slate-200">
      {label && <span>{label}</span>}
      <Component
        className={`w-full rounded-xl border border-slate-700/80 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 ${className}`}
        {...props}
      />
      {helper && <span className="text-xs text-slate-400">{helper}</span>}
    </label>
  )
}
