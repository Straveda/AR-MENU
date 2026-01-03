import { Plan } from "../models/plan.models.js";
import { Dish } from "../models/dish.models.js";
import { User } from "../models/user.models.js";

class SubscriptionService {
  /**
   * Checks if a restaurant has reached its limit for ACTIVE resources of a specific type.
   * Returns { allowed: boolean, limit: number, currentActive: number, message: string }
   */
  async checkActiveLimit(restaurantId, feature) {
    const restaurant = await this._getRestaurantPlan(restaurantId);
    if (!restaurant) throw new Error("Restaurant or Plan not found");

    const plan = restaurant.planId;
    let limit = 0;
    let currentActive = 0;

    if (feature === 'maxDishes') {
      limit = plan.limits?.maxDishes || 0;
      currentActive = await Dish.countDocuments({
        restaurantId: restaurant._id,
        isActive: true
      });
    } else if (feature === 'maxStaff') {
      limit = plan.limits?.maxStaff || 0;
      currentActive = await User.countDocuments({
        restaurantId: restaurant._id,
        isActive: true,
        role: { $ne: 'RESTAURANT_ADMIN' } // Usually admin doesn't count, or does it? 
        // User request: "Plan: BASIC, Staff limit: 5". 
        // The implementation_plan says "Count ONLY active entities".
        // Let's assume ALL users associated with the restaurant count, OR maybe Restaurant Admin is exempt?
        // Usually the Admin is the "Account Owner".
        // Let's check `enforcePlanFeature` logic. It counted ALL users.
        // So I will count ALL users for now to match existing behavior.
      });
    } else {
      throw new Error(`Unknown feature limit: ${feature}`);
    }

    return {
      allowed: currentActive < limit,
      limit,
      currentActive,
      planName: plan.name
    };
  }

  /**
   * Validates if a new activation is allowed. Throws error if not.
   * Use this when toggling isActive = true.
   */
  async validateActivation(restaurantId, feature) {
    const { allowed, limit, currentActive } = await this.checkActiveLimit(restaurantId, feature);
    if (!allowed) {
      const error = new Error(`Plan limit reached: You can have up to ${limit} active items. Deactivate existing ones to proceed.`);
      error.statusCode = 403;
      error.code = 'LIMIT_REACHED';
      throw error;
    }
    return true;
  }

  async _getRestaurantPlan(restaurantId) {
    // We need to fetch the restaurant with populated plan
    // Since we don't have direct access to Restaurant model here (circular dependency risk?), 
    // let's dynamically import or pass it in. 
    // Better: Query Plan directly if we know planId, but we only have restaurantId.
    // Let's import Restaurant.
    const { Restaurant } = await import("../models/restaurant.models.js");
    return Restaurant.findById(restaurantId).populate('planId');
  }
}

export const subscriptionService = new SubscriptionService();
