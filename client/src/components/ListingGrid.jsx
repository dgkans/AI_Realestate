import ListingCard from './ListingCard'

export default function ListingGrid({ listings, currentUser }) {
  return (
    <div className="flex flex-col gap-4">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} currentUser={currentUser} />
      ))}
    </div>
  )
}
