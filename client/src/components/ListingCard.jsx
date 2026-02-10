import { Link } from 'react-router-dom'
import Card from './Card'
import Button from './Button'
import { deleteListing } from '../data/listingsStore'

export default function ListingCard({ listing, currentUser }) {
  const isOwner = Boolean(
    currentUser &&
      listing.ownerId &&
      (listing.ownerId === currentUser.id || listing.ownerId === currentUser.id?.toString())
  )

  return (
    <Card className="flex flex-col overflow-hidden sm:flex-row">
      <img
        src={
          listing.images?.[0] ||
          'https://images.unsplash.com/photo-1502005097973-6a7082348e28?auto=format&fit=crop&w=900&q=60'
        }
        alt={listing.title}
        className="h-44 w-full object-cover sm:h-auto sm:w-44"
      />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-100">{listing.title}</h3>
            <p className="text-sm text-slate-400">{listing.address}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
              ${listing.price.toLocaleString()}
            </span>
            {isOwner && (
              <span className="rounded-full bg-indigo-500/15 px-3 py-1 text-[11px] font-semibold text-indigo-300">
                Your listing
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-slate-400">
          <span>{listing.city}</span>
          <span>{listing.beds} beds</span>
          <span>{listing.baths} baths</span>
          <span className="rounded-full bg-slate-800/70 px-2 py-0.5 text-[11px] uppercase tracking-wide text-slate-300">
            {listing.type}
          </span>
        </div>
        {isOwner && (
          <div className="flex flex-wrap gap-2">
            <Button
              as={Link}
              to={`/edit/${listing._id || listing.id}`}
              variant="outline"
              className="px-3 py-1 text-xs"
            >
              Update
            </Button>
            <Button
              variant="ghost"
              className="px-3 py-1 text-xs text-rose-300 hover:bg-rose-500/10"
              onClick={async () => {
                const confirmed = window.confirm('Delete this listing?')
                if (!confirmed) return
                try {
                  await deleteListing(listing._id || listing.id)
                  window.dispatchEvent(new Event('listings-change'))
                } catch (error) {
                  window.alert(error.message)
                }
              }}
            >
              Delete
            </Button>
          </div>
        )}
        <Link
          to={`/listing/${listing._id || listing.id}`}
          className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
        >
          View details →
        </Link>
      </div>
    </Card>
  )
}
