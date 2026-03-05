import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    avatarUrl: { type: String, default: '' },
    preferredBudget: { type: Number, default: null },
    riskTolerance: { type: String, enum: ['low', 'medium', 'high', ''], default: '' },
  },
  { timestamps: true }
)

export default mongoose.model('User', userSchema)
