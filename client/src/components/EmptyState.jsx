export default function EmptyState({ title, description }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-800/80 bg-slate-900/60 p-10 text-center">
      <h3 className="text-base font-semibold text-slate-100">{title}</h3>
      <p className="mt-2 text-sm text-slate-400">{description}</p>
    </div>
  )
}
