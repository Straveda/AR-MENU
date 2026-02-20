import mongoose from 'mongoose';

const historySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'],
      required: true,
    },
    at: {
      type: Date,
      default: Date.now,
    },
    by: {
      type: String,
      default: 'system',
    },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    orderCode: {
      type: String,
      required: true,
    },

    tableNumber: {
      type: Number,
      default: null,
    },

    orderItems: [
      {
        dishId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Dish',
        },
        name: { type: String },
        price: { type: Number },
        quantity: { type: Number },
        lineTotal: { type: Number },
        // Upsell tracking
        source: {
          type: String,
          enum: ['MENU', 'UPSELL', 'SEARCH'],
          default: 'MENU',
        },
        upsellRuleId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'UpsellRule',
        },
        originalPrice: { type: Number },
      },
    ],

    subtotal: { type: Number },
    total: { type: Number },

    // Reports module fields
    paymentMode: {
      type: String,
      enum: ['CASH', 'CARD', 'UPI', 'RAZORPAY'],
      default: 'CASH',
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    source: {
      type: String,
      enum: ['POS', 'SWIGGY', 'ZOMATO'],
      default: 'POS',
    },
    settlementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RazorpaySettlement',
      default: null,
    },

    orderStatus: {
      type: String,
      enum: ['Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'],
      default: 'Pending',
    },

    history: [historySchema],
  },
  { timestamps: true },
);

// Indexes for Reports module
orderSchema.index({ restaurantId: 1, createdAt: -1 });
orderSchema.index({ restaurantId: 1, source: 1 });
orderSchema.index({ restaurantId: 1, settlementId: 1 });
orderSchema.index({ restaurantId: 1, paymentMode: 1 });

export const Order = mongoose.model('Order', orderSchema);
