import mongoose from 'mongoose';

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    description: {
      type: String,
    },

    price: {
      type: Number,
      default: 0,
      min: 0,
    },

    interval: {
      type: String,
      enum: ['MONTHLY', 'YEARLY'],
      default: 'MONTHLY',
    },

    features: {
      arModels: {
        type: Boolean,
        default: false,
      },
      kds: {
        type: Boolean,
        default: false,
      },
      analytics: {
        type: Boolean,
        default: false,
      },
      chatbot: {
        type: Boolean,
        default: true, // Chatbot is available by default
      },
    },

    limits: {
      maxDishes: {
        type: Number,
        default: 0,
        min: 0,
      },
      maxStaff: {
        type: Number,
        default: 0,
        min: 0,
      },
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// Indexes for performance
planSchema.index({ name: 1 });
planSchema.index({ isActive: 1 });

export const Plan = mongoose.model('Plan', planSchema);
