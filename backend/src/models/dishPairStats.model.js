import mongoose from 'mongoose';

const dishPairStatsSchema = new mongoose.Schema(
    {
        restaurantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Restaurant',
            required: true,
            index: true,
        },
        mainDishId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Dish',
            required: true,
        },
        pairedDishId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Dish',
            required: true,
        },
        pairCount: {
            type: Number,
            default: 0,
        },
        pairPercentage: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },
        lastUpdated: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

// Unique constraint: one pair stats record per dish pair per restaurant
dishPairStatsSchema.index({ restaurantId: 1, mainDishId: 1, pairedDishId: 1 }, { unique: true });
dishPairStatsSchema.index({ pairPercentage: -1 });

export const DishPairStats = mongoose.model('DishPairStats', dishPairStatsSchema);
