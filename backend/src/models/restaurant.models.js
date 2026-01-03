import mongoose from 'mongoose';

const restaurantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },

    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
      default: null,
    },

    subscriptionStatus: {
      type: String,
      enum: ['TRIAL', 'ACTIVE', 'EXPIRED', 'SUSPENDED'],
      default: 'TRIAL',
    },

    subscriptionStartsAt: {
      type: Date,
      default: null,
    },

    subscriptionEndsAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

const Restaurant = mongoose.model('Restaurant', restaurantSchema);
export { Restaurant };
export default Restaurant;
