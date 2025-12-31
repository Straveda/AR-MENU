import express from "express";
import { requireAuth } from "../middlewares/requireAuth.middleware.js";
import { requireRole } from "../middlewares/requireRole.middleware.js";
import { resolveRestaurantFromUser } from "../middlewares/resolveRestaurantFromUser.middleware.js";
import { checkSubscription } from "../middlewares/checkSubscription.middleware.js";
import { enforcePlanFeature } from "../middlewares/enforcePlanFeature.middleware.js";
import { createStaffUser, getStaff, updateStaffUser, toggleStaffStatus, deleteStaff } from "../controllers/platform.controller.js";

const adminRouter = express.Router();

adminRouter.post(
  "/create-staff",
  requireAuth,
  resolveRestaurantFromUser,
  requireRole("RESTAURANT_ADMIN", "SUPER_ADMIN", "PLATFORM_ADMIN"),
  checkSubscription,
  enforcePlanFeature("maxStaff"),
  createStaffUser
);

adminRouter.get(
  "/get-staff",
  requireAuth,
  resolveRestaurantFromUser,
  requireRole("RESTAURANT_ADMIN", "SUPER_ADMIN", "PLATFORM_ADMIN"),
  getStaff
);

adminRouter.patch(
  "/update-staff/:userId",
  requireAuth,
  resolveRestaurantFromUser,
  requireRole("RESTAURANT_ADMIN", "SUPER_ADMIN", "PLATFORM_ADMIN"),
  updateStaffUser
);

adminRouter.patch(
  "/toggle-staff-status/:userId",
  requireAuth,
  resolveRestaurantFromUser,
  requireRole("RESTAURANT_ADMIN", "SUPER_ADMIN", "PLATFORM_ADMIN"),
  checkSubscription,
  toggleStaffStatus
);

adminRouter.delete(
  "/delete-staff/:userId",
  requireAuth,
  resolveRestaurantFromUser,
  requireRole("RESTAURANT_ADMIN", "SUPER_ADMIN", "PLATFORM_ADMIN"),
  checkSubscription,
  deleteStaff
);

export default adminRouter;
