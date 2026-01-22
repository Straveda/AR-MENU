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

  const operationsSnapshot = await Order.aggregate([
    { $match: { restaurantId: rId, createdAt: { $gte: today } } },
    {
      $group: {
        _id: null,
        completedToday: { $sum: { $cond: [{ $eq: ['$orderStatus', 'Completed'] }, 1, 0] } },
        cancelledToday: { $sum: { $cond: [{ $eq: ['$orderStatus', 'Cancelled'] }, 1, 0] } },
        inProgress: {
          $sum: {
            $cond: [{ $in: ['$orderStatus', ['Pending', 'Preparing', 'Ready']] }, 1, 0],
          },
        },
      },
    },
  ]);

  const activeOrdersCount = await Order.countDocuments({
    restaurantId,
    orderStatus: { $in: ['Pending', 'Preparing', 'Ready'] },
  });

  const ops = operationsSnapshot[0] || { completedToday: 0, cancelledToday: 0 };

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
    },
    operations: {
      inProgress: activeOrdersCount,
      completedToday: ops.completedToday,
      cancelledToday: ops.cancelledToday,
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
      topSelling: topDish?.name || 'N/A',
      leastSelling: leastDish?.name || 'N/A',
      arReadyCount: ar.arReady,
      nonArCount: ar.total - ar.arReady,
    },
  };
};
