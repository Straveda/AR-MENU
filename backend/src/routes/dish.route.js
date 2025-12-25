import express from "express";
import { requireAuth } from "../middlewares/requireAuth.middleware.js";
import { resolveRestaurantFromUser } from "../middlewares/resolveRestaurantFromUser.middleware.js";
import { resolveRestaurant } from "../middlewares/resolveRestaurant.middleware.js";
import { requireRole } from "../middlewares/requireRole.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";
import { checkSubscription } from "../middlewares/checkSubscription.middleware.js";
import { enforcePlanFeature } from "../middlewares/enforcePlanFeature.middleware.js";

import {
  addDish,
  getDishes,
  getDishById,
  updateDish,
  deleteDish,
  peopleAlsoOrdered,
  getModelStatus,
  generateModel,
  retryModelGeneration,
  proxyModel,
} from "../controllers/dish.controller.js";

const dishRoute = express.Router();

dishRoute.get(
  "/r/:restaurantSlug/dishes",
  resolveRestaurant,
  getDishes
);

dishRoute.get(
  "/r/:restaurantSlug/dishes/:id",
  resolveRestaurant,
  getDishById
);

dishRoute.get(
  "/r/:restaurantSlug/dishes/:dishId/also-ordered",
  resolveRestaurant,
  peopleAlsoOrdered
);

dishRoute.get(
  "/r/:restaurantSlug/dishes/:id/model-status",
  resolveRestaurant,
  getModelStatus
);

dishRoute.get(
  "/r/:restaurantSlug/dishes/proxy-model/:id/:format",
  resolveRestaurant,
  proxyModel
);

dishRoute.post(
  "/add",
  requireAuth,
  resolveRestaurantFromUser,
  checkSubscription,
  requireRole("RESTAURANT_ADMIN"),
  enforcePlanFeature("maxDishes"),
  upload.single("image"),
  addDish
);

dishRoute.put(
  "/updatedish/:id",
  requireAuth,
  resolveRestaurantFromUser,
  checkSubscription,
  requireRole("RESTAURANT_ADMIN"),
  updateDish
);

dishRoute.delete(
  "/deletedish/:id",
  requireAuth,
  resolveRestaurantFromUser,
  checkSubscription,
  requireRole("RESTAURANT_ADMIN"),
  deleteDish
);

dishRoute.post(
  "/:id/generate-model",
  requireAuth,
  resolveRestaurantFromUser,
  checkSubscription,
  requireRole("RESTAURANT_ADMIN"),
  enforcePlanFeature("aiModels"),
  generateModel
);

dishRoute.post(
  "/:id/retry-model",
  requireAuth,
  resolveRestaurantFromUser,
  checkSubscription,
  requireRole("RESTAURANT_ADMIN"),
  enforcePlanFeature("aiModels"),
  retryModelGeneration
);

export default dishRoute;
