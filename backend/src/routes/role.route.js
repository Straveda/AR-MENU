import express from 'express';
import { requireAuth } from '../middlewares/requireAuth.middleware.js';
import { resolveRestaurantFromUser } from '../middlewares/resolveRestaurantFromUser.middleware.js';
import { requirePermission } from '../middlewares/requirePermission.middleware.js';
import { PERMISSIONS } from '../constants/permissions.js';
import {
  createRole,
  getRoles,
  updateRole,
  deleteRole
} from '../controllers/role.controller.js';

const router = express.Router();

// All routes require Auth + Restaurant Context
router.use(requireAuth);
router.use(resolveRestaurantFromUser);

router.get(
    '/', 
    requirePermission(PERMISSIONS.MANAGE_ROLES),
    getRoles
);

router.post(
    '/', 
    requirePermission(PERMISSIONS.MANAGE_ROLES),
    createRole
);

router.put(
    '/:id', 
    requirePermission(PERMISSIONS.MANAGE_ROLES),
    updateRole
);

router.delete(
    '/:id', 
    requirePermission(PERMISSIONS.MANAGE_ROLES),
    deleteRole
);

export default router;
