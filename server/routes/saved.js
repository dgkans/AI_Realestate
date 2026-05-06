import express from 'express'
import mongoose from 'mongoose'
import Listing from '../models/Listing.js'
import SavedListing from '../models/SavedListing.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

router.get('/check/:listingId', requireAuth, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Database not available.', saved: false })
    }
    const { listingId } = req.params
    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return res.json({ saved: false })
    }
    const doc = await SavedListing.findOne({
      userId: req.userId,
      listingId,
    }).lean()
    return res.json({ saved: Boolean(doc) })
  } catch (error) {
    console.error('Saved check error:', error.message)
    return res.status(500).json({ message: 'Server error.', saved: false })
  }
})

router.get('/', requireAuth, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        message: 'Database not available.',
        dbConnected: false,
      })
    }
    const saves = await SavedListing.find({ userId: req.userId })
      .populate('listingId')
      .sort({ createdAt: -1 })
      .lean()

    const listings = saves.map((s) => s.listingId).filter(Boolean)
    res.json(listings)
  } catch (error) {
    console.error('Saved listings fetch error:', error.message)
    res.status(500).json({ message: 'Server error.' })
  }
})

router.post('/:listingId', requireAuth, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Database not available.' })
    }
    const { listingId } = req.params
    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return res.status(400).json({ message: 'Invalid listing id.' })
    }

    const listing = await Listing.findById(listingId)
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found.' })
    }

    try {
      await SavedListing.create({
        userId: req.userId,
        listingId,
      })
      return res.status(201).json({ saved: true })
    } catch (error) {
      if (error.code === 11000) {
        return res.json({ saved: true })
      }
      throw error
    }
  } catch (error) {
    console.error('Save listing error:', error.message)
    res.status(500).json({ message: 'Server error.' })
  }
})

router.delete('/:listingId', requireAuth, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Database not available.' })
    }
    const { listingId } = req.params
    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return res.status(400).json({ message: 'Invalid listing id.' })
    }

    await SavedListing.deleteOne({ userId: req.userId, listingId })
    return res.json({ saved: false })
  } catch (error) {
    console.error('Unsave listing error:', error.message)
    res.status(500).json({ message: 'Server error.' })
  }
})

export default router
