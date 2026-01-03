export const checkSubscription = async (req, res, next) => {
  try {
    const restaurant = req.restaurant;

    if (!restaurant) {
      return res.status(500).json({
        success: false,
        message: 'Restaurant context missing',
      });
    }

    if (restaurant.subscriptionStatus === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        message: 'Restaurant access suspended. Contact support.',
      });
    }

    if (restaurant.subscriptionEndsAt && new Date() > new Date(restaurant.subscriptionEndsAt)) {
      if (restaurant.subscriptionStatus !== 'EXPIRED') {
        restaurant.subscriptionStatus = 'EXPIRED';
        await restaurant.save();
      }

      return res.status(403).json({
        success: false,
        message: 'Subscription expired. Please renew to continue.',
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to verify restaurant status',
      error: error.message,
    });
  }
};
