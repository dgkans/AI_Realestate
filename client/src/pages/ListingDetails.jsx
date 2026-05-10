import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageContainer from '../components/PageContainer'
import Button from '../components/Button'
import Card from '../components/Card'
import { SkeletonBlock, SkeletonLine } from '../components/Skeleton'
import mockListings from '../data/mockListings'
import {
  fetchSavedStatus,
  saveListing as saveListingApi,
  unsaveListing as unsaveListingApi,
} from '../data/listingsStore.js'
import { apiFetch, parseJson } from '../utils/api.js'
import { useAuth } from '../context/AuthContext.jsx'

function isMongoId(value) {
  return /^[a-f\d]{24}$/i.test(String(value || ''))
}

export default function ListingDetails() {
  const { id } = useParams()
  const { currentUser } = useAuth()
  const listingMongoId = useMemo(() => (isMongoId(id) ? id : null), [id])
  const [loading, setLoading] = useState(true)
  const [remoteListing, setRemoteListing] = useState(null)
  const [saved, setSaved] = useState(false)
  const [saveBusy, setSaveBusy] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [aiResult, setAiResult] = useState(null)
  const [advisor, setAdvisor] = useState(null)
  const [showAiDetails, setShowAiDetails] = useState(false)
  const [showComparables, setShowComparables] = useState(false)

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const res = await apiFetch(`/api/listings/${id}`, { credentials: 'omit' })
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

  useEffect(() => {
    let active = true
    const loadSaved = async () => {
      if (!currentUser || !listingMongoId) {
        if (active) setSaved(false)
        return
      }
      try {
        const { saved: isSaved } = await fetchSavedStatus(listingMongoId)
        if (active) setSaved(isSaved)
      } catch {
        if (active) setSaved(false)
      }
    }
    loadSaved()
    return () => {
      active = false
    }
  }, [currentUser, listingMongoId])

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
    setShowAiDetails(false)
    setShowComparables(false)

    const bedrooms = listing.beds ?? listing.bedrooms ?? 3
    const bathrooms = listing.baths ?? listing.bathrooms ?? 2
    const sqftLiving = listing.sqft_living ?? listing.sqftLiving ?? listing.area ?? 1800
    const sqftLot = listing.sqft_lot ?? listing.sqftLot ?? 5000
    const floors = listing.floors ?? 1
    const zipcode = listing.zipcode ?? 98178
    const yrBuilt = listing.yr_built ?? listing.yrBuilt ?? 1995
    const listedPrice = listing.price ?? listing.listed_price ?? 800000

    const preferredBudget =
      currentUser?.preferredBudget != null && currentUser.preferredBudget > 0
        ? Number(currentUser.preferredBudget)
        : null

    const riskTolerance = currentUser?.riskTolerance ? String(currentUser.riskTolerance) : null

    const payload = {
      bedrooms,
      bathrooms,
      sqft_living: sqftLiving,
      sqft_lot: sqftLot,
      floors,
      zipcode,
      yr_built: yrBuilt,
      listed_price: listedPrice,
      ...(preferredBudget != null ? { preferred_budget: preferredBudget } : {}),
    }

    try {
      const res = await apiFetch('/api/ml/analyze', {
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
        const compsRes = await apiFetch('/api/ml/comparables', {
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
        const advisorRes = await apiFetch('/api/ml/advisor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            predicted_price: data.predicted_price,
            listed_price: listedPrice,
            comps_avg_price: data.comps_avg_price,
            deviation_percent: data.deviation_pct,
            ...(preferredBudget != null ? { preferred_budget: preferredBudget } : {}),
            ...(riskTolerance ? { risk_tolerance: riskTolerance } : {}),
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

  const handleToggleSave = async () => {
    if (!listingMongoId || !currentUser) return
    setSaveBusy(true)
    try {
      if (saved) {
        await unsaveListingApi(listingMongoId)
        setSaved(false)
      } else {
        await saveListingApi(listingMongoId)
        setSaved(true)
      }
      window.dispatchEvent(new Event('saved-listings-change'))
    } catch (error) {
      window.alert(error.message || 'Could not update saved listings.')
    } finally {
      setSaveBusy(false)
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
                {!currentUser ? (
                  <Button as={Link} to="/login" state={{ from: `/listing/${id}` }}>
                    Save listing
                  </Button>
                ) : !listingMongoId ? (
                  <Button type="button" disabled variant="outline" className="opacity-60 cursor-not-allowed">
                    Save listing (catalog only)
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant={saved ? 'outline' : 'primary'}
                    onClick={handleToggleSave}
                    disabled={saveBusy}
                  >
                    {saveBusy ? 'Updating…' : saved ? 'Saved' : 'Save listing'}
                  </Button>
                )}
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
                <div className="mt-4 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 text-sm text-slate-100">
                  {(() => {
                    const clamp01 = (n) => Math.max(0, Math.min(1, n))
                    const confidenceRaw =
                      typeof aiResult.confidence_score === 'number'
                        ? clamp01(aiResult.confidence_score)
                        : null
                    const confidencePct =
                      confidenceRaw == null ? null : Number((confidenceRaw * 100).toFixed(0))
                    let confidenceLabel = null
                    if (confidenceRaw != null) {
                      confidenceLabel = confidenceRaw >= 0.75 ? 'High' : confidenceRaw < 0.5 ? 'Low' : 'Medium'
                    }

                    const deviationText = (() => {
                      const value = aiResult.deviation_pct
                      if (value > 200) return '>200%'
                      if (value < -200) return '<-200%'
                      return `${value.toFixed(1)}%`
                    })()

                    const pricingFlag = aiResult.pricing_flag
                    const flagLabel =
                      pricingFlag === 'overpriced'
                        ? 'Overpriced'
                        : pricingFlag === 'underpriced'
                        ? 'Underpriced'
                        : 'Fair'
                    const flagClasses =
                      pricingFlag === 'overpriced'
                        ? 'border-rose-500/40 bg-rose-500/10 text-rose-200'
                        : pricingFlag === 'underpriced'
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                        : 'border-amber-500/40 bg-amber-500/10 text-amber-200'

                    return (
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                              AI pricing insights
                            </p>
                            <p className="mt-1 text-sm text-slate-300">
                              Summary first, details on demand.
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${flagClasses}`}>
                              {flagLabel}
                            </span>
                            {confidenceRaw != null && (
                              <span className="rounded-full border border-slate-700/60 bg-slate-800/40 px-3 py-1 text-xs font-semibold text-slate-200">
                                Confidence: {confidenceLabel} ({confidencePct}%)
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          {[
                            { label: 'Listed', value: `$${listing.price.toLocaleString()}` },
                            {
                              label: 'Predicted (RF)',
                              value: `$${Math.round(aiResult.predicted_price).toLocaleString()}`,
                            },
                            {
                              label: 'Comps avg',
                              value: `$${Math.round(aiResult.comps_avg_price).toLocaleString()}`,
                            },
                            { label: 'Deviation', value: deviationText },
                          ].map((item) => (
                            <div
                              key={item.label}
                              className="rounded-2xl border border-slate-800/70 bg-slate-950/40 p-3"
                            >
                              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-600">
                                {item.label}
                              </p>
                              <p className="mt-1 text-lg font-semibold text-slate-50">
                                {item.value}
                              </p>
                            </div>
                          ))}
                        </div>

                        {aiResult.budget_message && (
                          <div className="rounded-2xl border border-sky-500/30 bg-sky-950/20 p-3 text-xs text-slate-100">
                            <p className="font-semibold text-sky-200">Budget fit</p>
                            <p className="mt-1 text-slate-300">{aiResult.budget_message}</p>
                          </div>
                        )}

                        {currentUser &&
                          (currentUser.preferredBudget == null || currentUser.preferredBudget <= 0) && (
                            <p className="text-xs text-slate-500">
                              Tip: set a preferred budget in Profile to personalize the analysis.
                            </p>
                          )}

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowAiDetails((v) => !v)}
                            className="rounded-xl border border-slate-700/70 bg-slate-900/40 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-900/60"
                          >
                            {showAiDetails ? 'Hide details' : 'Show details'}
                          </button>
                          {Array.isArray(aiResult.comparables) && aiResult.comparables.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setShowComparables((v) => !v)}
                              className="rounded-xl border border-slate-700/70 bg-slate-900/40 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-900/60"
                            >
                              {showComparables ? 'Hide comparables' : 'Show comparables'}
                            </button>
                          )}
                        </div>

                        {showAiDetails && (
                          <div className="rounded-2xl border border-slate-800/80 bg-slate-950/20 p-3 text-xs text-slate-100">
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
                        )}

                        {showComparables &&
                          Array.isArray(aiResult.comparables) &&
                          aiResult.comparables.length > 0 && (
                            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/20 p-3">
                              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
                                Comparable properties
                              </p>
                              <p className="mt-1 text-[11px] text-slate-500">
                                Retrieved using K-Nearest Neighbors similarity.
                              </p>
                              <div className="mt-3 overflow-hidden rounded-xl border border-slate-800/70">
                                <div className="grid grid-cols-[1fr,0.8fr,0.8fr] bg-slate-950/40 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                                  <span>Price</span>
                                  <span>Beds/Baths</span>
                                  <span>Sqft/ZIP</span>
                                </div>
                                <div className="divide-y divide-slate-800/70">
                                  {aiResult.comparables.slice(0, 5).map((comp, idx) => (
                                    <div
                                      key={idx}
                                      className="grid grid-cols-[1fr,0.8fr,0.8fr] px-3 py-2 text-xs text-slate-200"
                                    >
                                      <span className="font-semibold">
                                        ${Math.round(comp.price).toLocaleString()}
                                      </span>
                                      <span>
                                        {comp.bedrooms} / {comp.bathrooms}
                                      </span>
                                      <span>
                                        {comp.sqft_living} | {comp.zipcode}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                        {advisor && (
                          <div className="rounded-2xl border border-indigo-500/40 bg-indigo-950/25 p-3 text-xs text-slate-100">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <p className="font-semibold text-slate-50">Investment Advisor</p>
                                <p className="mt-1 text-slate-300">
                                  <span className="text-slate-400">Recommendation: </span>
                                  <span className="font-semibold text-indigo-300">
                                    {advisor.recommendation}
                                  </span>
                                </p>
                              </div>
                              <span
                                className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${
                                  advisor.risk === 'High'
                                    ? 'border-rose-500/40 bg-rose-500/10 text-rose-200'
                                    : advisor.risk === 'Low'
                                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                                    : 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                                }`}
                              >
                                Risk: {advisor.risk}
                              </span>
                            </div>
                            <div className="mt-2 space-y-2 text-[11px] text-slate-300">
                              <p>
                                <span className="text-slate-400">Why: </span>
                                {advisor.message}
                              </p>
                              {advisor.budget_note && (
                                <p>
                                  <span className="text-slate-400">Budget: </span>
                                  {advisor.budget_note}
                                </p>
                              )}
                              <p>
                                <span className="text-slate-400">Next step: </span>
                                Review inspection reports and your budget before making a final decision.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })()}
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
