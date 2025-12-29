import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
    required: false, // Optional for platform-level actions
    index: true // Key for querying per restaurant
  },
  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  actorEmail: {
    type: String, // Snapshot in case user is deleted
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
        'ROLE_CREATED', 'ROLE_UPDATED', 'ROLE_DELETED',
        'STAFF_CREATED', 'STAFF_UPDATED', 'STAFF_DELETED', 'STAFF_STATUS_CHANGED',
        'USER_CREATED', 'USER_UPDATED', 'USER_DELETED', 'USER_STATUS_TOGGLED',
        'RESTAURANT_CREATED', 'RESTAURANT_UPDATED', 'RESTAURANT_DELETED', 'RESTAURANT_STATUS_CHANGED',
        'PLAN_ASSIGNED', 'PLAN_CHANGED', 'SUBSCRIPTION_EXTENDED',
        'DISH_CREATED', 'DISH_UPDATED', 'DISH_DELETED',
        'LOGIN_SUCCESS', 'LOGIN_FAILED'
    ]
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId, // ID of the role, user, or dish being modified
    required: false
  },
  targetModel: {
    type: String, // 'Role', 'User', 'Dish'
    required: false
  },
  changes: {
    type: Map, // For storing before/after or just the diff
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    required: false
  },
  userAgent: {
    type: String,
    required: false
  }
}, { timestamps: true });

// TTL Index: Retention Strategy (e.g., 90 days)
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
