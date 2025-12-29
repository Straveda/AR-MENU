import express from "express";
import { getKdsOrders, updateKdsOrderStatus, loginKds } from "../controllers/kdsorder.controller.js";
import { requireAuth } from "../middlewares/requireAuth.middleware.js";
import { resolveRestaurantFromUser } from "../middlewares/resolveRestaurantFromUser.middleware.js";
import { requireRole } from "../middlewares/requireRole.middleware.js";
import { checkSubscription } from "../middlewares/checkSubscription.middleware.js";
import { enforcePlanFeature } from "../middlewares/enforcePlanFeature.middleware.js";

const kdsOrderRoute = express.Router();

kdsOrderRoute.post("/login", loginKds);
kdsOrderRoute.get( "/getkdsorders", requireAuth, resolveRestaurantFromUser, requireRole("KDS"), getKdsOrders );
kdsOrderRoute.patch( "/:orderCode/status", requireAuth, resolveRestaurantFromUser, checkSubscription, requireRole("KDS"), enforcePlanFeature("kdsAccess"), updateKdsOrderStatus );

export default kdsOrderRoute;
