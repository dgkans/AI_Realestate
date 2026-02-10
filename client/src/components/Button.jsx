const variantStyles = {
  primary:
    'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 focus:ring-indigo-400',
  secondary:
    'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 focus:ring-emerald-400',
  outline:
    'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-900',
  ghost: 'text-slate-700 hover:bg-slate-100',
}

export default function Button({
  as: Component = 'button',
  variant = 'primary',
  className = '',
  ...props
}) {
  return (
    <Component
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${variantStyles[variant]} ${className}`}
      {...props}
    />
  )
}
