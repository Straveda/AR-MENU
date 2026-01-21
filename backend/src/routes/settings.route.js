import express from 'express';
import { requireAuth } from '../middlewares/requireAuth.middleware.js';
import { requireRole } from '../middlewares/requireRole.middleware.js';
import { resolveRestaurantFromUser } from '../middlewares/resolveRestaurantFromUser.middleware.js';
import {
  updateRestaurantProfile,
  changePassword,
  getRestaurantProfile,
} from '../controllers/settings.controller.js';

const settingsRouter = express.Router();

settingsRouter.get(
  '/profile',
  requireAuth,
  resolveRestaurantFromUser,
  requireRole('RESTAURANT_ADMIN'),
  getRestaurantProfile,
);

settingsRouter.put(
  '/profile',
  requireAuth,
  resolveRestaurantFromUser,
  requireRole('RESTAURANT_ADMIN'),
  updateRestaurantProfile,
);

settingsRouter.put(
  '/password',
  requireAuth,

  changePassword,
);

export default settingsRouter;
