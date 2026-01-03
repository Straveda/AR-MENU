import Restaurant from '../models/restaurant.models.js';

export const resolveRestaurant = async (req, res, next) => {
  try {
    const { restaurantSlug } = req.params;

    if (!restaurantSlug) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant slug missing',
      });
    }

    const restaurant = await Restaurant.findOne({
      slug: restaurantSlug,
      status: 'Active',
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    req.restaurant = restaurant;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to resolve restaurant',
    });
  }
};
