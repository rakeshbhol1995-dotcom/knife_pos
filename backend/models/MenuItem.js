import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema({
  restaurantId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  type: { type: String, enum: ['Veg', 'Non-Veg'], required: true },
  status: { type: String, enum: ['In Stock', 'Out of Stock'], default: 'In Stock' }
}, { timestamps: true });

menuItemSchema.index({ restaurantId: 1, category: 1 });

export default mongoose.model('MenuItem', menuItemSchema);
