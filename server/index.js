import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import cookieParser from 'cookie-parser'
import authRoutes from './routes/auth.js'
import listingsRoutes from './routes/listings.js'
import { seedListings } from './seed/seedListings.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(express.json())
app.use(cookieParser())
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
)

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'api' })
})

app.use('/api/auth', authRoutes)
app.use('/api/listings', listingsRoutes)

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ message: 'Server error.' })
})

const startServer = async () => {
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET not set. Auth routes will not work correctly.')
  }
  if (process.env.MONGO_URI) {
    try {
      await mongoose.connect(process.env.MONGO_URI)
      console.log('MongoDB connected')
      await seedListings()
    } catch (error) {
      console.error('MongoDB connection error:', error.message)
    }
  } else {
    console.warn('MONGO_URI not set. Skipping MongoDB connection for now.')
  }

  app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`)
  })
}

startServer()
