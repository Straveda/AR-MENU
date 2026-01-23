import { Plan } from '../models/plan.models.js';
import { Dish } from '../models/dish.models.js';

export const enforcePlanFeature = (feature) => {
  return async (req, res, next) => {
    try {
      const restaurant = req.restaurant;

      if (!restaurant || !restaurant.planId) {
        return res.status(403).json({
          success: false,
          message: 'No subscription plan assigned to this restaurant.',
          featureRequired: feature,
        });
      }

      const plan = await Plan.findById(restaurant.planId);

      if (!plan) {
        return res.status(404).json({
          success: false,
          message: 'Assigned plan not found.',
        });
      }

      // Handle limit checks
      if (feature === 'maxDishes') {
        const dishCount = await Dish.countDocuments({
          restaurantId: restaurant._id,
        });
        if (dishCount >= plan.limits.maxDishes) {
          return res.status(403).json({
            success: false,
            message: `You've reached your dish limit (${plan.limits.maxDishes} dishes). Upgrade your plan to add more dishes.`,
            featureRequired: 'maxDishes',
            currentPlan: plan.name,
            currentUsage: dishCount,
            limit: plan.limits.maxDishes,
          });
        }
        return next();
      }

      if (feature === 'maxStaff') {
        const { User } = await import('../models/user.models.js');
        const staffCount = await User.countDocuments({
          restaurantId: restaurant._id,
        });
        if (staffCount >= (plan.limits.maxStaff || 0)) {
          return res.status(403).json({
            success: false,
            message: `You've reached your staff limit (${plan.limits.maxStaff} staff members). Upgrade your plan to add more staff.`,
            featureRequired: 'maxStaff',
            currentPlan: plan.name,
            currentUsage: staffCount,
            limit: plan.limits.maxStaff,
          });
        }
        return next();
      }

      // Standardize feature names (map old names to new)
      const featureMap = {
        aiModels: 'arModels',
        kdsAccess: 'kds',
        analytics: 'analytics',
        arModels: 'arModels',
        kds: 'kds',
      };

      const modelFeatureName = featureMap[feature] || feature;

      // Check if feature exists in plan
      if (!plan.features[modelFeatureName]) {
        const featureDisplayNames = {
          arModels: 'AR Models',
          kds: 'Kitchen Display System (KDS)',
          analytics: 'Analytics',
        };

        return res.status(403).json({
          success: false,
          message: `This feature requires a plan with ${featureDisplayNames[modelFeatureName] || feature}. Please upgrade your plan.`,
          featureRequired: modelFeatureName,
          currentPlan: plan.name,
        });
      }

      next();
    } catch (error) {
      console.error('Error enforcing plan feature:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify plan features',
        error: error.message,
      });
    }
  };
};
