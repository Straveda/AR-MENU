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

export const DEFAULT_ROLES = {
  SUPER_ADMIN: {
    name: 'Super Admin',
    permissions: Object.values(PERMISSIONS)
  },
  RESTAURANT_ADMIN: {
    name: 'Restaurant Admin',
    permissions: [
      PERMISSIONS.CREATE_DISH,
      PERMISSIONS.EDIT_DISH,
      PERMISSIONS.DELETE_DISH,
      PERMISSIONS.VIEW_DISHES,
      PERMISSIONS.VIEW_ORDERS,
      PERMISSIONS.UPDATE_ORDER_STATUS,
      PERMISSIONS.DELETE_ORDER,
      PERMISSIONS.MANAGE_ROLES,
      PERMISSIONS.MANAGE_STAFF,
      PERMISSIONS.VIEW_ANALYTICS,
      PERMISSIONS.VIEW_KDS
    ]
  },
  STAFF: {
    name: 'Staff',
    permissions: [
      PERMISSIONS.VIEW_ORDERS,
      PERMISSIONS.UPDATE_ORDER_STATUS,
      PERMISSIONS.VIEW_DISHES
    ]
  },
  KDS: {
    name: 'KDS',
    permissions: [
      PERMISSIONS.VIEW_KDS,
      PERMISSIONS.VIEW_ORDERS,
      PERMISSIONS.UPDATE_ORDER_STATUS
    ]
  },
  WAITER: {
    name: 'Waiter',
    permissions: [
      PERMISSIONS.VIEW_DISHES,
      PERMISSIONS.VIEW_ORDERS
    ]
  }
};
