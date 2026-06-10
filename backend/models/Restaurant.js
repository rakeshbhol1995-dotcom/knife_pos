import mongoose from 'mongoose';

const restaurantSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // unique slug id, e.g. 'urmi_kitchen'
  uniqueId: { type: Number, unique: true, sparse: true }, // unique numerical id for support
  phone: { type: String }, // owner phone number
  name: { type: String, required: true },
  owner: { type: String, required: true },
  cuisine: { type: String, default: 'Multi-Cuisine' },
  status: { type: String, enum: ['Active', 'Closed'], default: 'Active' },
  taxRate: { type: Number, default: 5 },
  currency: { type: String, default: '₹' },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  onboardedAt: { type: Date, default: Date.now },
  expiryDate: { type: Date }
}, { timestamps: true });

export default mongoose.model('Restaurant', restaurantSchema);
