import express from "express";
import { requireAuth } from "../middlewares/requireAuth.middleware.js";
import { resolveRestaurant } from "../middlewares/resolveRestaurant.middleware.js";
import { requireRole } from "../middlewares/requireRole.middleware.js";
import { checkSubscription } from "../middlewares/checkSubscription.middleware.js";

import {
  createOrder,
  trackOrder,
} from "../controllers/order.controller.js";

const orderRoute = express.Router();

orderRoute.post(
  "/r/:restaurantSlug/create",
  resolveRestaurant,
  checkSubscription,
  createOrder
);

orderRoute.get(
  "/r/:restaurantSlug/track/:orderCode",
  resolveRestaurant,
  trackOrder
);

export default orderRoute;
