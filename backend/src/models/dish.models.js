import mongoose from 'mongoose';

const dishSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    modelStatus: { type: String, default: 'pending' },
    meshyTaskId: { type: String },
    modelUrls: {
      glb: { type: String },
      usdz: { type: String },
    },
    ingredients: {
      type: [String],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
    },
    available: {
      type: Boolean,
      default: true,
    },
    portionSize: {
      type: String,
      default: '',
    },
    nutritionalInfo: {
      calories: { type: Number, default: 0 },
      protein: { type: Number, default: 0 },
      carbs: { type: Number, default: 0 },
      sugar: { type: Number, default: 0 },
    },



    orderCount: {
      type: Number,
      default: 0,
    },

    isChefSpecial: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export const Dish = mongoose.model('Dish', dishSchema);
