import express from "express";
import { loginUser } from "../controllers/userAuth.controller.js";
import { requireAuth } from "../middlewares/requireAuth.middleware.js";

const userAuthRouter = express.Router();

userAuthRouter.post("/login", loginUser);
userAuthRouter.get("/me", requireAuth, (req, res) => {
    res.json(req.user);
});

export default userAuthRouter;