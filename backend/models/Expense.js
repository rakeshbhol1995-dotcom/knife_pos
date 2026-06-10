import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  restaurantId: { type: String, required: true },
  id: { type: String, required: true }, // e.g. 'EXP-001'
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  notes: { type: String, default: '' }
}, { timestamps: true });

expenseSchema.index({ restaurantId: 1, date: 1 });

export default mongoose.model('Expense', expenseSchema);
