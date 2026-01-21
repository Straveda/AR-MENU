import express from 'express';
import {
  loginUser,
  forgotPassword,
  verifyOtp,
  resetPassword,
} from '../controllers/userAuth.controller.js';
import { requireAuth } from '../middlewares/requireAuth.middleware.js';

const userAuthRouter = express.Router();

userAuthRouter.post('/login', loginUser);
userAuthRouter.post('/forgot-password', forgotPassword);
userAuthRouter.post('/verify-otp', verifyOtp);
userAuthRouter.post('/reset-password', resetPassword);

userAuthRouter.get('/me', requireAuth, async (req, res) => {
  const user = await req.user.populate('restaurantId', 'name slug');
  res.json(user);
});

export default userAuthRouter;
