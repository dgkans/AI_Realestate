import Card from './Card'

export default function AuthForm({ title, subtitle, children, footer }) {
  return (
    <Card className="mx-auto w-full max-w-md p-8 shadow-lg">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-100">{title}</h1>
        <p className="text-sm text-slate-300">{subtitle}</p>
      </div>
      <div className="mt-6 flex flex-col gap-4">{children}</div>
      {footer && <div className="mt-6 text-sm text-slate-300">{footer}</div>}
    </Card>
  )
}
