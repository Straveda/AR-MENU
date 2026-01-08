import express from 'express';
import { requireAuth } from '../middlewares/requireAuth.middleware.js';
import { requireRole } from '../middlewares/requireRole.middleware.js';
import { resolveRestaurantFromUser } from '../middlewares/resolveRestaurantFromUser.middleware.js';
import {
  createIngredient,
  getIngredients,
  updateIngredient,
  adjustStock,
  getStockMovements,
} from '../controllers/inventory.controller.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('RESTAURANT_ADMIN'));
router.use(resolveRestaurantFromUser);

router.post('/ingredients', createIngredient);
router.get('/ingredients', getIngredients);
router.patch('/ingredients/:id', updateIngredient);

router.post('/ingredients/:id/adjust-stock', adjustStock);

router.get('/stock-movements', getStockMovements);

export default router;
