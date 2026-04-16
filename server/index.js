import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import cookieParser from 'cookie-parser'
import authRoutes from './routes/auth.js'
import listingsRoutes from './routes/listings.js'
import mlRoutes from './routes/ml.js'
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
  res.json({
    status: 'ok',
    service: 'api',
    dbConnected: mongoose.connection.readyState === 1,
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/listings', listingsRoutes)
app.use('/api/ml', mlRoutes)

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ message: 'Server error.' })
})

const startServer = async () => {
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET not set. Auth routes will not work correctly.')
  }
  app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`)
  })

  if (!process.env.MONGO_URI) {
    console.warn('MONGO_URI not set. Skipping MongoDB connection for now.')
    return
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    })
    console.log('MongoDB connected')
    await seedListings()
  } catch (error) {
    console.error('MongoDB connection error:', error.message)
    console.error('Error code:', error.code || 'N/A')
    if (error.reason) {
      console.error('Reason:', error.reason)
    }
    if (error.message && error.message.includes('IP')) {
      console.error('→ Fix: In Atlas go to Network Access, add your current IP (or 0.0.0.0/0 for dev). Wait 1–2 min and restart.')
    }
    if (error.message && (error.message.includes('auth') || error.message.includes('Authentication'))) {
      console.error('→ Fix: Check MONGO_URI username/password. If password has special chars (@ # $ etc), URL-encode them.')
    }
    if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
      console.error('→ Fix: Check internet and that MONGO_URI host matches your Atlas cluster (e.g. cluster0.xxxxx.mongodb.net).')
    }
  }
}

startServer()
