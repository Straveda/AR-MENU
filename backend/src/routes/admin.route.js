import express from "express";
import { requireAuth } from "../middlewares/requireAuth.middleware.js";
import { requireRole } from "../middlewares/requireRole.middleware.js";
import { resolveRestaurantFromUser } from "../middlewares/resolveRestaurantFromUser.middleware.js";
import { checkSubscription } from "../middlewares/checkSubscription.middleware.js";
import { enforcePlanFeature } from "../middlewares/enforcePlanFeature.middleware.js";

import { createStaffUser } from "../controllers/platform.controller.js";

const adminRouter = express.Router();

adminRouter.post(
  "/create-staff",
  requireAuth,
  requireRole("RESTAURANT_ADMIN"),
  resolveRestaurantFromUser,
  checkSubscription,
  enforcePlanFeature("maxStaff"),
  createStaffUser
);

export default adminRouter;
