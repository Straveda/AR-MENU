import { Restaurant } from "../models/restaurant.models.js";

export const resolveRestaurantFromUser = async (req, res, next) => {
  try {

    if (["SUPER_ADMIN", "PLATFORM_ADMIN"].includes(req.user.role)) {
      req.restaurant = null;
      return next();
    }

    if (!req.user.restaurantId) {
      return res.status(400).json({
        success: false,
        message: "User is not associated with any restaurant",
      });
    }

    const restaurant = await Restaurant.findById(req.user.restaurantId);

    if (!restaurant || restaurant.status !== "Active") {
      return res.status(403).json({
        success: false,
        message: "Restaurant is inactive or not found",
      });
    }

    req.restaurant = restaurant;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to resolve restaurant context",
    });
  }
};
