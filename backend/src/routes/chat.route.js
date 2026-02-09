import express from 'express';
import { handleChatMessage } from '../controllers/chat.controller.js';
import { isLoggedIn } from '../middlewares/auth.middleware.js';
import { resolveRestaurantFromUser } from '../middlewares/resolveRestaurantFromUser.middleware.js';

const router = express.Router();

// Apply auth and restaurant resolution middleware
router.post('/message', isLoggedIn, resolveRestaurantFromUser, handleChatMessage);

export default router;
