import bcrypt from 'bcryptjs'
import axios from 'axios'
import Listing from '../models/Listing.js'
import User from '../models/User.js'

const KING_COUNTY_CITIES = ['Seattle', 'Bellevue', 'Kirkland', 'Redmond', 'Renton', 'Issaquah']

const CITY_COORDS = {
  Seattle: { lat: 47.6062, lng: -122.3321 },
  Bellevue: { lat: 47.6101, lng: -122.2015 },
  Kirkland: { lat: 47.6769, lng: -122.2059 },
  Redmond: { lat: 47.6731, lng: -122.1215 },
  Renton: { lat: 47.4829, lng: -122.2171 },
  Issaquah: { lat: 47.5301, lng: -122.0326 },
}

const KING_COUNTY_ZIPCODES = [98178, 98103, 98052, 98004, 98006, 98033, 98059, 98115]

const ML_BASE_URL = process.env.ML_BASE_URL || 'http://127.0.0.1:8000'

const randomFromArray = (arr) => arr[Math.floor(Math.random() * arr.length)]

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

const randomFloors = () => {
  const opts = [1, 1.5, 2, 2.5]
  return opts[Math.floor(Math.random() * opts.length)]
}

const seedData = [
  {
    title: 'Modern Loft with Skyline Views',
    price: 3200,
    address: '120 Market Street',
    city: 'San Francisco',
    beds: 2,
    baths: 2,
    type: 'rent',
    images: [
      'https://images.unsplash.com/photo-1502005097973-6a7082348e28?auto=format&fit=crop&w=900&q=60',
    ],
    lat: 37.7936,
    lng: -122.3965,
    description: 'Open-concept loft with floor-to-ceiling windows and transit access.',
  },
  {
    title: 'Cozy Craftsman Near the Park',
    price: 680000,
    address: '415 Oak Avenue',
    city: 'Portland',
    beds: 3,
    baths: 2,
    type: 'buy',
    images: [
      'https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=900&q=60',
    ],
    lat: 45.5231,
    lng: -122.6765,
    description: 'Warm craftsman with a bright kitchen and backyard.',
  },
  {
    title: 'Luxury Downtown Condo',
    price: 2450,
    address: '88 Pine Street',
    city: 'Austin',
    beds: 1,
    baths: 1,
    type: 'rent',
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=900&q=60',
    ],
    lat: 30.2682,
    lng: -97.7429,
    description: 'Sleek condo with amenities and walkable access to dining.',
  },
  {
    title: 'Spacious Family Home with Pool',
    price: 910000,
    address: '230 Sunset Drive',
    city: 'Phoenix',
    beds: 4,
    baths: 3,
    type: 'buy',
    images: [
      'https://images.unsplash.com/photo-1560448075-bb4df20e2f95?auto=format&fit=crop&w=900&q=60',
    ],
    lat: 33.4484,
    lng: -112.074,
    description: 'Generous layout with private pool and quiet cul-de-sac.',
  },
  {
    title: 'Waterfront Townhome Retreat',
    price: 4200,
    address: '980 Harbor Way',
    city: 'Seattle',
    beds: 3,
    baths: 2,
    type: 'rent',
    images: [
      'https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=900&q=60',
    ],
    lat: 47.6062,
    lng: -122.3321,
    description: 'Townhome with rooftop deck and marina views.',
  },
  {
    title: 'Suburban Comfort with Home Office',
    price: 540000,
    address: '72 Birch Lane',
    city: 'Denver',
    beds: 3,
    baths: 2,
    type: 'buy',
    images: [
      'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=900&q=60',
    ],
    lat: 39.7392,
    lng: -104.9903,
    description: 'Sunlit ranch with a dedicated office and fenced yard.',
  },
  {
    title: 'Historic Brownstone Charm',
    price: 1200000,
    address: '12 Beacon Street',
    city: 'Boston',
    beds: 3,
    baths: 2,
    type: 'buy',
    images: [
      'https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=900&q=60',
    ],
    lat: 42.3601,
    lng: -71.0589,
    description: 'Classic brownstone with restored details and private patio.',
  },
  {
    title: 'Minimalist Studio in Arts District',
    price: 1650,
    address: '500 Gallery Way',
    city: 'Los Angeles',
    beds: 1,
    baths: 1,
    type: 'rent',
    images: [
      'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=900&q=60',
    ],
    lat: 34.0522,
    lng: -118.2437,
    description: 'Clean lines, bright interiors, and in-building amenities.',
  },
  {
    title: 'Lakeview Cabin Getaway',
    price: 390000,
    address: '27 Pine Ridge',
    city: 'Lake Tahoe',
    beds: 2,
    baths: 2,
    type: 'buy',
    images: [
      'https://images.unsplash.com/photo-1502005097973-6a7082348e28?auto=format&fit=crop&w=900&q=60',
    ],
    lat: 39.0968,
    lng: -120.0324,
    description: 'Cozy retreat with lake views and stone fireplace.',
  },
  {
    title: 'New Build with Smart Features',
    price: 720000,
    address: '860 Innovation Blvd',
    city: 'San Jose',
    beds: 4,
    baths: 3,
    type: 'buy',
    images: [
      'https://images.unsplash.com/photo-1464146072230-91cabc968266?auto=format&fit=crop&w=900&q=60',
    ],
    lat: 37.3382,
    lng: -121.8863,
    description: 'Energy-efficient home with smart appliances and open floor plan.',
  },
  {
    title: 'City Center Flat',
    price: 2100,
    address: '14 Union Street',
    city: 'Chicago',
    beds: 2,
    baths: 1,
    type: 'rent',
    images: [
      'https://images.unsplash.com/photo-1493666438817-866a91353ca9?auto=format&fit=crop&w=900&q=60',
    ],
    lat: 41.8781,
    lng: -87.6298,
    description: 'Bright flat near the riverwalk with updated finishes.',
  },
  {
    title: 'Garden View Apartment',
    price: 1850,
    address: '900 Greenway',
    city: 'Raleigh',
    beds: 2,
    baths: 2,
    type: 'rent',
    images: [
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=900&q=60',
    ],
    lat: 35.7796,
    lng: -78.6382,
    description: 'Quiet community with garden views and modern appliances.',
  },
  {
    title: 'Riverside Bungalow',
    price: 510000,
    address: '77 River Road',
    city: 'Nashville',
    beds: 3,
    baths: 2,
    type: 'buy',
    images: [
      'https://images.unsplash.com/photo-1448630360428-65456885c650?auto=format&fit=crop&w=900&q=60',
    ],
    lat: 36.1627,
    lng: -86.7816,
    description: 'Charming bungalow with updated kitchen and deck.',
  },
  {
    title: 'Penthouse with City Lights',
    price: 5600,
    address: '1 Skyline Plaza',
    city: 'Miami',
    beds: 3,
    baths: 3,
    type: 'rent',
    images: [
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=900&q=60',
    ],
    lat: 25.7617,
    lng: -80.1918,
    description: 'Penthouse living with panoramic views and concierge.',
  },
  {
    title: 'Quiet Cul-de-sac Home',
    price: 630000,
    address: '300 Maple Court',
    city: 'Charlotte',
    beds: 4,
    baths: 3,
    type: 'buy',
    images: [
      'https://images.unsplash.com/photo-1501183638710-841dd1904471?auto=format&fit=crop&w=900&q=60',
    ],
    lat: 35.2271,
    lng: -80.8431,
    description: 'Family-friendly home with large backyard and bonus room.',
  },
  {
    title: 'Studio Near Transit',
    price: 1400,
    address: '11 Metro Line',
    city: 'Washington',
    beds: 1,
    baths: 1,
    type: 'rent',
    images: [
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=900&q=60',
    ],
    lat: 38.9072,
    lng: -77.0369,
    description: 'Compact studio with fast metro access.',
  },
  {
    title: 'Hilltop Estate',
    price: 1450000,
    address: '50 Summit Lane',
    city: 'San Diego',
    beds: 5,
    baths: 4,
    type: 'buy',
    images: [
      'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=900&q=60',
    ],
    lat: 32.7157,
    lng: -117.1611,
    description: 'Private hilltop estate with views and outdoor kitchen.',
  },
  {
    title: 'Loft Near Tech Campus',
    price: 2800,
    address: '45 Innovation Drive',
    city: 'Seattle',
    beds: 2,
    baths: 2,
    type: 'rent',
    images: [
      'https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=900&q=60',
    ],
    lat: 47.608,
    lng: -122.335,
    description: 'Industrial loft with exposed brick and coworking lounge.',
  },
  {
    title: 'Suburban Starter Home',
    price: 360000,
    address: '812 Meadow Lane',
    city: 'Columbus',
    beds: 3,
    baths: 2,
    type: 'buy',
    images: [
      'https://images.unsplash.com/photo-1501183638710-841dd1904471?auto=format&fit=crop&w=900&q=60',
    ],
    lat: 39.9612,
    lng: -82.9988,
    description: 'Great starter home close to schools and parks.',
  },
  {
    title: 'Urban Townhome',
    price: 3100,
    address: '620 Brick Street',
    city: 'Dallas',
    beds: 3,
    baths: 2,
    type: 'rent',
    images: [
      'https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=900&q=60',
    ],
    lat: 32.7767,
    lng: -96.797,
    description: 'Modern townhome with rooftop terrace.',
  },
  {
    title: 'Classic Colonial',
    price: 820000,
    address: '9 Heritage Way',
    city: 'Philadelphia',
    beds: 4,
    baths: 3,
    type: 'buy',
    images: [
      'https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=900&q=60',
    ],
    lat: 39.9526,
    lng: -75.1652,
    description: 'Classic colonial with updated finishes and large yard.',
  },
]

