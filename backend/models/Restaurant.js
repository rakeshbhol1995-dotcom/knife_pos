import mongoose from 'mongoose';

const restaurantSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // unique slug id, e.g. 'urmi_kitchen'
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
