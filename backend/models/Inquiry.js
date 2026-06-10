import mongoose from 'mongoose';

const inquirySchema = new mongoose.Schema({
  restaurantName: { type: String, required: true },
  restaurantAddress: { type: String, required: true },
  ownerName: { type: String, required: true },
  ownerPhone: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Contacted', 'Closed'], default: 'Pending' }
}, { timestamps: true });

export default mongoose.model('Inquiry', inquirySchema);
