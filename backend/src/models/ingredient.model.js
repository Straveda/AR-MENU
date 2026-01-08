import mongoose from 'mongoose';

const ingredientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    unit: {
      type: String,
      enum: ['kg', 'gm', 'ml', 'ltr', 'pcs', 'unit', 'pack', 'gram', 'liter'],
      required: true,
    },
    category: {
      type: String,
      trim: true,
      default: 'General'
    },
    currentStock: {
      type: Number,
      default: 0,
      min: 0,
    },
    minStockLevel: {
      type: Number,
      default: 0,
      min: 0,
    },
    costPerUnit: {
      type: Number,
      default: 0,
      min: 0,
    },
    supplier: {
      type: String,
      trim: true,
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


ingredientSchema.index({ restaurantId: 1, name: 1 }, { unique: true });

const Ingredient = mongoose.model('Ingredient', ingredientSchema);
export { Ingredient };
