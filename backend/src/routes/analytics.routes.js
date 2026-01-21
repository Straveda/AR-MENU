import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller.js';
import { requireAuth } from '../middlewares/requireAuth.middleware.js';
import { resolveRestaurantFromUser } from '../middlewares/resolveRestaurantFromUser.middleware.js';
import { requireRole } from '../middlewares/requireRole.middleware.js';

const router = Router();

router.use(requireAuth);
router.use(resolveRestaurantFromUser);
router.use(requireRole('RESTAURANT_ADMIN'));

router.get('/dashboard', analyticsController.getDashboardAnalytics);

export default router;
