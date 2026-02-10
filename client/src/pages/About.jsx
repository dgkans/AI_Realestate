import PageContainer from '../components/PageContainer'
import Card from '../components/Card'

export default function About() {
  return (
    <PageContainer>
      <div className="grid gap-6 lg:grid-cols-[1.2fr,1fr]">
        <Card className="p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-300">
            About GD Realty
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-100">
            Real estate powered by practical AI
          </h1>
          <p className="mt-4 text-sm text-slate-300">
            GD Realty combines trusted local expertise with AI-driven insights to help buyers,
            renters, and agents make confident decisions. We prioritize transparency, smart
            matching, and a seamless search experience.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              { label: 'Cities covered', value: '85+' },
              { label: 'Listings indexed', value: '12k' },
              { label: 'Avg. match score', value: '92%' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl bg-slate-900/60 p-4 text-center"
              >
                <p className="text-lg font-semibold text-slate-100">{stat.value}</p>
                <p className="text-xs text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-8">
          <h2 className="text-lg font-semibold text-slate-100">Our promise</h2>
          <ul className="mt-4 flex flex-col gap-3 text-sm text-slate-300">
            <li>Neighborhood signals that explain the “why” behind each match.</li>
            <li>Curated inventory updated daily with real agent insights.</li>
            <li>Simple, clean UI that stays fast on any device.</li>
            <li>Privacy-first approach to your search preferences.</li>
          </ul>
          <div className="mt-6 rounded-2xl border border-dashed border-slate-800/80 bg-slate-900/60 p-4 text-sm text-slate-400">
            Next up: AI-powered affordability forecasting and commute scoring.
          </div>
        </Card>
      </div>
    </PageContainer>
  )
}
