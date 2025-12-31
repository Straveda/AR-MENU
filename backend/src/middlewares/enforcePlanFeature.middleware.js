import { Plan } from "../models/plan.models.js";
import { Dish } from "../models/dish.models.js";

export const enforcePlanFeature = (feature) => {
  return async (req, res, next) => {
    try {
      const restaurant = req.restaurant;

      if (!restaurant || !restaurant.planId) {
        return res.status(403).json({
          success: false,
          message: "No subscription plan assigned to this restaurant.",
        });
      }

      const plan = await Plan.findById(restaurant.planId);

      if (!plan) {
        return res.status(404).json({
          success: false,
          message: "Assigned plan not found.",
        });
      }

      if (feature === "maxDishes") {
        const dishCount = await Dish.countDocuments({
          restaurantId: restaurant._id,
        });
        if (dishCount >= plan.limits.maxDishes) {
          return res.status(403).json({
            success: false,
            message: `Dish limit reached (${plan.limits.maxDishes}). Please upgrade your plan.`,
          });
        }
        return next();
      }

      if (feature === "maxStaff") {
        const { User } = await import("../models/user.models.js");
        const staffCount = await User.countDocuments({
          restaurantId: restaurant._id,
        });
        if (staffCount >= (plan.limits.maxStaff || 0)) {
          return res.status(403).json({
            success: false,
            message: `Staff limit reached (${plan.limits.maxStaff}). Please upgrade your plan.`,
          });
        }
        return next();
      }

      const featureMap = {
        aiModels: "arModels",
        kdsAccess: "kds",
        analytics: "analytics",
      };

      const modelFeatureName = featureMap[feature] || feature;

      if (!plan.features[modelFeatureName]) {
        return res.status(403).json({
          success: false,
          message: `Your current plan does not support the '${feature}' feature.`,
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to verify plan features",
        error: error.message,
      });
    }
  };
};
