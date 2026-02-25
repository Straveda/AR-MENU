import express from 'express';
import { requireAuth } from '../middlewares/requireAuth.middleware.js';
import { requireRole } from '../middlewares/requireRole.middleware.js';
import { resolveRestaurantFromUser } from '../middlewares/resolveRestaurantFromUser.middleware.js';
import { enforcePlanFeature } from '../middlewares/enforcePlanFeature.middleware.js';
import * as expensesController from '../controllers/expenses.controller.js';

const router = express.Router({ mergeParams: true });

router.use(requireAuth);
router.use(requireRole('RESTAURANT_ADMIN'));
router.use(resolveRestaurantFromUser);

router.post('/vendors', expensesController.createVendor);
router.get('/vendors', expensesController.getVendors);
router.patch('/vendors/:id', expensesController.updateVendor);

router.post('/', expensesController.createExpense);
router.get('/', expensesController.getExpenses);

export default router;
