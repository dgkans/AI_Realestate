import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageContainer from '../components/PageContainer'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import { createListing, fetchListings, updateListing } from '../data/listingsStore'
import { useAuth } from '../context/AuthContext.jsx'

const parsePrice = (value) => {
  if (!value) return 0
  const cleaned = value.toString().trim().toLowerCase().replace(/,/g, '')
  const match = cleaned.match(/^(\d+(\.\d+)?)(k|m)?$/)
  if (!match) return NaN
  const number = Number(match[1])
  const suffix = match[3]
  if (suffix === 'k') return Math.round(number * 1000)
  if (suffix === 'm') return Math.round(number * 1000000)
  return Math.round(number)
}

const isNumeric = (value) => {
  if (value === '' || value === null || value === undefined) return true
  return !Number.isNaN(Number(value))
}

export default function AddPost() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { currentUser } = useAuth()
  const fileInputRef = useRef(null)
  const [formValues, setFormValues] = useState({
    title: '',
    price: '',
    address: '',
    description: '',
    city: '',
    beds: '',
    baths: '',
    lat: '',
    lng: '',
    type: 'rent',
    size: '',
    schoolDistance: '',
    busDistance: '',
    restaurantDistance: '',
    imageUrl: '',
    images: [],
  })
  const [error, setError] = useState('')
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (!id) return
    let active = true
    const load = async () => {
      try {
        const listings = await fetchListings()
        const listing = listings.find((item) => item._id === id)
        if (!listing || !active) return
        setFormValues({
          title: listing.title || '',
          price: listing.price ? listing.price.toString() : '',
          address: listing.address || '',
          description: listing.description || '',
          city: listing.city || '',
          beds: listing.beds ? listing.beds.toString() : '',
          baths: listing.baths ? listing.baths.toString() : '',
          lat: listing.lat ? listing.lat.toString() : '',
          lng: listing.lng ? listing.lng.toString() : '',
          type: listing.type || 'rent',
          size: listing.size ? listing.size.toString() : '',
          schoolDistance: listing.schoolDistance ? listing.schoolDistance.toString() : '',
          busDistance: listing.busDistance ? listing.busDistance.toString() : '',
          restaurantDistance: listing.restaurantDistance ? listing.restaurantDistance.toString() : '',
          imageUrl: '',
          images: listing.images || [],
        })
      } catch (error) {
        setError('Unable to load listing for editing.')
      }
    }
    load()
    return () => {
      active = false
    }
  }, [id])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    const nextErrors = {}
    const parsedPrice = parsePrice(formValues.price)
    if (Number.isNaN(parsedPrice)) {
      nextErrors.price = 'Use 500000, 500k, or 0.5m.'
    }
    if (!isNumeric(formValues.beds)) {
      nextErrors.beds = 'Bedrooms must be a number.'
    }
    if (!isNumeric(formValues.baths)) {
      nextErrors.baths = 'Bathrooms must be a number.'
    }
    if (!isNumeric(formValues.lat)) {
      nextErrors.lat = 'Latitude must be a number.'
    }
    if (!isNumeric(formValues.lng)) {
      nextErrors.lng = 'Longitude must be a number.'
    }
    if (!isNumeric(formValues.size)) {
      nextErrors.size = 'Total size must be a number.'
    }
    if (!isNumeric(formValues.schoolDistance)) {
      nextErrors.schoolDistance = 'School distance must be a number.'
    }
    if (!isNumeric(formValues.busDistance)) {
      nextErrors.busDistance = 'Bus distance must be a number.'
    }
    if (!isNumeric(formValues.restaurantDistance)) {
      nextErrors.restaurantDistance = 'Restaurant distance must be a number.'
    }

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      setError('Please fix the highlighted fields.')
      return
    }
    setErrors({})

    const images = formValues.imageUrl
      ? [formValues.imageUrl, ...formValues.images]
      : formValues.images

    const listing = {
      title: formValues.title || 'New Property',
      price: parsedPrice,
      address: formValues.address || 'Address TBD',
      city: formValues.city || 'City TBD',
      beds: Number(formValues.beds || 0),
      baths: Number(formValues.baths || 0),
      type: formValues.type,
      images,
      lat: Number(formValues.lat || 0),
      lng: Number(formValues.lng || 0),
      size: Number(formValues.size || 0),
      schoolDistance: Number(formValues.schoolDistance || 0),
      busDistance: Number(formValues.busDistance || 0),
      restaurantDistance: Number(formValues.restaurantDistance || 0),
      description:
        formValues.description ||
        'New listing created from the GD Realty add post form.',
    }
    try {
      if (id) {
        await updateListing(id, listing)
      } else {
        await createListing(listing)
      }
      window.dispatchEvent(new Event('listings-change'))
      navigate('/profile')
    } catch (submitError) {
      setError(submitError.message)
    }
  }

  return (
    <PageContainer className="pb-16">
      <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
        <Card className="p-6">
          <h1 className="text-2xl font-semibold text-slate-100">
            {id ? 'Update Property' : 'Add New Post'}
          </h1>
          <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="Title"
                placeholder="Cozy loft near downtown"
                value={formValues.title}
                onChange={(event) =>
                  setFormValues({ ...formValues, title: event.target.value })
                }
              />
              <Input
                label="Price"
                placeholder="500000 or 500k"
                value={formValues.price}
                onChange={(event) =>
                  setFormValues({ ...formValues, price: event.target.value })
                }
                helper="Use 500000, 500k, or 0.5m"
                className={
                  errors.price
                    ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-400/30'
                    : ''
                }
              />
              <Input
                label="Address"
                placeholder="123 Market Street"
                value={formValues.address}
                onChange={(event) =>
                  setFormValues({ ...formValues, address: event.target.value })
                }
              />
            </div>
            <Input
              label="Description"
              as="textarea"
              rows={4}
              placeholder="Write a short description about the property..."
              value={formValues.description}
              onChange={(event) =>
                setFormValues({ ...formValues, description: event.target.value })
              }
            />
            {error && <p className="text-xs text-rose-300">{error}</p>}
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="City"
                placeholder="San Francisco"
                value={formValues.city}
                onChange={(event) =>
                  setFormValues({ ...formValues, city: event.target.value })
                }
              />
              <Input
                label="Bedroom Number"
                placeholder="2"
                value={formValues.beds}
                onChange={(event) =>
                  setFormValues({ ...formValues, beds: event.target.value })
                }
                helper={errors.beds}
                className={
                  errors.beds
                    ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-400/30'
                    : ''
                }
              />
              <Input
                label="Bathroom Number"
                placeholder="1"
                value={formValues.baths}
                onChange={(event) =>
                  setFormValues({ ...formValues, baths: event.target.value })
                }
                helper={errors.baths}
                className={
                  errors.baths
                    ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-400/30'
                    : ''
                }
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="Latitude"
                placeholder="37.7882"
                value={formValues.lat}
                onChange={(event) =>
                  setFormValues({ ...formValues, lat: event.target.value })
                }
                helper={errors.lat}
                className={
                  errors.lat
                    ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-400/30'
                    : ''
                }
              />
              <Input
                label="Longitude"
                placeholder="-122.3991"
                value={formValues.lng}
                onChange={(event) =>
                  setFormValues({ ...formValues, lng: event.target.value })
                }
                helper={errors.lng}
                className={
                  errors.lng
                    ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-400/30'
                    : ''
                }
              />
              <label className="flex w-full flex-col gap-2 text-sm font-medium text-slate-200">
                <span>Type</span>
                <select
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                  value={formValues.type}
                  onChange={(event) =>
                    setFormValues({ ...formValues, type: event.target.value })
                  }
                >
                  <option value="rent">Rent</option>
                  <option value="buy">Buy</option>
                </select>
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="flex w-full flex-col gap-2 text-sm font-medium text-slate-200">
                <span>Property</span>
                <select className="w-full rounded-xl border border-slate-700/80 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30">
                  <option>Apartment</option>
                  <option>House</option>
                  <option>Condo</option>
                  <option>Studio</option>
                </select>
              </label>
              <label className="flex w-full flex-col gap-2 text-sm font-medium text-slate-200">
                <span>Utilities Policy</span>
                <select className="w-full rounded-xl border border-slate-700/80 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30">
                  <option>Owner is responsible</option>
                  <option>Tenant is responsible</option>
                  <option>Split</option>
                </select>
              </label>
              <label className="flex w-full flex-col gap-2 text-sm font-medium text-slate-200">
                <span>Pet Policy</span>
                <select className="w-full rounded-xl border border-slate-700/80 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30">
                  <option>Allowed</option>
                  <option>Not allowed</option>
                  <option>Case by case</option>
                </select>
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="Image URL"
                placeholder="https://..."
                value={formValues.imageUrl}
                onChange={(event) =>
                  setFormValues({ ...formValues, imageUrl: event.target.value })
                }
              />
              <label className="flex w-full flex-col gap-2 text-sm font-medium text-slate-200">
                <span>Income Policy</span>
                <select className="w-full rounded-xl border border-slate-700/80 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30">
                  <option>Income policy</option>
                  <option>3x rent</option>
                  <option>Co-signer allowed</option>
                </select>
              </label>
              <Input
                label="Total Size (sqft/m2)"
                placeholder="1200"
                value={formValues.size}
                onChange={(event) =>
                  setFormValues({ ...formValues, size: event.target.value })
                }
                helper={errors.size}
                className={
                  errors.size
                    ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-400/30'
                    : ''
                }
              />
              <Input
                label="School Distance"
                placeholder="0.8"
                value={formValues.schoolDistance}
                onChange={(event) =>
                  setFormValues({ ...formValues, schoolDistance: event.target.value })
                }
                helper={errors.schoolDistance}
                className={
                  errors.schoolDistance
                    ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-400/30'
                    : ''
                }
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="Bus Distance"
                placeholder="0.3"
                value={formValues.busDistance}
                onChange={(event) =>
                  setFormValues({ ...formValues, busDistance: event.target.value })
                }
                helper={errors.busDistance}
                className={
                  errors.busDistance
                    ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-400/30'
                    : ''
                }
              />
              <Input
                label="Restaurant Distance"
                placeholder="0.5"
                value={formValues.restaurantDistance}
                onChange={(event) =>
                  setFormValues({ ...formValues, restaurantDistance: event.target.value })
                }
                helper={errors.restaurantDistance}
                className={
                  errors.restaurantDistance
                    ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-400/30'
                    : ''
                }
              />
            </div>
            <Button type="submit" className="w-fit">
              {id ? 'Save Changes' : 'Create Post'}
            </Button>
          </form>
        </Card>
        <Card className="flex flex-col items-center gap-4 p-6 text-center">
          <p className="text-sm font-semibold text-slate-100">Add images</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (!file) return
              const reader = new FileReader()
              reader.onload = () => {
                const result = reader.result
                if (typeof result === 'string') {
                  setFormValues((prev) => ({
                    ...prev,
                    images: [result, ...prev.images],
                  }))
                }
              }
              reader.readAsDataURL(file)
            }}
          />
          <div className="flex h-40 w-full items-center justify-center rounded-3xl border border-dashed border-slate-800/80 bg-slate-900/40">
            {formValues.images.length ? (
              <img
                src={formValues.images[0]}
                alt="Preview"
                className="h-full w-full rounded-3xl object-cover"
              />
            ) : (
              <p className="text-xs text-slate-400">Image upload placeholder</p>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            Upload
          </Button>
        </Card>
      </div>
    </PageContainer>
  )
}
