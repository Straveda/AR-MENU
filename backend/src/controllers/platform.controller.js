import mongoose from 'mongoose';
import { Restaurant } from '../models/restaurant.models.js';
import { User } from '../models/user.models.js';
import { Plan } from '../models/plan.models.js';
import { subscriptionService } from '../services/subscriptionService.js';
import { logAudit } from '../utils/logger.js';
import { Dish } from '../models/dish.models.js';
import { SubscriptionLog } from '../models/subscriptionLog.models.js';
import slugify from 'slugify';
import bcrypt from 'bcryptjs';
import { validateMeshyConfig } from '../config/meshy.config.js';
import { Order } from '../models/order.models.js';
import { AuditLog } from '../models/auditLog.model.js';
import { createImageTo3DTask, triggerPendingModelsForRestaurant } from '../services/meshyService.js';
import { startPollingForDish } from '../services/pollingService.js';
import { PlatformSettings } from '../models/platformSettings.model.js';

const getSubscriptionLogs = async (req, res) => {
  try {
    const logs = await SubscriptionLog.find({})
      .populate('restaurantId', 'name slug')
      .populate('planId', 'name price')
      .populate('previousPlanId', 'name')
      .populate('performedBy', 'username')
      .sort({ createdAt: -1 })
      .limit(100);

    return res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

const getSubscriptionStats = async (req, res) => {
  try {
    const [total, active, trial, suspended, expired, noPlan, restaurants] = await Promise.all([
      Restaurant.countDocuments({}),
      Restaurant.countDocuments({ subscriptionStatus: 'ACTIVE' }),
      Restaurant.countDocuments({ subscriptionStatus: 'TRIAL' }),
      Restaurant.countDocuments({ subscriptionStatus: 'SUSPENDED' }),
      Restaurant.countDocuments({ subscriptionStatus: 'EXPIRED' }),
      Restaurant.countDocuments({ planId: null }),
      Restaurant.find({
        subscriptionStatus: { $in: ['ACTIVE', 'TRIAL'] },
        planId: { $ne: null },
      }).populate('planId'),
    ]);

    let totalMRR = 0;
    restaurants.forEach((r) => {
      if (r.planId && r.planId.price) {
        const price = r.planId.price;
        const interval = r.planId.interval?.toLowerCase();
        if (interval === 'yearly') {
          totalMRR += price / 12;
        } else {
          totalMRR += price;
        }
      }
    });

    const now = new Date();
    const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const expiringSoon = await Restaurant.countDocuments({
      subscriptionEndsAt: { $gt: now, $lte: next7Days },
      subscriptionStatus: { $ne: 'SUSPENDED' },
    });

    return res.status(200).json({
      success: true,
      data: {
        total,
        active,
        trial,
        suspended,
        expired,
        noPlan,
        totalMRR: Math.round(totalMRR),
        activeSubscriptions: restaurants.length,
        expiringSoon,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

const getAllRestaurants = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [restaurants, totalItems] = await Promise.all([
      Restaurant.find({}).skip(skip).limit(limit),
      Restaurant.countDocuments({}),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return res.status(200).json({
      success: true,
      message: 'Restaurant fetched successfully',
      data: restaurants,
      meta: {
        page,
        limit,
        totalItems,
        totalPages,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [users, totalItems] = await Promise.all([
      User.find({})
        .select('-password')
        .populate('restaurantId', 'name slug')
        .skip(skip)
        .limit(limit),
      User.countDocuments({}),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return res.status(200).json({
      success: true,
      message: 'Users fetched successfully',
      data: users,
      meta: {
        page,
        limit,
        totalItems,
        totalPages,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

const createPlatformUser = async (req, res) => {
  try {
    const { email, password, username, phone, role, restaurantId } = req.body;

    if (!email || !password || !username || !role) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, username, and role are required',
      });
    }

    const validRoles = ['SUPER_ADMIN', 'RESTAURANT_ADMIN', 'KDS'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role provided',
      });
    }

    // Role-based access control for creating users
    // Only Super Admin can create other Super Admins
    if (role === 'SUPER_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only Super Admin can create system roles',
      });
    }

    const isPlatformRole = role === 'SUPER_ADMIN';
    if (req.user.role === 'RESTAURANT_ADMIN' && ['SUPER_ADMIN'].includes(role)) {
      return res
        .status(403)
        .json({ success: false, message: 'Restaurant Admins cannot create platform roles' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    if (!isPlatformRole && !restaurantId) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant ID is required for this role',
      });
    }

    if (restaurantId) {
      const restaurant = await Restaurant.findById(restaurantId);
      if (!restaurant) {
        return res.status(404).json({
          success: false,
          message: 'Restaurant not found',
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
      username,
      phone,
      role,
      department: req.body.department || null,
      roleTitle: req.body.roleTitle || null,
      restaurantId: isPlatformRole ? null : restaurantId,
      isActive: true,
    });

    const userResponse = user.toObject();
    delete userResponse.password;

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userResponse,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { username, phone, role, restaurantId, department, roleTitle } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.role === 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify Super Admin users',
      });
    }

    if (username) user.username = username;
    if (department !== undefined) user.department = department;
    if (roleTitle !== undefined) user.roleTitle = roleTitle;
    if (phone) user.phone = phone;
    if (role) {
      const validRoles = ['SUPER_ADMIN', 'RESTAURANT_ADMIN', 'KDS'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role',
        });
      }

      if (
        (role === 'SUPER_ADMIN' || role === 'PLATFORM_ADMIN') &&
        req.user.role !== 'SUPER_ADMIN'
      ) {
        return res
          .status(403)
          .json({ success: false, message: 'Insufficient permissions to assign this role' });
      }

      user.role = role;
    }

    const isPlatformRole = ['SUPER_ADMIN', 'PLATFORM_ADMIN'].includes(user.role);

    if (restaurantId !== undefined) {
      if (restaurantId && !isPlatformRole) {
        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
          return res.status(404).json({
            success: false,
            message: 'Restaurant not found',
          });
        }
        user.restaurantId = restaurantId;
      } else if (isPlatformRole) {
        user.restaurantId = null;
      }
    }

    await user.save();

    const userResponse = await User.findById(userId)
      .select('-password')
      .populate('restaurantId', 'name slug');

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: userResponse,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

const toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.role === 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify Super Admin users',
      });
    }

    if (!user.isActive) {
      if (user.restaurantId) {
        await subscriptionService.validateActivation(user.restaurantId, 'maxStaff');
      }
    }

    user.isActive = !user.isActive;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { isActive: user.isActive },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

const createRestaurant = async (req, res) => {
  try {
    const { name, address, email, phone, planId, subscriptionType, status } = req.body;

    if (!name || !address || !email || !phone || !planId || !status) {
      return res.status(400).json({
        success: false,
        message: 'Name, address, email, phone, plan, and status are required',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
      });
    }

    let slug = slugify(name, { lower: true });

    const existing = await Restaurant.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Selected plan not found',
      });
    }

    const isActive = status === 'Active';
    const hasPaidPlan = plan.price > 0;

    let subscriptionEndsAt = new Date();
    if (subscriptionType === 'YEARLY') {
      subscriptionEndsAt.setFullYear(subscriptionEndsAt.getFullYear() + 1);
    } else {
      subscriptionEndsAt.setMonth(subscriptionEndsAt.getMonth() + 1);
    }

    const restaurant = await Restaurant.create({
      name,
      slug,
      address,
      contactEmail: email,
      contactPhone: phone,
      planId: plan._id,
      subscriptionType: subscriptionType || 'MONTHLY',
      status: status,
      subscriptionStatus: isActive
        ? (hasPaidPlan ? 'PAYMENT_PENDING' : 'ACTIVE')
        : 'SUSPENDED',
      subscriptionStartsAt: new Date(),
      subscriptionEndsAt: subscriptionEndsAt,
      isActive: isActive,
    });

    await SubscriptionLog.create({
      restaurantId: restaurant._id,
      planId: plan._id,
      action: 'ASSIGN',
      durationInDays: subscriptionType === 'YEARLY' ? 365 : 30,
      performedBy: req.user?._id,
    });

    return res.status(201).json({
      success: true,
      message: 'Restaurant created successfully',
      data: restaurant,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Can't create new Restaurant",
      error: error.message,
    });
  }
};

const updateRestaurantStatus = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { subscriptionStatus } = req.body;

    if (!subscriptionStatus) {
      return res.status(400).json({
        success: false,
        message: 'Subscription Status is required',
      });
    }

    const allowedStatuses = ['ACTIVE', 'SUSPENDED', 'EXPIRED'];
    if (!allowedStatuses.includes(subscriptionStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription status',
      });
    }

    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    restaurant.subscriptionStatus = subscriptionStatus;
    restaurant.isActive = subscriptionStatus === 'ACTIVE';

    await restaurant.save();

    return res.status(200).json({
      success: true,
      message: 'Restaurant status updated successfully',
      data: restaurant,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
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
        message: 'All fields are required',
      });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    if (restaurant.subscriptionStatus !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Restaurant subscription is not active.',
      });
    }

    if (!restaurant.planId) {
      return res.status(403).json({
        success: false,
        message: 'No plan assigned to this restaurant.',
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
      role: 'RESTAURANT_ADMIN',
    });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant admin already exists',
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
      username,
      phone,
      role: 'RESTAURANT_ADMIN',
      restaurantId,
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: 'Restaurant admin created successfully',
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
      message: 'Internal server error',
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
        message: 'restaurantId, planId and durationInDays are required',
      });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found',
      });
    }

    const now = new Date();
    const subscriptionEndsAt = new Date(now.getTime() + durationInDays * 24 * 60 * 60 * 1000);

    restaurant.planId = plan._id;
    restaurant.subscriptionStatus = 'ACTIVE';
    restaurant.subscriptionEndsAt = subscriptionEndsAt;

    await restaurant.save();

    await SubscriptionLog.create({
      restaurantId: restaurant._id,
      planId: plan._id,
      action: 'ASSIGN',
      durationInDays: Number(durationInDays),
      performedBy: req.user?._id,
    });

    // Auto-trigger AR models if featured
    triggerPendingModelsForRestaurant(restaurant._id, plan._id);

    return res.status(200).json({
      success: true,
      message: 'Plan assigned to restaurant successfully',
      data: {
        restaurantId: restaurant._id,
        plan: plan.name,
        subscriptionEndsAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
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
        message: 'Invalid restaurantId',
      });
    }

    if (!extendByDays || extendByDays <= 0) {
      return res.status(400).json({
        success: false,
        message: 'extendByDays must be a positive number',
      });
    }

    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    const now = new Date();

    const baseDate =
      !restaurant.subscriptionEndsAt || restaurant.subscriptionEndsAt < now
        ? now
        : restaurant.subscriptionEndsAt;

    restaurant.subscriptionEndsAt = new Date(
      baseDate.getTime() + extendByDays * 24 * 60 * 60 * 1000,
    );

    if (restaurant.subscriptionStatus !== 'SUSPENDED') {
      restaurant.subscriptionStatus = 'ACTIVE';
    }

    await restaurant.save();

    await SubscriptionLog.create({
      restaurantId: restaurant._id,
      planId: restaurant.planId,
      action: 'EXTEND',
      durationInDays: Number(extendByDays),
      performedBy: req.user?._id,
    });

    return res.status(200).json({
      success: true,
      message: 'Subscription extended successfully',
      data: {
        restaurantId: restaurant._id,
        subscriptionStatus: restaurant.subscriptionStatus,
        subscriptionEndsAt: restaurant.subscriptionEndsAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
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
        message: 'Invalid restaurantId or planId',
      });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    const newPlan = await Plan.findById(planId);

    if (!restaurant || !newPlan) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant or Plan not found',
      });
    }

    const dishCount = await Dish.countDocuments({
      restaurantId: restaurant._id,
    });

    const staffCount = await User.countDocuments({
      restaurantId: restaurant._id,
      isActive: true,
    });

    if (newPlan.limits?.maxDishes !== undefined && dishCount > newPlan.limits.maxDishes) {
      return res.status(400).json({
        success: false,
        message: `Plan downgrade blocked: ${dishCount} dishes exceed new plan limit (${newPlan.limits.maxDishes})`,
      });
    }

    if (newPlan.limits?.maxStaff !== undefined && staffCount > newPlan.limits.maxStaff) {
      return res.status(400).json({
        success: false,
        message: `Plan downgrade blocked: ${staffCount} staff exceed new plan limit (${newPlan.limits.maxStaff})`,
      });
    }

    const oldPlanId = restaurant.planId;
    restaurant.planId = newPlan._id;

    // If the new plan has a price > 0, set status to PAYMENT_PENDING
    // This will trigger the payment modal for the restaurant admin on next login
    if (newPlan.price > 0) {
      restaurant.subscriptionStatus = 'PAYMENT_PENDING';
    }

    await restaurant.save();

    await SubscriptionLog.create({
      restaurantId: restaurant._id,
      planId: newPlan._id,
      action: 'CHANGE',
      previousPlanId: oldPlanId,
      performedBy: req.user?._id,
    });

    // Auto-trigger AR models if featured
    triggerPendingModelsForRestaurant(restaurant._id, newPlan._id);

    return res.status(200).json({
      success: true,
      message: 'Restaurant plan updated successfully',
      data: {
        restaurantId: restaurant._id,
        newPlan: newPlan.name,
        requiresPayment: newPlan.price > 0,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
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
        message: 'Invalid restaurantId',
      });
    }

    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    restaurant.subscriptionStatus = 'SUSPENDED';
    await restaurant.save();

    return res.status(200).json({
      success: true,
      message: 'Restaurant suspended successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
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
        message: 'Invalid restaurantId',
      });
    }

    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    if (!restaurant.subscriptionEndsAt || restaurant.subscriptionEndsAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot resume: subscription expired',
      });
    }

    restaurant.subscriptionStatus = 'ACTIVE';
    await restaurant.save();

    return res.status(200).json({
      success: true,
      message: 'Restaurant resumed successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

const getStaff = async (req, res) => {
  try {
    const restaurant = req.restaurant;
    if (!restaurant) {
      return res.status(500).json({
        success: false,
        message: 'Restaurant context not found',
      });
    }

    const staff = await User.find({
      restaurantId: restaurant._id,
      role: { $in: ['KDS'] },
    }).select('-password');

    return res.status(200).json({
      success: true,
      message: 'Staff fetched successfully',
      data: staff,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

const createStaffUser = async (req, res) => {
  try {
    const { email, password, username, phone, department, roleTitle } = req.body;
    const restaurant = req.restaurant;

    const plan = await Plan.findById(restaurant.planId);
    if (!plan) {
      return res.status(403).json({
        success: false,
        message: 'No active plan found for this restaurant.',
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

    if (!email || !password || !username || !department || !roleTitle) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, username, department, and role title are required',
      });
    }

    const validDepartments = ['KDS', 'Finance', 'Operations'];
    if (!validDepartments.includes(department)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid department. Must be one of: KDS, Finance, Operations',
      });
    }

    if (roleTitle.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Role title must be 100 characters or less',
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
      username,
      phone,
      role: 'KDS',
      department,
      roleTitle,
      restaurantId: restaurant._id,
      isActive: true,
    });

    await logAudit({
      req,
      action: 'STAFF_CREATED',
      targetId: user._id,
      targetModel: 'User',
      changes: { email, department, roleTitle },
    });

    return res.status(201).json({
      success: true,
      message: 'Staff created successfully',
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

const updateStaffUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { username, phone, role } = req.body;
    const restaurant = req.restaurant;

    const user = await User.findOne({ _id: userId, restaurantId: restaurant._id });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Staff user not found' });
    }

    if (username) user.username = username;
    if (phone) user.phone = phone;

    if (role) {
      const allowedRoles = ['KDS'];
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({ success: false, message: 'Invalid Role' });
      }
      const oldRole = user.role;
      user.role = role;

      await logAudit({
        req,
        action: 'STAFF_UPDATED',
        targetId: user._id,
        targetModel: 'User',
        changes: { roleChange: { from: oldRole, to: role } },
      });
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Staff updated successfully',
      data: user,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const toggleStaffStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const restaurant = req.restaurant;

    const user = await User.findOne({ _id: userId, restaurantId: restaurant._id });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found in your restaurant',
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    await logAudit({
      req,
      action: 'STAFF_STATUS_CHANGED',
      targetId: user._id,
      targetModel: 'User',
      changes: { isActive: user.isActive },
    });

    return res.status(200).json({
      success: true,
      message: `Staff ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { isActive: user.isActive },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

const deleteStaff = async (req, res) => {
  try {
    const { userId } = req.params;
    const restaurant = req.restaurant;

    const user = await User.findOne({ _id: userId, restaurantId: restaurant._id });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found in your restaurant',
      });
    }

    await User.deleteOne({ _id: userId });

    await logAudit({
      req,
      action: 'STAFF_DELETED',
      targetId: userId,
      targetModel: 'User',
    });

    return res.status(200).json({
      success: true,
      message: 'Staff member deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

const deleteRestaurant = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { restaurantId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid restaurantId',
      });
    }

    const restaurant = await Restaurant.findById(restaurantId).session(session);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    await Promise.all([
      User.deleteMany({ restaurantId }).session(session),
      Dish.deleteMany({ restaurantId }).session(session),
      Order.deleteMany({ restaurantId }).session(session),
      SubscriptionLog.deleteMany({ restaurantId }).session(session),
      AuditLog.deleteMany({ restaurantId }).session(session),
    ]);

    await Restaurant.findByIdAndDelete(restaurantId).session(session);

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: 'Restaurant and all associated data deleted successfully',
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({
      success: false,
      message: 'Internal server error during deletion',
      error: error.message,
    });
  }
};

const getSystemHealth = async (req, res) => {
  try {
    const health = {
      apiServer: 'operational',
      database: mongoose.connection.readyState === 1 ? 'operational' : 'degraded',
      modelService: validateMeshyConfig() ? 'operational' : 'unconfigured',
    };

    return res.status(200).json({
      success: true,
      message: 'System health fetched successfully',
      data: health,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error during health check',
      error: error.message,
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid userId',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user._id.toString() === req.user?._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account from here',
      });
    }

    await User.findByIdAndDelete(userId);

    await logAudit({
      req,
      action: 'USER_DELETED',
      targetId: userId,
      targetModel: 'User',
      changes: { email: user.email, role: user.role },
    });

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error during user deletion',
      error: error.message,
    });
  }
};

const initiatePayment = async (req, res) => {
  try {
    const { planId } = req.body;
    const restaurant = req.restaurant; // Assumes resolved by middleware

    // In a real implementation:
    // 1. Create Order in Razorpay
    // 2. Return order_id and amount

    const plan = await Plan.findById(planId);
    if (!plan) return res.status(404).json({ message: 'Plan not found' });

    return res.status(200).json({
      success: true,
      data: {
        orderId: `order_mock_${Date.now()}`,
        amount: plan.price * 100, // In paise
        currency: 'INR',
        key: 'rzp_test_mock_key'
      }
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { _paymentId, _orderId, _signature } = req.body;
    const restaurant = req.restaurant;

    // In real implementation: Verify signature

    restaurant.subscriptionStatus = 'ACTIVE';
    restaurant.subscriptionStartsAt = new Date();

    // Calculate endsAt based on interval
    const plan = await Plan.findById(restaurant.planId);
    const now = new Date();
    if (plan.interval === 'YEARLY') {
      now.setFullYear(now.getFullYear() + 1);
    } else {
      now.setMonth(now.getMonth() + 1);
    }
    restaurant.subscriptionEndsAt = now;

    await restaurant.save();

    await SubscriptionLog.create({
      restaurantId: restaurant._id,
      planId: restaurant.planId,
      action: 'ASSIGN', // Changed from 'RENEW' to match enum values
      durationInDays: plan.interval === 'YEARLY' ? 365 : 30,
      performedBy: req.user?._id,
    });

    return res.status(200).json({
      success: true,
      message: 'Payment verified and subscription activated'
    });


  } catch (error) {
    console.error('Error in verifyPayment:', error);
  }
};

const getPlatformSettings = async (req, res) => {
  try {
    const settings = await PlatformSettings.getSettings();
    return res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

const updatePlatformSettings = async (req, res) => {
  try {
    const { featureToggles, notificationSettings } = req.body;
    const settings = await PlatformSettings.getSettings();

    if (featureToggles) {
      settings.featureToggles = { ...settings.featureToggles, ...featureToggles };
    }

    if (notificationSettings) {
      settings.notificationSettings = { ...settings.notificationSettings, ...notificationSettings };
    }

    settings.updatedBy = req.user._id;
    await settings.save();

    return res.status(200).json({
      success: true,
      message: 'Platform settings updated successfully',
      data: settings,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

export {
  getAllRestaurants,
  getSubscriptionLogs,
  getSubscriptionStats,
  getAllUsers,
  createPlatformUser,
  updateUser,
  toggleUserStatus,
  createRestaurant,
  updateRestaurantStatus,
  createRestaurantAdmin,
  assignPlanToRestaurant,
  extendSubscription,
  changeRestaurantPlan,
  suspendRestaurant,
  resumeRestaurant,
  getStaff,
  createStaffUser,
  updateStaffUser,
  toggleStaffStatus,
  deleteStaff,
  getSystemHealth,
  deleteRestaurant,
  deleteUser,
  initiatePayment,
  verifyPayment,
  getPlatformSettings,
  updatePlatformSettings,
};
