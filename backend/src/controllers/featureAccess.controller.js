import { Plan } from '../models/plan.models.js';
import { Dish } from '../models/dish.models.js';
import { User } from '../models/user.models.js';
import { Restaurant } from '../models/restaurant.models.js';

/**
 * Get current restaurant's plan with feature access and usage stats
 */
export const checkFeatureAccess = async (req, res) => {
    try {
        const restaurant = req.restaurant;

        if (!restaurant || !restaurant.planId) {
            return res.status(200).json({
                success: true,
                plan: null,
                features: {
                    arModels: false,
                    kds: false,
                    analytics: false,
                },
                limits: {
                    maxDishes: 0,
                    maxStaff: 0,
                },
                usage: {
                    dishes: 0,
                    staff: 0,
                },
                message: 'No subscription plan assigned to this restaurant.',
            });
        }

        const plan = await Plan.findById(restaurant.planId);

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Assigned plan not found.',
            });
        }

        // Get current usage
        const dishCount = await Dish.countDocuments({
            restaurantId: restaurant._id,
        });

        const staffCount = await User.countDocuments({
            restaurantId: restaurant._id,
        });

        return res.status(200).json({
            success: true,
            plan: {
                id: plan._id,
                name: plan.name,
                description: plan.description,
                price: plan.price,
                interval: plan.interval,
            },
            features: plan.features || {
                arModels: false,
                kds: false,
                analytics: false,
            },
            limits: plan.limits || {
                maxDishes: 0,
                maxStaff: 0,
            },
            usage: {
                dishes: dishCount,
                staff: staffCount,
            },
            subscription: {
                status: restaurant.subscriptionStatus,
                startsAt: restaurant.subscriptionStartsAt,
                endsAt: restaurant.subscriptionEndsAt,
            },
        });
    } catch (error) {
        console.error('Error checking feature access:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to check feature access',
            error: error.message,
        });
    }
};

/**
 * Get current plan details (simplified version)
 */
export const getCurrentPlan = async (req, res) => {
    try {
        const restaurant = req.restaurant;

        if (!restaurant || !restaurant.planId) {
            return res.status(200).json({
                success: true,
                plan: null,
                message: 'No subscription plan assigned.',
            });
        }

        const plan = await Plan.findById(restaurant.planId);

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Plan not found.',
            });
        }

        return res.status(200).json({
            success: true,
            plan: {
                id: plan._id,
                name: plan.name,
                description: plan.description,
                price: plan.price,
                interval: plan.interval,
                features: plan.features,
                limits: plan.limits,
            },
        });
    } catch (error) {
        console.error('Error getting current plan:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get current plan',
            error: error.message,
        });
    }
};

/**
 * Get feature access status for public menu (no auth)
 */
export const checkPublicFeatureAccess = async (req, res) => {
    try {
        const { slug } = req.params;

        const restaurant = await Restaurant.findOne({ slug, status: 'Active' });

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found or inactive.',
            });
        }

        if (!restaurant.planId) {
            return res.status(200).json({
                success: true,
                features: {
                    arModels: false,
                    kds: false,
                    analytics: false,
                },
            });
        }

        const plan = await Plan.findById(restaurant.planId);

        return res.status(200).json({
            success: true,
            features: plan?.features || {
                arModels: false,
                kds: false,
                analytics: false,
            },
        });
    } catch (error) {
        console.error('Error checking public feature access:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to check public feature access',
            error: error.message,
        });
    }
};
