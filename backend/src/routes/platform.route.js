import express from 'express';
import { requireRole } from '../middlewares/requireRole.middleware.js';
import { requireAuth } from '../middlewares/requireAuth.middleware.js';
import {
  getAllRestaurants,
  createRestaurant,
  updateRestaurantStatus,
  createRestaurantAdmin,
  assignPlanToRestaurant,
  extendSubscription,
  changeRestaurantPlan,
  suspendRestaurant,
  resumeRestaurant,
} from '../controllers/platform.controller.js';

const platformRouter = express.Router();

platformRouter.get(
  '/get-all-restaurants',
  requireAuth,
  requireRole('SUPER_ADMIN'),
  getAllRestaurants,
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
  "/suspend-restaurant/:restaurantId",
  requireAuth,
  requireRole("SUPER_ADMIN"),
  suspendRestaurant
);

platformRouter.patch(
  "/resume-restaurant/:restaurantId",
  requireAuth,
  requireRole("SUPER_ADMIN"),
  resumeRestaurant
);

export default platformRouter;
