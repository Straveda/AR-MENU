import express from 'express';
import { requireAuth } from '../middlewares/requireAuth.middleware.js';
import { resolveRestaurantFromUser } from '../middlewares/resolveRestaurantFromUser.middleware.js';
import { requireRole } from '../middlewares/requireRole.middleware.js';
import { checkSubscription } from '../middlewares/checkSubscription.middleware.js';

import {
    getStats,
    getRules,
    createRule,
    updateRule,
    deleteRule,
    toggleRule,
    getSuggestions,
    getDishes,
    getRecommendationsForDish,
    triggerAnalytics,
    updateRuleExplanation,
    getRecommendationsForCart,
} from '../controllers/upsell.controller.js';

const upsellRoute = express.Router();

// -----------------------------------------------------------------------------
// Public Routes (Customer Facing)
// -----------------------------------------------------------------------------
import { resolveRestaurant } from '../middlewares/resolveRestaurant.middleware.js';

// Get recommendations for a specific dish
upsellRoute.get(
    '/r/:restaurantSlug/recommendations/:dishId',
    resolveRestaurant,
    getRecommendationsForDish
);

// Get recommendations based on cart
upsellRoute.post(
    '/r/:restaurantSlug/cart-recommendations',
    resolveRestaurant,
    getRecommendationsForCart
);

// -----------------------------------------------------------------------------
// Admin Routes (Protected)
// -----------------------------------------------------------------------------

// Apply admin middleware to all routes below
upsellRoute.use(requireAuth);
upsellRoute.use(resolveRestaurantFromUser);
upsellRoute.use(requireRole('RESTAURANT_ADMIN', 'SUPER_ADMIN', 'PLATFORM_ADMIN'));
upsellRoute.use(checkSubscription);

// Dashboard stats
upsellRoute.get('/stats', getStats);

// Rules CRUD
upsellRoute.get('/rules', getRules);
upsellRoute.post('/rules', createRule);
upsellRoute.patch('/rules/:id', updateRule);
upsellRoute.delete('/rules/:id', deleteRule);
upsellRoute.patch('/rules/:id/toggle', toggleRule);
upsellRoute.post('/rules/:id/generate-explanation', updateRuleExplanation);

// AI suggestions
upsellRoute.get('/suggestions', getSuggestions);

// Get dishes for dropdown
upsellRoute.get('/dishes', getDishes);

// Manual trigger for analytics aggregation (testing)
upsellRoute.post('/trigger-analytics', triggerAnalytics);

export default upsellRoute;


