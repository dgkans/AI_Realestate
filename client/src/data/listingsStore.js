import mockListings from './mockListings'
import { parseJson } from '../utils/api.js'

export const fetchListings = async () => {
  const res = await fetch('/api/listings', { credentials: 'include' })
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
  const res = await fetch('/api/listings/mine', { credentials: 'include' })
  if (!res.ok) {
    throw new Error('Failed to load your listings.')
  }
  const data = await parseJson(res)
  return data || []
}

export const createListing = async (payload) => {
  const res = await fetch('/api/listings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })
  const data = await parseJson(res)
  if (!res.ok) {
    throw new Error(data?.message || 'Failed to create listing.')
  }
  return data
}

export const updateListing = async (id, payload) => {
  const res = await fetch(`/api/listings/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })
  const data = await parseJson(res)
  if (!res.ok) {
    throw new Error(data?.message || 'Failed to update listing.')
  }
  return data
}

export const deleteListing = async (id) => {
  const res = await fetch(`/api/listings/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  const data = await parseJson(res)
  if (!res.ok) {
    throw new Error(data?.message || 'Failed to delete listing.')
  }
  return data
}

export const fallbackListings = () => mockListings
