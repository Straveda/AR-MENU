import mongoose from 'mongoose';

const PlatformSettingsSchema = new mongoose.Schema(
    {
        featureToggles: {
            arMenuPreview: {
                type: Boolean,
                default: true,
            },
            multiLanguageSupport: {
                type: Boolean,
                default: true,
            },
            kdsIntegration: {
                type: Boolean,
                default: true,
            },
            advancedAnalytics: {
                type: Boolean,
                default: true,
            },
        },
        notificationSettings: {
            subscriptionReminders: {
                type: Boolean,
                default: true,
            },
            usageAlerts: {
                type: Boolean,
                default: true,
            },
            reminderDaysBeforeExpiry: {
                type: Number,
                default: 14,
            },
            gracePeriodDays: {
                type: Number,
                default: 7,
            },
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    { timestamps: true },
);

// Ensure only one document exists
PlatformSettingsSchema.statics.getSettings = async function () {
    const settings = await this.findOne();
    if (settings) return settings;
    return await this.create({});
};

export const PlatformSettings = mongoose.model('PlatformSettings', PlatformSettingsSchema);
