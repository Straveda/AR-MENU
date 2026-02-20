import mongoose from 'mongoose';

const razorpaySettlementSchema = new mongoose.Schema(
    {
        restaurantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Restaurant',
            required: true,
            index: true,
        },
        settlementId: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        settlementDate: {
            type: Date,
            required: true,
            index: true,
        },
        receivedAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        expectedAmount: {
            type: Number,
            default: 0,
            min: 0,
        },
        difference: {
            type: Number,
            default: 0,
        },

        // Reconciliation fields
        status: {
            type: String,
            enum: ['PENDING', 'MATCHED', 'SHORTAGE', 'EXCESS'],
            default: 'PENDING',
            index: true,
        },
        orderIds: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Order',
            },
        ],
        reconciliationDate: {
            type: Date,
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
razorpaySettlementSchema.index({ restaurantId: 1, status: 1 });
razorpaySettlementSchema.index({ restaurantId: 1, settlementDate: -1 });

const RazorpaySettlement = mongoose.model('RazorpaySettlement', razorpaySettlementSchema);
export default RazorpaySettlement;
