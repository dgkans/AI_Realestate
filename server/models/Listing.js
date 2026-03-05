import mongoose from 'mongoose'

const listingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    beds: { type: Number, default: 0 },
    baths: { type: Number, default: 0 },
    sqft_living: { type: Number, default: 0 },
    sqft_lot: { type: Number, default: 0 },
    floors: { type: Number, default: 0 },
    zipcode: { type: Number, default: 0 },
    yr_built: { type: Number, default: 0 },
    type: { type: String, enum: ['buy', 'rent'], default: 'rent' },
    images: { type: [String], default: [] },
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 },
    size: { type: Number, default: 0 },
    schoolDistance: { type: Number, default: 0 },
    busDistance: { type: Number, default: 0 },
    restaurantDistance: { type: Number, default: 0 },
    description: { type: String, default: '' },
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    ownerName: { type: String, required: true },
  },
  { timestamps: true }
)

export default mongoose.model('Listing', listingSchema)
