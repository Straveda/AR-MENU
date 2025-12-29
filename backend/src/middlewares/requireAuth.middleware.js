import { verifyToken } from "../utils/jwt.js";
import { User } from "../models/user.models.js";

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);


    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Populate roleId to ensure it's available for requirePermission middleware
    // We don't fetch the full role here to check permissions generally, 
    // but we ensure the user object has the necessary references.
    req.user = user;
    if (user.roleId) {
      // Optional: We could pre-fetch permission here if we wanted to attach to req.permissions
      // But keeping it lazy in requirePermission is fine too.
    }
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};
