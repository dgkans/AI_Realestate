import { Link } from 'react-router-dom'
import PageContainer from '../components/PageContainer'
import Card from '../components/Card'
import Button from '../components/Button'
import ListingGrid from '../components/ListingGrid'
import EmptyState from '../components/EmptyState'
import { useEffect, useState } from 'react'
import mockListings from '../data/mockListings'
import { fetchMyListings } from '../data/listingsStore'
import { useAuth } from '../context/AuthContext.jsx'

const mockUser = {
  username: 'john',
  email: 'john@gmail.com',
  avatarUrl:
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=60',
}

const mockMessages = [
  { id: 1, name: 'jane', message: 'Hi! Is the loft still available?' },
  { id: 2, name: 'Daniel Williams', message: 'Thanks so much for the tour!' },
  { id: 3, name: 'Sophia Davis', message: 'Great news, we are ready to apply.' },
  { id: 4, name: 'David Martinez', message: "I'll be waiting for details." },
]

export default function Profile() {
  const { currentUser } = useAuth()
  const isLoggedIn = Boolean(currentUser)
  const [storedListings, setStoredListings] = useState([])
  const listingsToShow = storedListings.slice(0, 3)

  useEffect(() => {
    let active = true
    const syncListings = async () => {
      if (!currentUser) {
        if (active) setStoredListings([])
        return
      }
      try {
        const data = await fetchMyListings()
        if (active) setStoredListings(data)
      } catch (error) {
        if (active) setStoredListings([])
      }
    }
    syncListings()
    window.addEventListener('storage', syncListings)
    window.addEventListener('listings-change', syncListings)
    return () => {
      active = false
      window.removeEventListener('storage', syncListings)
      window.removeEventListener('listings-change', syncListings)
    }
  }, [currentUser])

  return (
    <PageContainer>
      {!isLoggedIn && (
        <Card className="mb-6 flex flex-col items-start justify-between gap-4 p-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Please log in</h3>
            <p className="text-xs text-slate-300">
              Profile data is shown as a UI preview for Checkpoint 1.
            </p>
          </div>
          <Button as={Link} to="/login">
            Go to login
          </Button>
        </Card>
      )}
      <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
        <div className="flex flex-col gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <img
                  src={(currentUser || mockUser).avatarUrl}
                  alt={(currentUser || mockUser).username}
                  className="h-14 w-14 rounded-full border border-slate-700/70 object-cover"
                />
                <div>
                  <p className="text-lg font-semibold text-slate-100">
                    {(currentUser || mockUser).username}
                  </p>
                  <p className="text-sm text-slate-300">
                    {(currentUser || mockUser).email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button as={Link} to="/profile/update" variant="outline">
                  Update Profile
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-lg font-semibold text-slate-100">My Listings</h3>
                <p className="text-sm text-slate-300">
                  Manage your active posts and saved listings.
                </p>
              </div>
              <Button as={Link} to="/add" variant="primary">
                Create New Post
              </Button>
            </div>
            <div className="mt-6">
              {listingsToShow.length ? (
                <ListingGrid listings={listingsToShow} currentUser={currentUser} />
              ) : (
                <EmptyState
                  title="No listings yet"
                  description="Create a new post to showcase your property."
                />
              )}
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-100">Messages</h3>
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
              {mockMessages.length}
            </span>
          </div>
          <div className="mt-6 flex flex-col gap-3">
            {mockMessages.length ? (
              mockMessages.map((message) => (
                <div
                  key={message.id}
                  className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4"
                >
                  <p className="text-sm font-semibold text-slate-100">{message.name}</p>
                  <p className="mt-1 text-xs text-slate-400">{message.message}</p>
                </div>
              ))
            ) : (
              <EmptyState
                title="No messages yet"
                description="Incoming messages from buyers will appear here."
              />
            )}
          </div>
        </Card>
      </div>
    </PageContainer>
  )
}
