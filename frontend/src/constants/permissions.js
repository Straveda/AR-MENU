export const PERMISSIONS = {
  // Menu Management
  CREATE_DISH: 'dish:create',
  EDIT_DISH: 'dish:edit',
  DELETE_DISH: 'dish:delete',
  VIEW_DISHES: 'dish:view',

  // Order Management
  VIEW_ORDERS: 'order:view',
  UPDATE_ORDER_STATUS: 'order:update_status',
  DELETE_ORDER: 'order:delete',

  // Staff/Role Management
  MANAGE_ROLES: 'role:manage',
  MANAGE_STAFF: 'staff:manage',

  // System/Analytics
  VIEW_ANALYTICS: 'analytics:view',
  VIEW_KDS: 'kds:view',
  
  // Platform (Super Admin)
  MANAGE_RESTAURANTS: 'platform:manage_restaurants',
  MANAGE_PLATFORM: 'platform:manage'
};

export const PERMISSION_GROUPS = {
    "Menu Management": [PERMISSIONS.CREATE_DISH, PERMISSIONS.EDIT_DISH, PERMISSIONS.DELETE_DISH, PERMISSIONS.VIEW_DISHES],
    "Order Management": [PERMISSIONS.VIEW_ORDERS, PERMISSIONS.UPDATE_ORDER_STATUS, PERMISSIONS.DELETE_ORDER],
    "Staff & Roles": [PERMISSIONS.MANAGE_ROLES, PERMISSIONS.MANAGE_STAFF],
    "Analytics & System": [PERMISSIONS.VIEW_ANALYTICS, PERMISSIONS.VIEW_KDS]
};

// Helper workaround since I can't reference PERMISSIONS inside inline object definition effectively without extra steps
// Redefining groups using string values is safer for this copy-paste
export const PERMISSION_GROUPS_UI = {
    "Menu Management": ['dish:create', 'dish:edit', 'dish:delete', 'dish:view'],
    "Order Management": ['order:view', 'order:update_status', 'order:delete'],
    "Staff & Roles": ['role:manage', 'staff:manage'],
    "Analytics & System": ['analytics:view', 'kds:view']
};
