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

    address: {
      type: String,
      trim: true,
    },

    contactEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },

    contactPhone: {
      type: String,
      trim: true,
    },

    logo: {
      type: String,
      trim: true,
    },

    openingTime: {
      type: String,
      trim: true,
    },

    closingTime: {
      type: String,
      trim: true,
    },

    subscriptionType: {
      type: String,
      enum: ['MONTHLY', 'YEARLY'],
      default: 'MONTHLY',
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
      enum: ['TRIAL', 'ACTIVE', 'EXPIRED', 'SUSPENDED', 'PAYMENT_PENDING'],
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

    notificationPreferences: {
      newOrders: {
        type: Boolean,
        default: true,
      },
      orderUpdates: {
        type: Boolean,
        default: true,
      },
      lowStockAlerts: {
        type: Boolean,
        default: true,
      },
      dailyReport: {
        type: Boolean,
        default: false,
      },
    },
  },
  { timestamps: true },
);

const Restaurant = mongoose.model('Restaurant', restaurantSchema);
export { Restaurant };
export default Restaurant;
