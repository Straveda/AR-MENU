import mongoose from "mongoose";

const subscriptionLogSchema = new mongoose.Schema({
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Restaurant",
        required: true
    },
    planId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Plan",
        required: true
    },
    action: {
        type: String,
        enum: ["ASSIGN", "EXTEND", "CHANGE"],
        required: true
    },
    previousPlanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Plan"
    },
    durationInDays: {
        type: Number
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, { timestamps: true });

export const SubscriptionLog = mongoose.model("SubscriptionLog", subscriptionLogSchema);
