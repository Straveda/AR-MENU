import mongoose from 'mongoose';

const stockMovementSchema = new mongoose.Schema(
  {
    ingredientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ingredient',
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: ['ADD', 'DEDUCT'],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    reason: {
      type: String,
      enum: ['PURCHASE', 'ORDER', 'WASTAGE', 'MANUAL_ADJUSTMENT', 'CORRECTION'],
      required: true,
    },
    performedBy: {
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

stockMovementSchema.index({ createdAt: -1 });

const StockMovement = mongoose.model('StockMovement', stockMovementSchema);
export { StockMovement };
