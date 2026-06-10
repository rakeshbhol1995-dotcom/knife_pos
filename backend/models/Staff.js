import mongoose from 'mongoose';

const staffSchema = new mongoose.Schema({
  restaurantId: { type: String, required: true },
  id: { type: String, required: true }, // e.g. 'ST-001'
  name: { type: String, required: true },
  role: { type: String, required: true },
  salary: { type: Number, required: true },
  contact: { type: String, required: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  joined: { type: String, required: true } // YYYY-MM-DD
}, { timestamps: true });

staffSchema.index({ restaurantId: 1 });

export default mongoose.model('Staff', staffSchema);
