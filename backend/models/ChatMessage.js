import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
  restaurantId: { type: String, required: true },
  sender: { type: String, enum: ['restaurant', 'admin'], required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('ChatMessage', chatMessageSchema);
