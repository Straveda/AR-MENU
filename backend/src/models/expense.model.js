import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    expenseType: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
      index: true,
    },
    paymentMode: {
      type: String,
      enum: ['CASH', 'CARD', 'UPI', 'BANK'],
      required: true,
      default: 'CASH',
    },
    notes: {
      type: String,
      trim: true,
    },
    expenseDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

expenseSchema.index({ restaurantId: 1, expenseDate: -1 });

const Expense = mongoose.model('Expense', expenseSchema);
export default Expense;
