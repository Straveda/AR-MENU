import mongoose from 'mongoose';

const dishStatsSchema = new mongoose.Schema(
    {
        restaurantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Restaurant',
            required: true,
            index: true,
        },
        dishId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Dish',
            required: true,
        },
        totalOrders: {
            type: Number,
            default: 0,
        },
        totalRevenue: {
            type: Number,
            default: 0,
        },
        avgOrderValue: {
            type: Number,
            default: 0,
        },
        last30DaysOrders: {
            type: Number,
            default: 0,
        },
        lastUpdated: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

// Unique constraint: one stats record per dish per restaurant
dishStatsSchema.index({ restaurantId: 1, dishId: 1 }, { unique: true });
dishStatsSchema.index({ totalOrders: -1 });

export const DishStats = mongoose.model('DishStats', dishStatsSchema);
