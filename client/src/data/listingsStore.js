import mockListings from './mockListings'
import { apiFetch, parseJson } from '../utils/api.js'

export const fetchListings = async () => {
  const res = await apiFetch('/api/listings')
  const data = await parseJson(res)
  if (res.status === 503 && data?.dbConnected === false) {
    const err = new Error(data?.message || 'Database not available.')
    err.dbUnavailable = true
    throw err
  }
  if (!res.ok) {
    throw new Error(data?.message || 'Failed to load listings.')
  }
  return data || []
}

export const fetchMyListings = async () => {
  const res = await apiFetch('/api/listings/mine')
  if (!res.ok) {
    throw new Error('Failed to load your listings.')
  }
  const data = await parseJson(res)
  return data || []
}

export const createListing = async (payload) => {
  const res = await apiFetch('/api/listings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await parseJson(res)
  if (!res.ok) {
    throw new Error(data?.message || 'Failed to create listing.')
  }
  return data
}

export const updateListing = async (id, payload) => {
  const res = await apiFetch(`/api/listings/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await parseJson(res)
  if (!res.ok) {
    throw new Error(data?.message || 'Failed to update listing.')
  }
  return data
}

export const deleteListing = async (id) => {
  const res = await apiFetch(`/api/listings/${id}`, {
    method: 'DELETE',
  })
  const data = await parseJson(res)
  if (!res.ok) {
    throw new Error(data?.message || 'Failed to delete listing.')
  }
  return data
}

export const fetchSavedListings = async () => {
  const res = await apiFetch('/api/saved')
  const data = await parseJson(res)
  if (!res.ok) {
    throw new Error(data?.message || 'Failed to load saved listings.')
  }
  return data || []
}

export const fetchSavedStatus = async (listingId) => {
  const res = await apiFetch(`/api/saved/check/${listingId}`)
  const data = await parseJson(res)
  if (!res.ok) {
    return { saved: false }
  }
  return { saved: Boolean(data?.saved) }
}

export const saveListing = async (listingId) => {
  const res = await apiFetch(`/api/saved/${listingId}`, {
    method: 'POST',
  })
  const data = await parseJson(res)
  if (!res.ok) {
    throw new Error(data?.message || 'Could not save listing.')
  }
  return data
}

export const unsaveListing = async (listingId) => {
  const res = await apiFetch(`/api/saved/${listingId}`, {
    method: 'DELETE',
  })
  const data = await parseJson(res)
  if (!res.ok) {
    throw new Error(data?.message || 'Could not remove saved listing.')
  }
  return data
}

export const fallbackListings = () => mockListings
