import express from 'express';
import { loginUser } from '../controllers/userAuth.controller.js';
import { requireAuth } from '../middlewares/requireAuth.middleware.js';

const userAuthRouter = express.Router();

userAuthRouter.post('/login', loginUser);
userAuthRouter.get('/me', requireAuth, async (req, res) => {
  const user = await req.user.populate('restaurantId', 'name slug');
  res.json(user);
});

export default userAuthRouter;
