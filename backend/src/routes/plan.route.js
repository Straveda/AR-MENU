import express from "express";
import { requireAuth } from "../middlewares/requireAuth.middleware.js";
import { requireRole } from "../middlewares/requireRole.middleware.js";

import {
  createPlan,
  getAllPlans,
  updatePlan,
} from "../controllers/plan.controller.js";

const planRouter = express.Router();

planRouter.post(
  "/create-plan",
  requireAuth,
  requireRole("SUPER_ADMIN"),
  createPlan
);

planRouter.get(
  "/get-plans",
  requireAuth,
  requireRole("SUPER_ADMIN"),
  getAllPlans
);

planRouter.put(
  "/update/:planId",
  requireAuth,
  requireRole("SUPER_ADMIN"),
  updatePlan
);

export default planRouter;
