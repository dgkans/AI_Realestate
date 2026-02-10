import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import PageContainer from '../components/PageContainer'
import Input from '../components/Input'
import Card from '../components/Card'
import ListingGrid from '../components/ListingGrid'
import EmptyState from '../components/EmptyState'
import { SkeletonBlock, SkeletonLine } from '../components/Skeleton'
import { fetchListings, fallbackListings } from '../data/listingsStore'
import { useAuth } from '../context/AuthContext.jsx'

const defaultFilters = {
  city: '',
  minPrice: '',
  maxPrice: '',
  type: '',
}

export default function Listings() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [listingsData, setListingsData] = useState(() => fallbackListings())
  const { currentUser } = useAuth()

  const filters = {
    city: searchParams.get('city') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    type: searchParams.get('type') || '',
  }

  const updateFilters = (nextFilters) => {
    const params = new URLSearchParams()
    Object.entries(nextFilters).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })
    setSearchParams(params)
  }

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const data = await fetchListings()
        if (active) {
          setListingsData(data)
        }
      } catch (error) {
        if (active) {
          setListingsData(fallbackListings())
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  const filteredListings = useMemo(() => {
    return listingsData.filter((listing) => {
      if (filters.city && !listing.city.toLowerCase().includes(filters.city.toLowerCase())) {
        return false
      }
      if (filters.type && filters.type !== 'all' && listing.type !== filters.type) return false
      if (filters.minPrice && listing.price < Number(filters.minPrice)) return false
      if (filters.maxPrice && listing.price > Number(filters.maxPrice)) return false
      return true
    })
  }, [filters, listingsData])

  useEffect(() => {
    const syncListings = async () => {
      try {
        const data = await fetchListings()
        setListingsData(data)
      } catch (error) {
        setListingsData(fallbackListings())
      }
    }
    window.addEventListener('storage', syncListings)
    window.addEventListener('listings-change', syncListings)
    return () => {
      window.removeEventListener('storage', syncListings)
      window.removeEventListener('listings-change', syncListings)
    }
  }, [])

  return (
    <PageContainer>
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-100">Listings</h1>
        <p className="text-sm text-slate-300">
          {filteredListings.length} homes found for your search.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="flex flex-col gap-6">
          <Card className="p-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Input
                label="City"
                placeholder="Search city"
                value={filters.city}
                onChange={(event) =>
                  updateFilters({ ...filters, city: event.target.value })
                }
              />
              <Input
                label="Min price"
                placeholder="0"
                value={filters.minPrice}
                onChange={(event) =>
                  updateFilters({ ...filters, minPrice: event.target.value })
                }
              />
              <Input
                label="Max price"
                placeholder="5000"
                value={filters.maxPrice}
                onChange={(event) =>
                  updateFilters({ ...filters, maxPrice: event.target.value })
                }
              />
              <label className="flex w-full flex-col gap-2 text-sm font-medium text-slate-200">
                <span>Type</span>
                <select
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                  value={filters.type}
                  onChange={(event) =>
                    updateFilters({ ...filters, type: event.target.value })
                  }
                >
                  <option value="">Any</option>
                  <option value="buy">Buy</option>
                  <option value="rent">Rent</option>
                </select>
              </label>
            </div>
            <button
              type="button"
              className="mt-4 text-xs font-semibold text-indigo-300"
              onClick={() => updateFilters(defaultFilters)}
            >
              Reset filters
            </button>
          </Card>

          {loading ? (
            <div className="flex flex-col gap-4">
              {[...Array(4)].map((_, index) => (
                <Card key={index} className="p-4">
                  <div className="flex gap-4">
                    <SkeletonBlock className="h-24 w-32" />
                    <div className="flex flex-1 flex-col gap-3">
                      <SkeletonLine className="h-4 w-2/3" />
                      <SkeletonLine className="h-3 w-1/2" />
                      <SkeletonLine className="h-3 w-1/3" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredListings.length ? (
            <ListingGrid listings={filteredListings} currentUser={currentUser} />
          ) : (
            <EmptyState
              title="No listings found"
              description="Try adjusting your filters to see more homes."
            />
          )}
        </div>
        <Card className="sticky top-24 h-[520px] p-6">
          <div className="flex h-full flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-800/80 bg-slate-900/40 text-center">
            <p className="text-sm font-semibold text-slate-200">Map placeholder</p>
            <p className="text-xs text-slate-400">
              Interactive map will be added in Milestone 2.
            </p>
          </div>
        </Card>
      </div>
    </PageContainer>
  )
}
