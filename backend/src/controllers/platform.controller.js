import mongoose from "mongoose";
import { Restaurant } from "../models/restaurant.models.js"
import { User } from "../models/user.models.js";
import { Plan } from "../models/plan.models.js";
import { Dish } from "../models/dish.models.js";
import slugify from "slugify";
import bcrypt from "bcryptjs"

const getAllRestaurants = async (req, res) => {
    try {
        const restaurants = await Restaurant.find({});

        if (!restaurants || restaurants.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No restaurants found"
            })
        }

        return res.status(200).json({
            success: true,
            message: "Restaurant fetched successfully",
            data: restaurants
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        })
    }
}

const createRestaurant = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Name is required"
            })
        }

        let slug = slugify(name, { lower: true })

        const existing = await Restaurant.findOne({ slug })
        if (existing) {
            slug = `${slug}-${Date.now()}`;
        }

        const restaurant = await Restaurant.create({
            name,
            slug,
            status: "Active",
            subscriptionStatus: "TRIAL",
            subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        })

        return res.status(201).json({
            success: true,
            message: "Restaurant created successfully",
            data: restaurant
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Can't create new Restaurant",
            error: error.message
        })
    }
}

const updateRestaurantStatus = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { subscriptionStatus } = req.body;

    if (!subscriptionStatus) {
      return res.status(400).json({
        success: false,
        message: "Subscription Status is required",
      });
    }

    const allowedStatuses = ["ACTIVE", "SUSPENDED", "EXPIRED"];
    if (!allowedStatuses.includes(subscriptionStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subscription status",
      });
    }

    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    restaurant.subscriptionStatus = subscriptionStatus;
    restaurant.isActive = subscriptionStatus === "ACTIVE";

    await restaurant.save();

    return res.status(200).json({
      success: true,
      message: "Restaurant status updated successfully",
      data: restaurant,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const createRestaurantAdmin = async (req, res) => {
  try {
    const { restaurantId, email, password, username, phone } = req.body;

    if (!restaurantId || !email || !password || !username || !phone) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    if (restaurant.subscriptionStatus !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "Restaurant subscription is not active.",
      });
    }

    // Plan-based staff limit check
    if (!restaurant.planId) {
      return res.status(403).json({
        success: false,
        message: "No plan assigned to this restaurant.",
      });
    }

    const plan = await Plan.findById(restaurant.planId);
    const staffLimit = plan?.limits?.maxStaff || 0;
    const currentStaffCount = await User.countDocuments({ restaurantId });

    if (currentStaffCount >= staffLimit) {
      return res.status(403).json({
        success: false,
        message: `Staff limit reached (${staffLimit}). Please upgrade your plan.`,
      });
    }

    const existingAdmin = await User.findOne({
      restaurantId,
      role: "RESTAURANT_ADMIN",
    });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Restaurant admin already exists",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already in use",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
      username,
      phone,
      role: "RESTAURANT_ADMIN",
      restaurantId,
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: "Restaurant admin created successfully",
      data: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
        restaurantId: user.restaurantId,
      },
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const assignPlanToRestaurant = async (req, res) => {
  try {
    const { restaurantId, planId, durationInDays } = req.body;

    if (!restaurantId || !planId || !durationInDays) {
      return res.status(400).json({
        success: false,
        message: "restaurantId, planId and durationInDays are required",
      });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    const now = new Date();
    const subscriptionEndsAt = new Date(
      now.getTime() + durationInDays * 24 * 60 * 60 * 1000
    );

    restaurant.planId = plan._id;
    restaurant.subscriptionStatus = "ACTIVE";
    restaurant.subscriptionEndsAt = subscriptionEndsAt;

    await restaurant.save();

    return res.status(200).json({
      success: true,
      message: "Plan assigned to restaurant successfully",
      data: {
        restaurantId: restaurant._id,
        plan: plan.name,
        subscriptionEndsAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const extendSubscription = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { extendByDays } = req.body;

    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid restaurantId",
      });
    }

    if (!extendByDays || extendByDays <= 0) {
      return res.status(400).json({
        success: false,
        message: "extendByDays must be a positive number",
      });
    }

    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    const now = new Date();

    const baseDate =
      !restaurant.subscriptionEndsAt ||
      restaurant.subscriptionEndsAt < now
        ? now
        : restaurant.subscriptionEndsAt;

    restaurant.subscriptionEndsAt = new Date(
      baseDate.getTime() + extendByDays * 24 * 60 * 60 * 1000
    );

    if (restaurant.subscriptionStatus !== "SUSPENDED") {
      restaurant.subscriptionStatus = "ACTIVE";
    }

    await restaurant.save();

    return res.status(200).json({
      success: true,
      message: "Subscription extended successfully",
      data: {
        restaurantId: restaurant._id,
        subscriptionStatus: restaurant.subscriptionStatus,
        subscriptionEndsAt: restaurant.subscriptionEndsAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const changeRestaurantPlan = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { planId } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(restaurantId) ||
      !mongoose.Types.ObjectId.isValid(planId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid restaurantId or planId",
      });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    const newPlan = await Plan.findById(planId);

    if (!restaurant || !newPlan) {
      return res.status(404).json({
        success: false,
        message: "Restaurant or Plan not found",
      });
    }

    const dishCount = await Dish.countDocuments({
      restaurantId: restaurant._id,
    });

    const staffCount = await User.countDocuments({
      restaurantId: restaurant._id,
      isActive: true,
    });

    if (
      newPlan.limits?.maxDishes !== undefined &&
      dishCount > newPlan.limits.maxDishes
    ) {
      return res.status(400).json({
        success: false,
        message: `Plan downgrade blocked: ${dishCount} dishes exceed new plan limit (${newPlan.limits.maxDishes})`,
      });
    }

    if (
      newPlan.limits?.maxStaff !== undefined &&
      staffCount > newPlan.limits.maxStaff
    ) {
      return res.status(400).json({
        success: false,
        message: `Plan downgrade blocked: ${staffCount} staff exceed new plan limit (${newPlan.limits.maxStaff})`,
      });
    }

    restaurant.planId = newPlan._id;
    await restaurant.save();

    return res.status(200).json({
      success: true,
      message: "Restaurant plan updated successfully",
      data: {
        restaurantId: restaurant._id,
        newPlan: newPlan.name,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const suspendRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid restaurantId",
      });
    }

    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    restaurant.subscriptionStatus = "SUSPENDED";
    await restaurant.save();

    return res.status(200).json({
      success: true,
      message: "Restaurant suspended successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const resumeRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid restaurantId",
      });
    }

    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    if (
      !restaurant.subscriptionEndsAt ||
      restaurant.subscriptionEndsAt < new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "Cannot resume: subscription expired",
      });
    }

    restaurant.subscriptionStatus = "ACTIVE";
    await restaurant.save();

    return res.status(200).json({
      success: true,
      message: "Restaurant resumed successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const createStaffUser = async (req, res) => {
  try {
    const { email, password, username, phone, role } = req.body;
    const restaurant = req.restaurant;

    const plan = await Plan.findById(restaurant.planId);
    if (!plan) {
      return res.status(403).json({
        success: false,
        message: "No active plan found for this restaurant.",
      });
    }

    const currentStaffCount = await User.countDocuments({
      restaurantId: restaurant._id,
    });

    if (currentStaffCount >= (plan.limits.maxStaff || 0)) {
      return res.status(403).json({
        success: false,
        message: `Staff limit reached (${plan.limits.maxStaff}). Please upgrade your plan.`,
      });
    }

    if (!email || !password || !username || !phone || !role) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const allowedRoles = ["KDS", "WAITER", "CASHIER"];

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        success: false,
        message: "Invalid role assignment",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const user = await User.create({
      email,
      password,
      username,
      phone,
      role,
      restaurantId: restaurant._id,
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: "Staff created successfully",
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};


export {
    getAllRestaurants,
    createRestaurant,
    updateRestaurantStatus,
    createRestaurantAdmin,
    assignPlanToRestaurant,
    extendSubscription,
    changeRestaurantPlan,
    suspendRestaurant,
    resumeRestaurant,
    createStaffUser
}