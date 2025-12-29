import { Role } from "../models/role.models.js";

export const requirePermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      // Note: isSystemRole check here was empty/incomplete. Removed for clarity.
      
      // 1. Super Admin Bypass
      if (req.user.role === "SUPER_ADMIN") {
        return next();
      }
      
      let userPermissions = [];

      if (req.user.roleId) {
        const role = await Role.findById(req.user.roleId).lean();
        
        if (!role) {
            console.log("RBAC: Role not found for ID:", req.user.roleId);
            return res.status(403).json({ success: false, message: "Role not found" });
        }

        // Context Security Check: Ensure role belongs to the same restaurant
        if (role.restaurantId && req.restaurant && role.restaurantId.toString() != req.restaurant._id.toString()) {
             console.log(`RBAC Mismatch: Role RestID ${role.restaurantId} vs User RestID ${req.restaurant._id}`);
             return res.status(403).json({ success: false, message: "Security Warning: Role Scope Mismatch" });
        }

        userPermissions = role.permissions;

      } else if (req.user.role === "RESTAURANT_ADMIN") {
         // Legacy Fallback: Give all permissions to legacy RESTAURANT_ADMIN
         console.log("RBAC: Falling back to legacy RESTAURANT_ADMIN for", req.user.email);
         return next();
      } else {
         console.log("RBAC: No roleId on user", req.user.email);
         return res.status(403).json({ success: false, message: "Access Denied: User has no assigned Role. Please contact admin." });
      }

      // 3. Check Permission
      if (!userPermissions.includes(requiredPermission)) {
        console.log(`RBAC Failed for ${req.user.email}. Required: ${requiredPermission}. Has:`, userPermissions);
        return res.status(403).json({
          success: false,
          message: `Access Forbidden: Missing permission '${requiredPermission}'`
        });
      }

      next();

    } catch (error) {
      console.error("RBAC Error:", error);
      return res.status(500).json({ success: false, message: "Internal Authorization Error" });
    }
  };
};
