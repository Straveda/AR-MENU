import mongoose from 'mongoose';

const upsellRuleSchema = new mongoose.Schema(
    {
        restaurantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Restaurant',
            required: true,
            index: true,
        },
        ruleType: {
            type: String,
            enum: ['LOW_ATTACHMENT', 'FREQUENT_PAIR', 'COMBO_DISCOUNT', 'CART_THRESHOLD'],
            required: true,
        },
        ruleName: {
            type: String,
            required: true,
            trim: true,
        },
        mainDishId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Dish',
            default: null,
        },
        secondaryDishId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Dish',
            default: null,
        },
        minMainOrders: {
            type: Number,
            default: null,
        },
        maxSecondaryOrders: {
            type: Number,
            default: null,
        },
        minPairPercentage: {
            type: Number,
            default: null,
        },
        discountPercentage: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },
        cartMinValue: {
            type: Number,
            default: null,
        },
        aiExplanation: {
            type: String,
            default: '',
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

// Compound index for restaurant-scoped queries
upsellRuleSchema.index({ restaurantId: 1, isActive: 1 });
upsellRuleSchema.index({ restaurantId: 1, ruleType: 1 });

export const UpsellRule = mongoose.model('UpsellRule', upsellRuleSchema);