export const seedListings = async () => {
  let systemUser = await User.findOne({ email: 'system@gdrealty.com' })
  if (!systemUser) {
    const passwordHash = await bcrypt.hash('SystemPass123!', 10)
    systemUser = await User.create({
      username: 'gd-system',
      email: 'system@gdrealty.com',
      passwordHash,
      avatarUrl:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=60',
    })
  }

  // Only skip seeding if this system user already has demo listings.
  const existingDemoCount = await Listing.countDocuments({ ownerId: systemUser._id })
  if (existingDemoCount > 0) return

  const listings = await Promise.all(
    seedData.map(async (item, index) => {
      const base = {
        ...item,
        ownerId: systemUser._id,
        ownerName: systemUser.username,
      }

      if (item.type !== 'buy') {
        return base
      }

      const bedrooms = typeof item.beds === 'number' && item.beds > 0 ? item.beds : 3
      const bathrooms = typeof item.baths === 'number' && item.baths > 0 ? item.baths : 2

      // Generate ML feature fields with deliberate diversity across listings
      const sizeFactor = 0.8 + (index % 4) * 0.2 // 0.8, 1.0, 1.2, 1.4 pattern
      let sqftLiving = Math.round((900 + bedrooms * 400) * sizeFactor)
      sqftLiving = Math.min(Math.max(sqftLiving, 900), 3500)

      const lotFactor = 0.7 + (index % 5) * 0.15 // 0.7 -> 1.3
      let sqftLot = Math.round(4000 * lotFactor)
      sqftLot = Math.min(Math.max(sqftLot, 2000), 12000)

      const floors = randomFloors()
      const zipcode = KING_COUNTY_ZIPCODES[index % KING_COUNTY_ZIPCODES.length]
      const yr_built = randomInt(1950 + (index % 5) * 10, 2020 - (index % 5) * 3)

      const cityName = KING_COUNTY_CITIES[index % KING_COUNTY_CITIES.length]
      const baseCoords = CITY_COORDS[cityName] || CITY_COORDS.Seattle
      const latJitter = (Math.random() - 0.5) * 0.02
      const lngJitter = (Math.random() - 0.5) * 0.02
      const lat = baseCoords.lat + latJitter
      const lng = baseCoords.lng + lngJitter

      const mlPayload = {
        bedrooms,
        bathrooms,
        sqft_living: sqftLiving,
        sqft_lot: sqftLot,
        floors,
        zipcode,
        yr_built,
        listed_price: item.price,
      }

      const bucket = index % 3
      const noise = Math.random() * 0.06 - 0.03 // small jitter in [-3%, +3%]
      const isOverpricedBucket = bucket === 0
      const isUnderpricedBucket = bucket === 2

      let finalPrice

      try {
        const response = await axios.post(`${ML_BASE_URL}/predict`, mlPayload, {
          timeout: 4000,
        })
        const rawPred = Number(response.data?.predicted_price)
        if (!Number.isFinite(rawPred)) {
          throw new Error('Invalid prediction from ML service')
        }

        if (isOverpricedBucket) {
          // Keep a visibly overpriced segment for demo comparisons.
          finalPrice = rawPred * (1 + 0.25 + noise)
        } else if (isUnderpricedBucket) {
          // Guarantee underpriced demo listings under $360k.
          const discount = 0.15 + Math.random() * 0.1 // 15% -> 25% below prediction
          const discounted = rawPred * (1 - discount)
          const minUnderpriced = rawPred * 0.88 // at least 12% below prediction
          finalPrice = Math.min(discounted, minUnderpriced, 359000)
        } else {
          finalPrice = rawPred * (1 + noise)
        }
      } catch (error) {
        // Fallback heuristic if ML service is unavailable, still shaped by buckets
        const heuristic = sqftLiving * 350 + bedrooms * 20000

        if (isOverpricedBucket) {
          finalPrice = heuristic * (1 + 0.25 + noise)
        } else if (isUnderpricedBucket) {
          finalPrice = Math.min(heuristic * 0.8, heuristic * 0.88, 359000)
        } else {
          finalPrice = heuristic * (1 + noise)
        }
      }

      finalPrice = Math.round(Math.min(Math.max(finalPrice, 150000), 2000000))

      return {
        ...base,
        price: finalPrice,
        city: cityName,
        lat,
        lng,
        sqft_living: sqftLiving,
        sqft_lot: sqftLot,
        floors,
        zipcode,
        yr_built,
      }
    })
  )

  await Listing.insertMany(listings)
}
