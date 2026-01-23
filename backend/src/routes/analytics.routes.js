import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller.js';
import { requireAuth } from '../middlewares/requireAuth.middleware.js';
import { resolveRestaurantFromUser } from '../middlewares/resolveRestaurantFromUser.middleware.js';
import { requireRole } from '../middlewares/requireRole.middleware.js';
import { checkSubscription } from '../middlewares/checkSubscription.middleware.js';
import { enforcePlanFeature } from '../middlewares/enforcePlanFeature.middleware.js';

const router = Router();

router.use(requireAuth);
router.use(resolveRestaurantFromUser);
router.use(checkSubscription);
router.use(requireRole('RESTAURANT_ADMIN'));

// Dashboard analytics - accessible to all
router.get('/dashboard', analyticsController.getDashboardAnalytics);

// Detailed analytics - requires analytics feature
router.get('/detailed', enforcePlanFeature('analytics'), analyticsController.getDetailedAnalytics);

export default router;
