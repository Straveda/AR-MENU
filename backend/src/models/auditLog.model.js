import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: false,
      index: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    actorEmail: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'ROLE_CREATED',
        'ROLE_UPDATED',
        'ROLE_DELETED',
        'STAFF_CREATED',
        'STAFF_UPDATED',
        'STAFF_DELETED',
        'STAFF_STATUS_CHANGED',
        'USER_CREATED',
        'USER_UPDATED',
        'USER_DELETED',
        'USER_STATUS_TOGGLED',
        'RESTAURANT_CREATED',
        'RESTAURANT_UPDATED',
        'RESTAURANT_DELETED',
        'RESTAURANT_STATUS_CHANGED',
        'PLAN_ASSIGNED',
        'PLAN_CHANGED',
        'SUBSCRIPTION_EXTENDED',
        'DISH_CREATED',
        'DISH_UPDATED',
        'DISH_DELETED',
        'LOGIN_SUCCESS',
        'LOGIN_FAILED',
      ],
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
    },
    targetModel: {
      type: String,
      required: false,
    },
    changes: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      required: false,
    },
    userAgent: {
      type: String,
      required: false,
    },
  },
  { timestamps: true },
);

auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
