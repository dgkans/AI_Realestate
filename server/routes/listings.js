import express from 'express'
import Listing from '../models/Listing.js'
import User from '../models/User.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const listings = await Listing.find().sort({ createdAt: -1 })
    res.json(listings)
  } catch (error) {
    res.status(500).json({ message: 'Server error.' })
  }
})

router.get('/mine', requireAuth, async (req, res) => {
  try {
    const listings = await Listing.find({ ownerId: req.userId }).sort({ createdAt: -1 })
    res.json(listings)
  } catch (error) {
    res.status(500).json({ message: 'Server error.' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found.' })
    }
    return res.json(listing)
  } catch (error) {
    return res.status(500).json({ message: 'Server error.' })
  }
})

router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      title,
      price,
      address,
      city,
      beds,
      baths,
      type,
      images,
      lat,
      lng,
      size,
      schoolDistance,
      busDistance,
      restaurantDistance,
      description,
    } = req.body

    if (!title || price === undefined || !address || !city) {
      return res.status(400).json({ message: 'Title, price, address, and city are required.' })
    }

    const owner = await User.findById(req.userId).select('username')
    if (!owner) {
      return res.status(401).json({ message: 'Not authenticated.' })
    }

    const listing = await Listing.create({
      title,
      price,
      address,
      city,
      beds: Number(beds || 0),
      baths: Number(baths || 0),
      type: type || 'rent',
      images: images || [],
      lat: Number(lat || 0),
      lng: Number(lng || 0),
      size: Number(size || 0),
      schoolDistance: Number(schoolDistance || 0),
      busDistance: Number(busDistance || 0),
      restaurantDistance: Number(restaurantDistance || 0),
      description: description || '',
      ownerId: owner._id,
      ownerName: owner.username,
    })

    res.status(201).json(listing)
  } catch (error) {
    res.status(500).json({ message: 'Server error.' })
  }
})

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found.' })
    }
    if (listing.ownerId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Forbidden.' })
    }

    Object.assign(listing, req.body)
    await listing.save()
    res.json(listing)
  } catch (error) {
    res.status(500).json({ message: 'Server error.' })
  }
})

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found.' })
    }
    if (listing.ownerId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Forbidden.' })
    }

    await listing.deleteOne()
    res.json({ message: 'Listing deleted.' })
  } catch (error) {
    res.status(500).json({ message: 'Server error.' })
  }
})

export default router
