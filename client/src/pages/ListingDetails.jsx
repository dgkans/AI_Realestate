import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageContainer from '../components/PageContainer'
import Button from '../components/Button'
import Card from '../components/Card'
import { SkeletonBlock, SkeletonLine } from '../components/Skeleton'
import mockListings from '../data/mockListings'
import { parseJson } from '../utils/api.js'

export default function ListingDetails() {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [remoteListing, setRemoteListing] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [aiResult, setAiResult] = useState(null)
  const [advisor, setAdvisor] = useState(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const res = await fetch(`/api/listings/${id}`)
        if (!res.ok) {
          if (active) setRemoteListing(null)
          return
        }
        const data = await parseJson(res)
        if (active) setRemoteListing(data)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [id])

  const listing = useMemo(() => {
    if (remoteListing) return remoteListing
    return mockListings.find((item) => item.id === id)
  }, [id, remoteListing])

  const handleAnalyzeWithAi = async () => {
    if (!listing) return
    setAiLoading(true)
    setAiError('')
    setAiResult(null)
    setAdvisor(null)

    const bedrooms = listing.beds ?? listing.bedrooms ?? 3
    const bathrooms = listing.baths ?? listing.bathrooms ?? 2
    const sqftLiving = listing.sqft_living ?? listing.sqftLiving ?? listing.area ?? 1800
    const sqftLot = listing.sqft_lot ?? listing.sqftLot ?? 5000
    const floors = listing.floors ?? 1
    const zipcode = listing.zipcode ?? 98178
    const yrBuilt = listing.yr_built ?? listing.yrBuilt ?? 1995
    const listedPrice = listing.price ?? listing.listed_price ?? 800000

    const payload = {
      bedrooms,
      bathrooms,
      sqft_living: sqftLiving,
      sqft_lot: sqftLot,
      floors,
      zipcode,
      yr_built: yrBuilt,
      listed_price: listedPrice,
    }

    try {
      const res = await fetch('/api/ml/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await parseJson(res)
      if (!res.ok) {
        throw new Error(data?.message || 'AI analysis failed.')
      }

      // Fetch comparable properties separately and merge into result
      let comparables = []
      try {
        const compsRes = await fetch('/api/ml/comparables', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const compsData = await parseJson(compsRes)
        if (compsRes.ok && Array.isArray(compsData?.comparables)) {
          comparables = compsData.comparables
        }
      } catch {
        // Ignore comparables errors; keep primary analysis
      }

      setAiResult({ ...data, comparables })

      // Call investment advisor endpoint with the aggregated analysis values
      try {
        const advisorRes = await fetch('/api/ml/advisor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            predicted_price: data.predicted_price,
            listed_price: listedPrice,
            comps_avg_price: data.comps_avg_price,
            deviation_percent: data.deviation_pct,
          }),
        })
        const advisorData = await parseJson(advisorRes)
        if (advisorRes.ok && advisorData?.recommendation) {
          setAdvisor(advisorData)
        }
      } catch {
        // Advisor is best-effort; ignore failures
      }
    } catch (error) {
      setAiError(error.message || 'AI analysis failed.')
    } finally {
      setAiLoading(false)
    }
  }

  if (!listing && !loading) {
    return (
      <PageContainer>
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold text-slate-100">Listing not found</h2>
          <p className="mt-2 text-sm text-slate-300">
            Try browsing other homes in the listings page.
          </p>
          <Button as={Link} to="/list" className="mt-4">
            Back to listings
          </Button>
        </Card>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      {loading ? (
        <div className="grid gap-6 lg:grid-cols-[1.6fr,1fr]">
          <div className="flex flex-col gap-4">
            <SkeletonBlock className="h-72 w-full" />
            <SkeletonLine className="h-4 w-3/4" />
            <SkeletonLine className="h-4 w-1/2" />
          </div>
          <Card className="p-6">
            <SkeletonLine className="h-4 w-1/2" />
            <SkeletonLine className="mt-4 h-3 w-2/3" />
            <SkeletonLine className="mt-2 h-3 w-1/3" />
          </Card>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.6fr,1fr]">
          <div className="flex flex-col gap-6">
            <div className="grid gap-3 md:grid-cols-2">
              <img
                src={
                  listing.images?.[0] ||
                  'https://images.unsplash.com/photo-1502005097973-6a7082348e28?auto=format&fit=crop&w=900&q=60'
                }
                alt={listing.title}
                className="h-64 w-full rounded-3xl object-cover md:row-span-2"
              />
              {(listing.images || [])
                .slice(1)
                .map((img, index) => (
                  <img
                    key={`${img}-${index}`}
                    src={img}
                    alt={`${listing.title} ${index + 2}`}
                    className="h-32 w-full rounded-3xl object-cover"
                  />
                ))}
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-slate-100">{listing.title}</h1>
              <p className="mt-2 text-sm text-slate-300">{listing.address}</p>
            </div>
            <Card className="p-6">
              <h2 className="text-base font-semibold text-slate-100">Key facts</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {[
                  { label: 'Price', value: `$${listing.price.toLocaleString()}` },
                  { label: 'Bedrooms', value: listing.beds },
                  { label: 'Bathrooms', value: listing.baths },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 text-center"
                  >
                    <p className="text-xs text-slate-400">{item.label}</p>
                    <p className="text-lg font-semibold text-slate-100">{item.value}</p>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-6">
              <h2 className="text-base font-semibold text-slate-100">About this home</h2>
              <p className="mt-3 text-sm text-slate-300">{listing.description}</p>
            </Card>
          </div>
          <div className="flex flex-col gap-4">
            <Card className="p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-indigo-300">
                For {listing.type}
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-100">
                ${listing.price.toLocaleString()}
              </p>
              <p className="mt-2 text-sm text-slate-300">{listing.city}</p>
              <div className="mt-6 flex flex-col gap-3">
                <Button>Save Listing</Button>
                <Button variant="outline">Message Agent</Button>
                <Button variant="outline" onClick={handleAnalyzeWithAi} disabled={aiLoading}>
                  {aiLoading ? 'Analyzing…' : 'Analyze with AI'}
                </Button>
              </div>
              {aiError && (
                <p className="mt-3 text-xs text-red-400">
                  {aiError}
                </p>
              )}
              {aiResult && (
                <div className="mt-4 space-y-2 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 text-sm text-slate-100">
                  <p className="font-semibold">AI pricing insights</p>
                  <p>
                    <span className="text-slate-400">Listed price: </span>$
                    {listing.price.toLocaleString()}
                  </p>
                  <p>
                    <span className="text-slate-400">
                      Model predicted price (Random Forest):{' '}
                    </span>
                    $
                    {Math.round(aiResult.predicted_price).toLocaleString()}
                  </p>
                  <p>
                    <span className="text-slate-400">Comps average: </span>$
                    {Math.round(aiResult.comps_avg_price).toLocaleString()}
                  </p>
                  <p>
                    <span className="text-slate-400">Deviation: </span>
                    {(() => {
                      const value = aiResult.deviation_pct
                      if (value > 200) return '>200%'
                      if (value < -200) return '<-200%'
                      return `${value.toFixed(1)}%`
                    })()}
                  </p>
                  <p>
                    <span className="text-slate-400">Pricing flag (vs model): </span>
                    <span
                      className={`uppercase tracking-wide font-semibold ${
                        aiResult.pricing_flag === 'overpriced'
                          ? 'text-rose-400'
                          : aiResult.pricing_flag === 'underpriced'
                          ? 'text-emerald-400'
                          : 'text-amber-300'
                      }`}
                    >
                      {aiResult.pricing_flag}
                    </span>
                  </p>
                  <p className="text-xs text-slate-400">
                    {(() => {
                      const listed = listing.price
                      const compsAvg = aiResult.comps_avg_price
                      const compsDeltaPct =
                        compsAvg > 0 ? ((listed - compsAvg) / compsAvg) * 100 : 0

                      let compsPhrase = 'close to'
                      if (compsDeltaPct > 5) compsPhrase = 'above'
                      if (compsDeltaPct < -5) compsPhrase = 'below'

                      const compsSummary =
                        compsAvg > 0 ? ` Comps average is ${compsPhrase} list price.` : ''

                      if (aiResult.pricing_flag === 'overpriced') {
                        return `Listed above the model estimate.${compsSummary}`
                      }
                      if (aiResult.pricing_flag === 'underpriced') {
                        return `Listed below the model estimate.${compsSummary}`
                      }
                      return `Within expected range of the model estimate.${compsSummary}`
                    })()}
                  </p>
                  <div
                    className={`mt-3 rounded-2xl border p-3 text-xs text-slate-100 ${
                      aiResult.pricing_flag === 'overpriced'
                        ? 'border-rose-500/50 bg-rose-950/40'
                        : aiResult.pricing_flag === 'underpriced'
                        ? 'border-emerald-500/40 bg-emerald-950/30'
                        : 'border-sky-500/30 bg-sky-950/30'
                    }`}
                  >
                    <p className="font-semibold text-slate-50">AI Insight</p>
                    <p className="mt-1 text-slate-300">
                      {(() => {
                        const listed = listing.price
                        const d = aiResult.deviation_pct
                        const predictedRaw = aiResult.predicted_price
                        const compsAvgRaw = aiResult.comps_avg_price

                        const predicted = Math.round(predictedRaw).toLocaleString()
                        const compsAvg = Math.round(compsAvgRaw).toLocaleString()

                        const compsDeltaPct =
                          compsAvgRaw > 0 ? ((listed - compsAvgRaw) / compsAvgRaw) * 100 : 0
                        const compsDeltaAbs = Math.abs(compsDeltaPct)

                        let compsRelation = 'close to'
                        if (compsDeltaPct > 5) compsRelation = 'above'
                        if (compsDeltaPct < -5) compsRelation = 'below'

                        const compsSentence =
                          compsAvgRaw > 0
                            ? ` Comparable average is ~$${compsAvg}, and this listing is ${compsRelation} that level${
                                compsDeltaAbs > 0 ? ` (~${compsDeltaAbs.toFixed(1)}%)` : ''
                              }.`
                            : ''

                        if (d > 10) {
                          return `Model signals a premium: the asking price is ~${d.toFixed(
                            1
                          )}% above the estimated fair value (~$${predicted}).${compsSentence} Buyers may want to negotiate or confirm unique features justify the premium.`
                        }
                        if (d < -5) {
                          return `Model signals a discount: the asking price is ~${Math.abs(
                            d
                          ).toFixed(1)}% below the estimated fair value (~$${predicted}).${compsSentence} This can be a value opportunity, but it can also reflect condition or urgency—worth a closer look.`
                        }
                        return `Model signals fair value: the asking price is close to the estimate (~$${predicted}).${compsSentence} Overall, the listing aligns with typical pricing for similar homes.`
                      })()}
                    </p>
                  </div>
                  {Array.isArray(aiResult.comparables) && aiResult.comparables.length > 0 && (
                    <div className="mt-4 space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
                        Comparable Properties
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Comparable properties retrieved using K-Nearest Neighbors similarity.
                      </p>
                      {aiResult.comparables.slice(0, 5).map((comp, idx) => (
                        <p key={idx} className="text-xs text-slate-200">
                          ${Math.round(comp.price).toLocaleString()} | {comp.bedrooms} bed |{' '}
                          {comp.bathrooms} bath | {comp.sqft_living} sqft | ZIP {comp.zipcode}
                        </p>
                      ))}
                    </div>
                  )}
                  {advisor && (
                    <div className="mt-4 rounded-2xl border border-indigo-500/50 bg-indigo-950/40 p-3 text-xs text-slate-100">
                      <p className="font-semibold text-slate-50">Investment Advisor</p>
                      <p className="mt-1 text-slate-300">
                        <span className="text-slate-400">Recommendation: </span>
                        <span className="font-semibold text-indigo-300">
                          {advisor.recommendation}
                        </span>
                      </p>
                      <p className="mt-1 text-slate-300">
                        <span className="text-slate-400">Risk level: </span>
                        <span
                          className={`font-semibold ${
                            advisor.risk === 'High'
                              ? 'text-rose-400'
                              : advisor.risk === 'Low'
                              ? 'text-emerald-400'
                              : 'text-amber-300'
                          }`}
                        >
                          {advisor.risk}
                        </span>
                      </p>
                      <ul className="mt-2 space-y-1 text-[11px] text-slate-300">
                        <li>
                          <span className="text-slate-400">Suggested action: </span>
                          {advisor.recommendation === 'NEGOTIATE' &&
                            'Target a lower offer and use the model and comps as support.'}
                          {advisor.recommendation === 'FAIR VALUE' &&
                            'Proceed at or near list price, with standard negotiation room.'}
                          {advisor.recommendation === 'POTENTIAL OPPORTUNITY' &&
                            'Consider moving quickly if due diligence (inspection, financing, etc.) checks out.'}
                        </li>
                        <li>
                          <span className="text-slate-400">Rationale: </span>
                          {advisor.message}
                        </li>
                        <li>
                          <span className="text-slate-400">Next step: </span>
                          {'Review inspection reports and your budget before making a final decision.'}
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </Card>
            <Card className="p-6">
              <h3 className="text-sm font-semibold text-slate-100">Neighborhood insights</h3>
              <p className="mt-3 text-sm text-slate-300">
                AI highlights for commute, safety, and lifestyle fit will be available soon.
              </p>
            </Card>
          </div>
        </div>
      )}
    </PageContainer>
  )
}
