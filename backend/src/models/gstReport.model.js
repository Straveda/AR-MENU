import mongoose from 'mongoose';

const gstReportSchema = new mongoose.Schema(
    {
        restaurantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Restaurant',
            required: true,
            index: true,
        },
        month: {
            type: Number,
            required: true,
            min: 1,
            max: 12,
        },
        year: {
            type: Number,
            required: true,
            min: 2020,
        },

        // Aggregated data
        totalSales: {
            type: Number,
            required: true,
            default: 0,
        },
        taxableAmount: {
            type: Number,
            required: true,
            default: 0,
        },
        cgst: {
            type: Number,
            required: true,
            default: 0,
        },
        sgst: {
            type: Number,
            required: true,
            default: 0,
        },
        totalGST: {
            type: Number,
            required: true,
            default: 0,
        },

        // Breakdown
        orderCount: {
            type: Number,
            default: 0,
        },
        cancelledCount: {
            type: Number,
            default: 0,
        },
        dailyBreakdown: [
            {
                date: String,
                orderCount: Number,
                taxableAmount: Number,
                cgst: Number,
                sgst: Number,
                totalTax: Number,
            }
        ],

        // Metadata
        generatedAt: {
            type: Date,
            default: Date.now,
        },
        isStale: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// Compound unique index to prevent duplicate reports
gstReportSchema.index({ restaurantId: 1, month: 1, year: 1 }, { unique: true });

// Index for querying fresh reports
gstReportSchema.index({ restaurantId: 1, isStale: 1 });

const GSTReport = mongoose.model('GSTReport', gstReportSchema);
export default GSTReport;
