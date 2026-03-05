import dotenv from 'dotenv'
import mongoose from 'mongoose'
import Listing from '../models/Listing.js'
import User from '../models/User.js'
import { seedListings } from '../seed/seedListings.js'

dotenv.config()

const run = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('MONGO_URI is not set. Cannot seed demo listings.')
      process.exit(1)
    }

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    })

    const systemUser = await User.findOne({ email: 'system@gdrealty.com' })

    if (systemUser) {
      const result = await Listing.deleteMany({ ownerId: systemUser._id })
      console.log(`Removed ${result.deletedCount} existing demo listings for system user.`)
    } else {
      console.log('System user not found yet. No existing demo listings to remove.')
    }

    await seedListings()

    console.log('Demo listings seeded successfully')
    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    console.error('Failed to seed demo listings:', error.message)
    process.exit(1)
  }
}

run()

