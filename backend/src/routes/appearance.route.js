import express from 'express';
import { requireAuth } from '../middlewares/requireAuth.middleware.js';
import { requireRole } from '../middlewares/requireRole.middleware.js';
import { resolveRestaurantFromUser } from '../middlewares/resolveRestaurantFromUser.middleware.js';
import { getTheme, saveTheme, resetTheme, aiGenerateTheme } from '../controllers/appearance.controller.js';

const appearanceRouter = express.Router();

// Public: fetch theme by slug for customer menu
// Also works for authenticated admin (resolveRestaurantFromUser sets req.restaurant)
appearanceRouter.get(
    '/',
    (req, res, next) => {
        // Optional auth: if token present, resolve restaurant; otherwise fall through to slug-based lookup
        if (req.headers.authorization) {
            return requireAuth(req, res, () =>
                resolveRestaurantFromUser(req, res, next)
            );
        }
        next();
    },
    getTheme
);

// Authenticated admin: save theme
appearanceRouter.put(
    '/',
    requireAuth,
    resolveRestaurantFromUser,
    requireRole('RESTAURANT_ADMIN', 'SUPER_ADMIN'),
    saveTheme
);

// Authenticated admin: reset theme to defaults
appearanceRouter.post(
    '/reset',
    requireAuth,
    resolveRestaurantFromUser,
    requireRole('RESTAURANT_ADMIN', 'SUPER_ADMIN'),
    resetTheme
);

// Authenticated admin: AI generate theme
appearanceRouter.post(
    '/ai-generate',
    requireAuth,
    resolveRestaurantFromUser,
    requireRole('RESTAURANT_ADMIN', 'SUPER_ADMIN'),
    aiGenerateTheme
);


export default appearanceRouter;
