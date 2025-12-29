import express from "express";
import { requireAuth } from "../middlewares/requireAuth.middleware.js";
import { requirePermission } from "../middlewares/requirePermission.middleware.js";
import { resolveRestaurantFromUser } from "../middlewares/resolveRestaurantFromUser.middleware.js";
import { checkSubscription } from "../middlewares/checkSubscription.middleware.js";
import { enforcePlanFeature } from "../middlewares/enforcePlanFeature.middleware.js";
import { PERMISSIONS } from "../constants/permissions.js";
import { createStaffUser, getStaff, updateStaffUser, toggleStaffStatus, deleteStaff } from "../controllers/platform.controller.js";

const adminRouter = express.Router();

adminRouter.post(
  "/create-staff",
  requireAuth,
  resolveRestaurantFromUser,
  requirePermission(PERMISSIONS.MANAGE_STAFF),
  checkSubscription,
  enforcePlanFeature("maxStaff"),
  createStaffUser
);

adminRouter.get(
  "/get-staff",
  requireAuth,
  resolveRestaurantFromUser,
  requirePermission(PERMISSIONS.MANAGE_STAFF),
  getStaff
);

adminRouter.patch(
  "/update-staff/:userId",
  requireAuth,
  resolveRestaurantFromUser,
  requirePermission(PERMISSIONS.MANAGE_STAFF),
  updateStaffUser
);

adminRouter.patch(
  "/toggle-staff-status/:userId",
  requireAuth,
  resolveRestaurantFromUser,
  requirePermission(PERMISSIONS.MANAGE_STAFF),
  checkSubscription,
  toggleStaffStatus
);

adminRouter.delete(
  "/delete-staff/:userId",
  requireAuth,
  resolveRestaurantFromUser,
  requirePermission(PERMISSIONS.MANAGE_STAFF),
  checkSubscription,
  deleteStaff
);

export default adminRouter;
