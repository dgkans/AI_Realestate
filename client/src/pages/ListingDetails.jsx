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
              </div>
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
