import express from 'express';
import { requireRole } from '../middlewares/requireRole.middleware.js';
import { requireAuth } from '../middlewares/requireAuth.middleware.js';
import {
  getAllRestaurants,
  getSubscriptionLogs,
  getSubscriptionStats,
  getAllUsers,
  createRestaurant,
  updateRestaurantStatus,
  createRestaurantAdmin,
  assignPlanToRestaurant,
  extendSubscription,
  changeRestaurantPlan,
  suspendRestaurant,
  resumeRestaurant,
  createPlatformUser,
  updateUser,
  toggleUserStatus,
  getSystemHealth,
  deleteRestaurant,
  deleteUser,
  initiatePayment,

  verifyPayment,
  getPlatformSettings,
  updatePlatformSettings,
} from '../controllers/platform.controller.js';

const platformRouter = express.Router();

platformRouter.get(
  '/get-all-restaurants',
  requireAuth,
  requireRole('SUPER_ADMIN'),
  getAllRestaurants,
);

platformRouter.get('/get-all-users', requireAuth, requireRole('SUPER_ADMIN'), getAllUsers);

platformRouter.get(
  '/get-subscription-logs',
  requireAuth,
  requireRole('SUPER_ADMIN'),
  getSubscriptionLogs,
);

platformRouter.get(
  '/get-subscription-stats',
  requireAuth,
  requireRole('SUPER_ADMIN'),
  getSubscriptionStats,
);

platformRouter.post(
  '/create-restaurant',
  requireAuth,
  requireRole('SUPER_ADMIN'),
  createRestaurant,
);

platformRouter.patch(
  '/update-restaurant-status/:restaurantId',
  requireAuth,
  requireRole('SUPER_ADMIN'),
  updateRestaurantStatus,
);

platformRouter.post(
  '/create-restaurant-admin',
  requireAuth,
  requireRole('SUPER_ADMIN'),
  createRestaurantAdmin,
);

platformRouter.patch(
  '/assign-plan',
  requireAuth,
  requireRole('SUPER_ADMIN'),
  assignPlanToRestaurant,
);

platformRouter.patch(
  '/extend-subscription/:restaurantId',
  requireAuth,
  requireRole('SUPER_ADMIN'),
  extendSubscription,
);

platformRouter.patch(
  '/change-plan/:restaurantId',
  requireAuth,
  requireRole('SUPER_ADMIN'),
  changeRestaurantPlan,
);

platformRouter.patch(
  '/suspend-restaurant/:restaurantId',
  requireAuth,
  requireRole('SUPER_ADMIN'),
  suspendRestaurant,
);

platformRouter.patch(
  '/resume-restaurant/:restaurantId',
  requireAuth,
  requireRole('SUPER_ADMIN'),
  resumeRestaurant,
);

import { resolveRestaurantFromUser } from '../middlewares/resolveRestaurantFromUser.middleware.js';

platformRouter.post(
  '/create-user',
  requireAuth,
  requireRole('SUPER_ADMIN', 'PLATFORM_ADMIN', 'RESTAURANT_ADMIN'),
  resolveRestaurantFromUser,

  createPlatformUser,
);

platformRouter.put('/update-user/:userId', requireAuth, requireRole('SUPER_ADMIN'), updateUser);

platformRouter.patch(
  '/toggle-user-status/:userId',
  requireAuth,
  requireRole('SUPER_ADMIN'),
  toggleUserStatus,
);

platformRouter.get('/get-system-health', requireAuth, requireRole('SUPER_ADMIN'), getSystemHealth);

platformRouter.post('/initiate-payment', requireAuth, requireRole('RESTAURANT_ADMIN', 'SUPER_ADMIN'), resolveRestaurantFromUser, initiatePayment);
platformRouter.post('/verify-payment', requireAuth, requireRole('RESTAURANT_ADMIN', 'SUPER_ADMIN'), resolveRestaurantFromUser, verifyPayment);

platformRouter.delete(
  '/delete-restaurant/:restaurantId',
  requireAuth,
  requireRole('SUPER_ADMIN'),
  deleteRestaurant,
);

platformRouter.delete('/delete-user/:userId', requireAuth, requireRole('SUPER_ADMIN'), deleteUser);

export default platformRouter;
