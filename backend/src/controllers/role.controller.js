import { Role } from '../models/role.models.js';
import { User } from '../models/user.models.js';
import { PERMISSIONS } from '../constants/permissions.js';
import { logAudit } from '../utils/logger.js';

export const createRole = async (req, res) => {
  try {
    const { name, permissions, description } = req.body;
    const restaurantId = req.restaurant._id;

    // Validation
    if (!name || !permissions) {
      return res.status(400).json({ success: false, message: 'Name and permissions are required' });
    }

    // Validate permissions exist
    const validPermissions = Object.values(PERMISSIONS);
    const invalidPerms = permissions.filter(p => !validPermissions.includes(p));
    if (invalidPerms.length > 0) {
      return res.status(400).json({ success: false, message: `Invalid permissions: ${invalidPerms.join(', ')}` });
    }

    const role = await Role.create({
      name,
      permissions,
      description,
      restaurantId
    });

    // Audit Log
    await logAudit({
      req,
      action: 'ROLE_CREATED',
      targetId: role._id,
      targetModel: 'Role',
      changes: { name, permissions, description }
    });

    return res.status(201).json({ success: true, data: role });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Role with this name already exists' });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getRoles = async (req, res) => {
  try {
    const roles = await Role.find({ restaurantId: req.restaurant._id });
    return res.status(200).json({ success: true, data: roles });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, permissions, description } = req.body;
    
    const role = await Role.findOne({ _id: id, restaurantId: req.restaurant._id });
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    if (role.isSystemRole) {
      return res.status(403).json({ success: false, message: 'Cannot modify system roles' });
    }

    // Capture changes for audit
    const changes = {};

    if (name && role.name !== name) {
        changes.oldName = role.name;
        changes.newName = name;
        role.name = name;
    }
    if (description !== undefined && role.description !== description) {
        changes.description = description;
        role.description = description;
    }
    if (permissions) {
       // Validate permissions exist
      const validPermissions = Object.values(PERMISSIONS);
      const invalidPerms = permissions.filter(p => !validPermissions.includes(p));
      if (invalidPerms.length > 0) {
        return res.status(400).json({ success: false, message: `Invalid permissions: ${invalidPerms.join(', ')}` });
      }
      
      // Basic diff
      changes.oldPermissions = role.permissions;
      changes.newPermissions = permissions;
      role.permissions = permissions;
    }

    await role.save();

    await logAudit({
        req,
        action: 'ROLE_UPDATED',
        targetId: role._id,
        targetModel: 'Role',
        changes
    });

    return res.status(200).json({ success: true, data: role });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    const role = await Role.findOne({ _id: id, restaurantId: req.restaurant._id });

    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    if (role.isSystemRole) {
      return res.status(403).json({ success: false, message: 'Cannot delete system roles' });
    }

    // Check usage
    const userCount = await User.countDocuments({ roleId: id });
    if (userCount > 0) {
      return res.status(400).json({ success: false, message: `Cannot delete role assigned to ${userCount} users` });
    }

    const deletedData = { name: role.name, permissions: role.permissions };
    await role.deleteOne();

    await logAudit({
        req,
        action: 'ROLE_DELETED',
        targetId: id,
        targetModel: 'Role',
        changes: deletedData
    });

    return res.status(200).json({ success: true, message: 'Role deleted' });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
