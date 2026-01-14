import { Plan } from '../models/plan.models.js';
import { Dish } from '../models/dish.models.js';
import { User } from '../models/user.models.js';

class SubscriptionService {
  
  async checkActiveLimit(restaurantId, feature) {
    const restaurant = await this._getRestaurantPlan(restaurantId);
    if (!restaurant) throw new Error('Restaurant or Plan not found');

    const plan = restaurant.planId;
    let limit = 0;
    let currentActive = 0;

    if (feature === 'maxDishes') {
      limit = plan.limits?.maxDishes || 0;
      currentActive = await Dish.countDocuments({
        restaurantId: restaurant._id,
        isActive: true,
      });
    } else if (feature === 'maxStaff') {
      limit = plan.limits?.maxStaff || 0;
      currentActive = await User.countDocuments({
        restaurantId: restaurant._id,
        isActive: true,
        role: { $ne: 'RESTAURANT_ADMIN' }, 
        
        
        
        
        
        
      });
    } else {
      throw new Error(`Unknown feature limit: ${feature}`);
    }

    return {
      allowed: currentActive < limit,
      limit,
      currentActive,
      planName: plan.name,
    };
  }

  
  async validateActivation(restaurantId, feature) {
    const { allowed, limit, currentActive } = await this.checkActiveLimit(restaurantId, feature);
    if (!allowed) {
      const error = new Error(
        `Plan limit reached: You can have up to ${limit} active items. Deactivate existing ones to proceed.`,
      );
      error.statusCode = 403;
      error.code = 'LIMIT_REACHED';
      throw error;
    }
    return true;
  }

  async _getRestaurantPlan(restaurantId) {
    
    
    
    
    
    const { Restaurant } = await import('../models/restaurant.models.js');
    return Restaurant.findById(restaurantId).populate('planId');
  }
}

export const subscriptionService = new SubscriptionService();
