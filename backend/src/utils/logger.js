import { AuditLog } from '../models/auditLog.model.js';

export const logAudit = async ({ req, action, targetId, targetModel, changes = {} }) => {
  try {
    if (!req.user) {
      console.warn('Audit Log Skipped: Missing user context', { action });
      return;
    }

    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    await AuditLog.create({
      restaurantId: req.restaurant?._id || null,
      actorId: req.user._id,
      actorEmail: req.user.email,
      action,
      targetId,
      targetModel,
      changes,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
};
