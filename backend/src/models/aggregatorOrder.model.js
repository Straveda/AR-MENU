import mongoose from 'mongoose';

const aggregatorOrderSchema = new mongoose.Schema(
    {
        restaurantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Restaurant',
            required: true,
            index: true,
        },
        source: {
            type: String,
            enum: ['SWIGGY', 'ZOMATO'],
            required: true,
        },
        platformOrderId: {
            type: String,
            required: true,
            trim: true,
        },
        platformAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        orderDate: {
            type: Date,
            required: true,
            index: true,
        },
        customerName: {
            type: String,
            trim: true,
        },
        items: [
            {
                name: String,
                quantity: Number,
                price: Number,
            },
        ],
        platformFee: {
            type: Number,
            default: 0,
        },
        deliveryFee: {
            type: Number,
            default: 0,
        },
        taxes: {
            type: Number,
            default: 0,
        },
        netAmount: {
            type: Number,
            required: true,
            min: 0,
        },

        // Matching fields
        matchedOrderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            default: null,
        },
        matchStatus: {
            type: String,
            enum: ['PENDING', 'MATCHED', 'SHORTAGE', 'EXCESS', 'RESOLVED'],
            default: 'PENDING',
            index: true,
        },
        difference: {
            type: Number,
            default: 0,
        },
        resolvedAt: {
            type: Date,
            default: null,
        },
        resolvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        notes: {
            type: String,
            trim: true,
        },
    },
    { timestamps: true }
);

// Compound indexes for performance
aggregatorOrderSchema.index({ restaurantId: 1, matchStatus: 1 });
aggregatorOrderSchema.index({ restaurantId: 1, orderDate: -1 });
aggregatorOrderSchema.index({ restaurantId: 1, source: 1, orderDate: -1 });

const AggregatorOrder = mongoose.model('AggregatorOrder', aggregatorOrderSchema);
export default AggregatorOrder;
