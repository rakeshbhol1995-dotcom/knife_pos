import mongoose from 'mongoose';

const salarySchema = new mongoose.Schema({
  restaurantId: { type: String, required: true },
  paidKey: { type: String, required: true }, // e.g. 'ST-001_2026-06'
  memberId: { type: String, required: true },
  memberName: { type: String, required: true },
  payrollMonth: { type: String, required: true },
  netPayable: { type: Number, required: true },
  amountPaid: { type: Number, required: true },
  balancePending: { type: Number, required: true },
  mode: { type: String, required: true },
  date: { type: String, required: true },
  notes: { type: String, default: '' }
}, { timestamps: true });

salarySchema.index({ restaurantId: 1 });
salarySchema.index({ paidKey: 1 }, { unique: true });

export default mongoose.model('Salary', salarySchema);
