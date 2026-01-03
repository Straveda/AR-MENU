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
      },
    ],

    subtotal: { type: Number },
    total: { type: Number },

    orderStatus: {
      type: String,
      enum: ['Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'],
      default: 'Pending',
    },

    history: [historySchema],
  },
  { timestamps: true },
);

export const Order = mongoose.model('Order', orderSchema);
