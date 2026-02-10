export function SkeletonBlock({ className = '' }) {
  return <div className={`animate-pulse rounded-xl bg-slate-200 ${className}`} />
}

export function SkeletonLine({ className = '' }) {
  return <div className={`animate-pulse rounded-md bg-slate-200 ${className}`} />
}
