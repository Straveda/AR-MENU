import mongoose from 'mongoose';

const generatedRecommendationSchema = new mongoose.Schema(
    {
        restaurantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Restaurant',
            required: true,
            index: true,
        },
        ruleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'UpsellRule',
            required: true,
        },
        triggerContext: {
            type: String,
            enum: ['VIEW_DISH', 'ADD_TO_CART', 'VIEW_CART'],
            required: true,
        },
        triggerDishId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Dish',
            default: null,
        },
        recommendedDishId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Dish',
            required: true,
        },
        recommendationType: {
            type: String,
            enum: ['PAIRING', 'COMBO', 'CART_UPSELL'],
            required: true,
        },
        messageTemplate: {
            type: String,
            required: true,
        },
        discountPercentage: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },
        priority: {
            type: Number,
            default: 5,
            min: 1,
            max: 10,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

// Compound indexes for efficient queries
generatedRecommendationSchema.index({ restaurantId: 1, triggerContext: 1, triggerDishId: 1 });
generatedRecommendationSchema.index({ restaurantId: 1, isActive: 1, priority: -1 });

export const GeneratedRecommendation = mongoose.model('GeneratedRecommendation', generatedRecommendationSchema);
