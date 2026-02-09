import { Restaurant } from '../models/restaurant.models.js';

export const resolveRestaurantFromUser = async (req, res, next) => {
  try {
    if (['SUPER_ADMIN', 'PLATFORM_ADMIN'].includes(req.user.role)) {
      req.restaurant = null;
      return next();
    }

    console.log('ResolveRestaurant Middleware - User Role:', req.user.role);
    console.log('ResolveRestaurant Middleware - RestaurantID:', req.user.restaurantId);

    if (!req.user.restaurantId) {
      return res.status(400).json({
        success: false,
        message: 'User is not associated with any restaurant',
      });
    }

    const restaurant = await Restaurant.findById(req.user.restaurantId);

    if (!restaurant) {
      return res.status(403).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    // Check if restaurant is active (status field is 'Active' or 'Inactive')
    if (restaurant.status === 'Inactive') {
      return res.status(403).json({
        success: false,
        message: 'Restaurant is inactive',
      });
    }

    req.restaurant = restaurant;
    next();
  } catch (error) {
    console.error('Error in resolveRestaurantFromUser:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to resolve restaurant context',
      error: error.message,
    });
  }
};
