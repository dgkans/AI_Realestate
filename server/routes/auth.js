import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const router = express.Router()

const createToken = (userId) => {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

const setAuthCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
}

router.post('/register', async (req, res) => {
  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'JWT secret not configured.' })
    }
    const { username, email, password } = req.body
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required.' })
    }

    const existing = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    })
    if (existing) {
      return res.status(409).json({ message: 'User already exists.' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await User.create({
      username,
      email: email.toLowerCase(),
      passwordHash,
      avatarUrl:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=60',
    })

    const token = createToken(user._id.toString())
    setAuthCookie(res, token)

    return res.status(201).json({
      id: user._id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
    })
  } catch (error) {
    return res.status(500).json({ message: 'Server error.' })
  }
})

router.post('/login', async (req, res) => {
  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'JWT secret not configured.' })
    }
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' })
    }

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' })
    }

    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials.' })
    }

    const token = createToken(user._id.toString())
    setAuthCookie(res, token)

    return res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
    })
  } catch (error) {
    return res.status(500).json({ message: 'Server error.' })
  }
})

router.post('/logout', (req, res) => {
  res.clearCookie('token')
  res.json({ message: 'Logged out.' })
})

router.get('/me', async (req, res) => {
  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'JWT secret not configured.' })
    }
    const token = req.cookies?.token
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated.' })
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(payload.sub).select('username email avatarUrl')
    if (!user) {
      return res.status(401).json({ message: 'Not authenticated.' })
    }

    return res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
    })
  } catch (error) {
    return res.status(401).json({ message: 'Not authenticated.' })
  }
})

export default router
