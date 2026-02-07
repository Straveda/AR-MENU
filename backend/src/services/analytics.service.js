import { Order } from '../models/order.models.js';
import { Ingredient } from '../models/ingredient.model.js';
import Expense from '../models/expense.model.js';
import { Dish } from '../models/dish.models.js';

import mongoose from 'mongoose';

export const getDashboardAnalytics = async (restaurantId) => {
  const rId = new mongoose.Types.ObjectId(restaurantId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);

  // Sales Metrics
  const salesMetrics = await Order.aggregate([
    { $match: { restaurantId: rId, createdAt: { $gte: startOfMonth } } },
    {
      $group: {
        _id: null,
        totalOrdersMonth: { $sum: 1 },
        totalRevenueMonth: {
          $sum: { $cond: [{ $ne: ['$orderStatus', 'Cancelled'] }, '$total', 0] },
        },
        ordersToday: {
          $sum: { $cond: [{ $gte: ['$createdAt', today] }, 1, 0] },
        },
        revenueToday: {
          $sum: {
            $cond: [
              { $and: [{ $gte: ['$createdAt', today] }, { $ne: ['$orderStatus', 'Cancelled'] }] },
              '$total',
              0,
            ],
          },
        },
        completedOrdersMonth: {
          $sum: { $cond: [{ $eq: ['$orderStatus', 'Completed'] }, 1, 0] },
        },
      },
    },
  ]);

  const metrics = salesMetrics[0] || {
    totalOrdersMonth: 0,
    totalRevenueMonth: 0,
    ordersToday: 0,
    revenueToday: 0,
    completedOrdersMonth: 0,
  };

  const avgOrderValue =
    metrics.completedOrdersMonth > 0
      ? (metrics.totalRevenueMonth / metrics.completedOrdersMonth).toFixed(2)
      : 0;

  // Last 7 days Revenue Trend
  const revenueTrend = await Order.aggregate([
    {
      $match: {
        restaurantId: rId,
        createdAt: { $gte: sevenDaysAgo },
        orderStatus: { $ne: 'Cancelled' },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$total' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Operations Snapshot
  const operationsSnapshot = await Order.aggregate([
    {
      $match: {
        restaurantId: rId,
        $or: [
          { createdAt: { $gte: today } },
          { orderStatus: { $in: ['Pending', 'Preparing', 'Ready'] } },
        ],
      },
    },
    {
      $group: {
        _id: '$orderStatus',
        count: { $sum: 1 },
      },
    },
  ]);

  const activeOrders = await Order.find({
    restaurantId,
    orderStatus: { $in: ['Pending', 'Preparing', 'Ready'] },
  });

  const uniqueTables = [...new Set(activeOrders.map((o) => o.tableNumber).filter(Boolean))];

  const opsMap = operationsSnapshot.reduce((acc, curr) => {
    acc[curr._id] = curr.count;
    return acc;
  }, {});

  // Inventory Metrics
  const inventoryMetrics = await Ingredient.aggregate([
    { $match: { restaurantId: rId } },
    {
      $group: {
        _id: null,
        lowStockCount: {
          $sum: { $cond: [{ $lte: ['$currentStock', '$minStockLevel'] }, 1, 0] },
        },
        deadStockCount: {
          $sum: { $cond: [{ $eq: ['$currentStock', 0] }, 1, 0] },
        },
        totalValue: { $sum: { $multiply: ['$currentStock', '$costPerUnit'] } },
      },
    },
  ]);

  const inv = inventoryMetrics[0] || { lowStockCount: 0, deadStockCount: 0, totalValue: 0 };

  // Expenses Metrics
  const expenseMetrics = await Expense.aggregate([
    { $match: { restaurantId: rId, expenseDate: { $gte: startOfMonth } } },
    {
      $group: {
        _id: '$expenseType',
        totalAmount: { $sum: '$amount' },
      },
    },
    { $sort: { totalAmount: -1 } },
  ]);

  const monthlyExpenses = expenseMetrics.reduce((sum, item) => sum + item.totalAmount, 0);
  const topExpenseCategory = expenseMetrics.length > 0 ? expenseMetrics[0]._id : 'N/A';

  // Menu and Plan info
  const restaurant = await mongoose.model('Restaurant').findById(restaurantId).populate('planId');
  const dishCount = await Dish.countDocuments({ restaurantId });

  const topDish = await Dish.findOne({ restaurantId })
    .sort({ orderCount: -1 })
    .select('name orderCount');
  const leastDish = await Dish.findOne({ restaurantId })
    .sort({ orderCount: 1 })
    .select('name orderCount');

  const arStats = await Dish.aggregate([
    { $match: { restaurantId: rId } },
    {
      $group: {
        _id: null,
        arReady: { $sum: { $cond: [{ $eq: ['$modelStatus', 'completed'] }, 1, 0] } },
        total: { $sum: 1 },
      },
    },
  ]);

  const ar = arStats[0] || { arReady: 0, total: 0 };

  return {
    sales: {
      ordersToday: metrics.ordersToday,
      revenueToday: metrics.revenueToday,
      ordersThisMonth: metrics.totalOrdersMonth,
      revenueThisMonth: metrics.totalRevenueMonth,
      avgOrderValue,
      revenueTrend,
    },
    operations: {
      inProgress: activeOrders.length,
      pending: opsMap['Pending'] || 0,
      preparing: opsMap['Preparing'] || 0,
      ready: opsMap['Ready'] || 0,
      completedToday: opsMap['Completed'] || 0,
      cancelledToday: opsMap['Cancelled'] || 0,
      activeTablesCount: uniqueTables.length,
    },
    inventory: {
      lowStockCount: inv.lowStockCount,
      deadStockCount: inv.deadStockCount,
      totalValue: inv.totalValue.toFixed(2),
    },
    expenses: {
      monthlyTotal: monthlyExpenses.toFixed(2),
      topCategory: topExpenseCategory,
    },
    menu: {
      dishCount,
      topSelling: topDish?.name || 'N/A',
      leastSelling: leastDish?.name || 'N/A',
      arReadyCount: ar.arReady,
      nonArCount: ar.total - ar.arReady,
    },
    plan: {
      name: restaurant?.planId?.name || 'TRIAL',
      maxDishes: restaurant?.planId?.limits?.maxDishes || 50,
      maxStaff: restaurant?.planId?.limits?.maxStaff || 5,
    },
  };
};

export const getDetailedAnalytics = async (restaurantId, timeRange = 'week') => {
  const rId = new mongoose.Types.ObjectId(restaurantId);
  const now = new Date();
  let startDate;
  let groupByFormat;
  let labels = [];

  // Calculate date range and labels
  switch (timeRange) {
    case 'today':
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      groupByFormat = { $hour: '$createdAt' };
      labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
      break;
    case 'week':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      groupByFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
      labels = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        return d.toISOString().split('T')[0];
      });
      break;
    case 'month':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 29);
      startDate.setHours(0, 0, 0, 0);
      groupByFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
      labels = Array.from({ length: 30 }, (_, i) => {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        return d.toISOString().split('T')[0];
      });
      break;
    case 'year':
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 11);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      groupByFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
      labels = Array.from({ length: 12 }, (_, i) => {
        const d = new Date(startDate);
        d.setMonth(d.getMonth() + i);
        return d.toISOString().substring(0, 7);
      });
      break;
    default:
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      groupByFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
      labels = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        return d.toISOString().split('T')[0];
      });
  }

  // Revenue and Orders Trend
  const revenueTrend = await Order.aggregate([
    {
      $match: {
        restaurantId: rId,
        createdAt: { $gte: startDate },
        orderStatus: { $ne: 'Cancelled' },
      },
    },
    {
      $group: {
        _id: groupByFormat,
        revenue: { $sum: '$total' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Top Selling Items
  const topItems = await Order.aggregate([
    {
      $match: {
        restaurantId: rId,
        createdAt: { $gte: startDate },
        orderStatus: { $ne: 'Cancelled' },
      },
    },
    { $unwind: '$orderItems' },
    {
      $group: {
        _id: '$orderItems.dishId',
        name: { $first: '$orderItems.name' },
        count: { $sum: '$orderItems.quantity' },
        revenue: { $sum: '$orderItems.lineTotal' },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);

  // Order Status Distribution
  const orderStatusDist = await Order.aggregate([
    {
      $match: {
        restaurantId: rId,
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: '$orderStatus',
        count: { $sum: 1 },
      },
    },
  ]);

  // Category Performance
  const categoryPerf = await Order.aggregate([
    {
      $match: {
        restaurantId: rId,
        createdAt: { $gte: startDate },
        orderStatus: { $ne: 'Cancelled' },
      },
    },
    { $unwind: '$orderItems' },
    {
      $lookup: {
        from: 'dishes',
        localField: 'orderItems.dishId',
        foreignField: '_id',
        as: 'dishInfo',
      },
    },
    { $unwind: { path: '$dishInfo', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: '$dishInfo.category',
        revenue: { $sum: '$orderItems.lineTotal' },
        count: { $sum: '$orderItems.quantity' },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 5 },
  ]);

  // Hourly Distribution
  const hourlyDist = await Order.aggregate([
    {
      $match: {
        restaurantId: rId,
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: { $hour: '$createdAt' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Key Metrics
  const totalOrders = await Order.countDocuments({
    restaurantId: rId,
    createdAt: { $gte: startDate },
  });

  const completedOrders = await Order.countDocuments({
    restaurantId: rId,
    createdAt: { $gte: startDate },
    orderStatus: 'Completed',
  });

  const totalRevenue = await Order.aggregate([
    {
      $match: {
        restaurantId: rId,
        createdAt: { $gte: startDate },
        orderStatus: { $ne: 'Cancelled' },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$total' },
      },
    },
  ]);

  const avgOrderValue = totalRevenue[0]?.total && completedOrders > 0
    ? Math.round(totalRevenue[0].total / completedOrders)
    : 0;

  // Get inventory and expenses data (reuse from dashboard analytics)
  const inventoryMetrics = await Ingredient.aggregate([
    { $match: { restaurantId: rId } },
    {
      $group: {
        _id: null,
        lowStockCount: {
          $sum: { $cond: [{ $lte: ['$currentStock', '$minStockLevel'] }, 1, 0] },
        },
        deadStockCount: {
          $sum: { $cond: [{ $eq: ['$currentStock', 0] }, 1, 0] },
        },
        totalValue: { $sum: { $multiply: ['$currentStock', '$costPerUnit'] } },
      },
    },
  ]);

  const inv = inventoryMetrics[0] || { lowStockCount: 0, deadStockCount: 0, totalValue: 0 };

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const expenseMetrics = await Expense.aggregate([
    { $match: { restaurantId: rId, expenseDate: { $gte: startOfMonth } } },
    {
      $group: {
        _id: '$expenseType',
        totalAmount: { $sum: '$amount' },
      },
    },
    { $sort: { totalAmount: -1 } },
  ]);

  const monthlyExpenses = expenseMetrics.reduce((sum, item) => sum + item.totalAmount, 0);
  const topExpenseCategory = expenseMetrics.length > 0 ? expenseMetrics[0]._id : 'N/A';

  return {
    timeRange,
    labels,
    metrics: {
      totalRevenue: totalRevenue[0]?.total || 0,
      totalOrders,
      completedOrders,
      avgOrderValue,
    },
    revenueTrend,
    topItems,
    orderStatus: orderStatusDist,
    categoryPerformance: categoryPerf,
    hourlyOrders: hourlyDist,
    inventory: {
      lowStockCount: inv.lowStockCount,
      deadStockCount: inv.deadStockCount,
      totalValue: inv.totalValue,
    },
    expenses: {
      monthlyTotal: monthlyExpenses,
      topCategory: topExpenseCategory,
      byCategory: expenseMetrics,
    },
  };
};

