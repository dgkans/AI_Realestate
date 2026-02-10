import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'
import Input from '../components/Input'
import PageContainer from '../components/PageContainer'

export default function Home() {
  const navigate = useNavigate()
  const [type, setType] = useState('all')
  const [city, setCity] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')

  const handleSearch = (event) => {
    event.preventDefault()
    const params = new URLSearchParams()
    if (city) params.set('city', city)
    if (minPrice) params.set('minPrice', minPrice)
    if (maxPrice) params.set('maxPrice', maxPrice)
    if (type && type !== 'all') params.set('type', type)
    navigate(`/list?${params.toString()}`)
  }

  return (
    <PageContainer className="pb-16">
      <div className="grid items-center gap-12 lg:grid-cols-[1.2fr,1fr]">
        <div className="space-y-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-400">
            Find your place
          </p>
          <h1 className="text-4xl font-semibold text-slate-100 sm:text-5xl">
            Find Real Estate &amp; Get Your Dream Place
          </h1>
          <p className="text-base text-slate-300">
            Discover curated homes, apartments, and rentals with AI-assisted search to match your
            lifestyle.
          </p>
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'All', value: 'all' },
              { label: 'Buy', value: 'buy' },
              { label: 'Rent', value: 'rent' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setType(option.value)}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                  type === option.value
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'border border-slate-700/60 bg-slate-900/40 text-slate-200 hover:border-slate-500'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <Card className="p-4">
            <form className="grid gap-4 md:grid-cols-[1.2fr,1fr,1fr,auto]" onSubmit={handleSearch}>
              <Input
                label="City"
                placeholder="Search city"
                value={city}
                onChange={(event) => setCity(event.target.value)}
              />
              <Input
                label="Min price"
                placeholder="0"
                value={minPrice}
                onChange={(event) => setMinPrice(event.target.value)}
              />
              <Input
                label="Max price"
                placeholder="5000"
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
              />
              <div className="flex items-end">
                <Button type="submit" className="w-full">
                  Search
                </Button>
              </div>
            </form>
          </Card>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { label: 'Years of Experience', value: '6+' },
              { label: 'Awards Gained', value: '200' },
              { label: 'Property Ready', value: '2000+' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4"
              >
                  <p className="text-2xl font-semibold text-slate-100">{stat.value}</p>
                  <p className="text-sm text-slate-300">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[32px] bg-slate-900/60 p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="h-52 rounded-3xl bg-[url('https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=600&q=60')] bg-cover bg-center" />
            <div className="flex flex-col gap-4">
              <div className="h-24 rounded-3xl bg-[url('https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=60')] bg-cover bg-center" />
              <div className="h-24 rounded-3xl bg-[url('https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=600&q=60')] bg-cover bg-center" />
            </div>
          </div>
          <div className="mt-6 rounded-3xl border border-slate-800/80 bg-slate-900/60 p-4 backdrop-blur">
            <p className="text-sm font-semibold text-slate-100">AI Match Score</p>
            <p className="text-xs text-slate-400">Based on 1200+ neighborhood signals.</p>
            <div className="mt-4 h-2 w-full rounded-full bg-slate-800/80">
              <div className="h-2 w-4/5 rounded-full bg-emerald-500" />
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
