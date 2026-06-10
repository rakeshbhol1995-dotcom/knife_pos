import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  type: { type: String, required: true },
  category: { type: String, required: true }
});

const orderSchema = new mongoose.Schema({
  restaurantId: { type: String, required: true },
  id: { type: String, required: true }, // e.g. '#ORD-001'
  table: { type: String, required: true },
  customerName: { type: String, default: 'Guest Customer' },
  customerPhone: { type: String, default: '' },
  customerAddress: { type: String, default: '' },
  paymentMode: { type: String, default: 'Cash' },
  orderType: { type: String, required: true }, // 'Dine In', 'Takeaway', 'Delivery'
  items: [orderItemSchema],
  status: { type: String, default: 'Ready' },
  total: { type: Number, required: true },
  time: { type: String, required: true },
  date: { type: String, required: true }
}, { timestamps: true });

orderSchema.index({ restaurantId: 1, date: 1 });

export default mongoose.model('Order', orderSchema);
