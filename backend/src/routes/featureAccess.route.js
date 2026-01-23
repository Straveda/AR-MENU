import express from 'express';
import { requireAuth } from '../middlewares/requireAuth.middleware.js';
import { resolveRestaurantFromUser } from '../middlewares/resolveRestaurantFromUser.middleware.js';
import {
    checkFeatureAccess,
    getCurrentPlan,
    checkPublicFeatureAccess,
} from '../controllers/featureAccess.controller.js';

const featureAccessRoute = express.Router();

// Public route for guest users (menu page)
featureAccessRoute.get('/public/:slug', checkPublicFeatureAccess);

// All other routes require authentication and restaurant resolution
featureAccessRoute.use(requireAuth);
featureAccessRoute.use(resolveRestaurantFromUser);

// Get feature access status with usage stats
featureAccessRoute.get('/check', checkFeatureAccess);

// Get current plan details
featureAccessRoute.get('/plan', getCurrentPlan);

export default featureAccessRoute;
