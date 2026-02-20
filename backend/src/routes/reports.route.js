import { Router } from 'express';
import * as reportsController from '../controllers/reports.controller.js';
import { requireAuth } from '../middlewares/requireAuth.middleware.js';
import { resolveRestaurantFromUser } from '../middlewares/resolveRestaurantFromUser.middleware.js';
import { requireRole } from '../middlewares/requireRole.middleware.js';
import { checkSubscription } from '../middlewares/checkSubscription.middleware.js';

const router = Router();

// Apply middleware to all routes
router.use(requireAuth);
router.use(resolveRestaurantFromUser);
router.use(checkSubscription);
router.use(requireRole('RESTAURANT_ADMIN'));

// Dashboard summary
router.get('/summary', reportsController.getReportsSummary);

// Reports endpoints
router.get('/daily-sales', reportsController.getDailySales);
router.get('/monthly-gst', reportsController.getMonthlyGST);
router.get('/aggregator-mismatch', reportsController.getAggregatorMismatches);
router.get('/payment-reconciliation', reportsController.getPaymentReconciliation);

// Export endpoint
router.get('/export', reportsController.exportReport);

// Sync endpoints
router.post('/aggregator-orders/sync', reportsController.syncAggregatorOrders);
router.post('/aggregator-orders/auto-match', reportsController.autoMatchAggregatorOrders);
router.post('/razorpay-settlements/sync', reportsController.syncRazorpaySettlements);

// Action endpoints
router.post('/aggregator-mismatch/:mismatchId/resolve', reportsController.resolveAggregatorMismatch);

export default router;
