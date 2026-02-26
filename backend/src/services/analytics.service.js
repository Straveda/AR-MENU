import { Order } from '../models/order.models.js';
import { Ingredient } from '../models/ingredient.model.js';
import Expense from '../models/expense.model.js';
import { Dish } from '../models/dish.models.js';
import { DishStats } from '../models/dishStats.model.js';
import { DishPairStats } from '../models/dishPairStats.model.js';
import { Restaurant } from '../models/restaurant.models.js';

import mongoose from 'mongoose';

export const getDashboardAnalytics = async (restaurantId) => {
  const rId = new mongoose.Types.ObjectId(restaurantId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  // Calculate Start of Current Week (Monday)
  const day = today.getDay();
  const diff = (day === 0) ? 6 : day - 1;
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - diff);
  startOfWeek.setHours(0, 0, 0, 0);

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
        createdAt: { $gte: startOfWeek },
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

  // Key Metrics for Current Period
  const totalOrders = await Order.countDocuments({
    restaurantId: rId,
    createdAt: { $gte: startDate },
  });

  const completedOrders = await Order.countDocuments({
    restaurantId: rId,
    createdAt: { $gte: startDate },
    orderStatus: 'Completed',
  });

  const totalRevenueData = await Order.aggregate([
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

  const totalRevenue = totalRevenueData[0]?.total || 0;
  const avgOrderValue = totalRevenue && completedOrders > 0
    ? Math.round(totalRevenue / completedOrders)
    : 0;

  // Calculate Previous Period for Comparison
  const duration = now.getTime() - startDate.getTime();
  const prevStartDate = new Date(startDate.getTime() - duration);
  const prevEndDate = startDate;

  const prevTotalOrders = await Order.countDocuments({
    restaurantId: rId,
    createdAt: { $gte: prevStartDate, $lt: prevEndDate },
  });

  const prevCompletedOrders = await Order.countDocuments({
    restaurantId: rId,
    createdAt: { $gte: prevStartDate, $lt: prevEndDate },
    orderStatus: 'Completed',
  });

  const prevTotalRevenueData = await Order.aggregate([
    {
      $match: {
        restaurantId: rId,
        createdAt: { $gte: prevStartDate, $lt: prevEndDate },
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

  const prevTotalRevenue = prevTotalRevenueData[0]?.total || 0;
  const prevAvgOrderValue = prevTotalRevenue && prevCompletedOrders > 0
    ? Math.round(prevTotalRevenue / prevCompletedOrders)
    : 0;

  // Helper to calculate percentage growth
  const getGrowth = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return (((current - previous) / previous) * 100).toFixed(1);
  };

  const metrics = {
    totalRevenue,
    totalOrders,
    completedOrders,
    avgOrderValue,
    growth: {
      revenue: getGrowth(totalRevenue, prevTotalRevenue),
      orders: getGrowth(totalOrders, prevTotalOrders),
      avgOrderValue: getGrowth(avgOrderValue, prevAvgOrderValue),
      completedOrders: getGrowth(completedOrders, prevCompletedOrders),
    }
  };

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
    metrics,
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

// ============================================================================
// UPSELL ANALYTICS AGGREGATION
// ============================================================================

/**
 * Aggregate dish statistics from order history for a specific restaurant
 * @param {ObjectId} restaurantId - The restaurant ID to aggregate stats for
 */
export const aggregateDishStats = async (restaurantId) => {
  try {
    console.log(`[Analytics] Aggregating dish stats for restaurant: ${restaurantId}`);

    // Get all completed orders for this restaurant
    const orders = await Order.find({
      restaurantId,
      orderStatus: 'Completed'
    });

    if (orders.length === 0) {
      console.log(`[Analytics] No completed orders found for restaurant ${restaurantId}`);
      return;
    }

    // Calculate cutoff date for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Aggregate stats per dish
    const dishStatsMap = new Map();

    for (const order of orders) {
      const isRecent = order.createdAt >= thirtyDaysAgo;

      for (const item of order.orderItems) {
        if (!item.dishId) continue;

        const dishIdStr = item.dishId.toString();

        if (!dishStatsMap.has(dishIdStr)) {
          dishStatsMap.set(dishIdStr, {
            dishId: item.dishId,
            totalOrders: 0,
            totalRevenue: 0,
            last30DaysOrders: 0,
          });
        }

        const stats = dishStatsMap.get(dishIdStr);
        stats.totalOrders += item.quantity;
        stats.totalRevenue += item.lineTotal;

        if (isRecent) {
          stats.last30DaysOrders += item.quantity;
        }
      }
    }

    // Upsert stats into database
    const bulkOps = [];
    for (const [dishIdStr, stats] of dishStatsMap) {
      const avgOrderValue = stats.totalOrders > 0
        ? Math.round(stats.totalRevenue / stats.totalOrders)
        : 0;

      bulkOps.push({
        updateOne: {
          filter: { restaurantId, dishId: stats.dishId },
          update: {
            $set: {
              totalOrders: stats.totalOrders,
              totalRevenue: stats.totalRevenue,
              avgOrderValue,
              last30DaysOrders: stats.last30DaysOrders,
              lastUpdated: new Date(),
            }
          },
          upsert: true,
        }
      });
    }

    if (bulkOps.length > 0) {
      await DishStats.bulkWrite(bulkOps);
      console.log(`[Analytics] Updated stats for ${bulkOps.length} dishes`);
    }

  } catch (error) {
    console.error(`[Analytics] Error aggregating dish stats:`, error);
    throw error;
  }
};

/**
 * Aggregate dish pairing statistics from order history
 * @param {ObjectId} restaurantId - The restaurant ID to aggregate pair stats for
 */
export const aggregateDishPairStats = async (restaurantId) => {
  try {
    console.log(`[Analytics] Aggregating dish pair stats for restaurant: ${restaurantId}`);

    // Get all completed orders with 2+ items
    const orders = await Order.find({
      restaurantId,
      orderStatus: 'Completed',
      'orderItems.1': { $exists: true } // Has at least 2 items
    });

    if (orders.length === 0) {
      console.log(`[Analytics] No multi-item orders found for restaurant ${restaurantId}`);
      return;
    }

    // Count pairs and track main dish totals
    const pairCountMap = new Map();
    const mainDishTotals = new Map();

    for (const order of orders) {
      const dishIds = order.orderItems
        .filter(item => item.dishId)
        .map(item => item.dishId.toString());

      // Create pairs (mainDish, pairedDish)
      for (let i = 0; i < dishIds.length; i++) {
        const mainDishId = dishIds[i];

        // Track total orders for main dish
        mainDishTotals.set(
          mainDishId,
          (mainDishTotals.get(mainDishId) || 0) + 1
        );

        // Create pairs with other dishes in the same order
        for (let j = 0; j < dishIds.length; j++) {
          if (i === j) continue; // Skip pairing with itself

          const pairedDishId = dishIds[j];
          const pairKey = `${mainDishId}|${pairedDishId}`;

          pairCountMap.set(
            pairKey,
            (pairCountMap.get(pairKey) || 0) + 1
          );
        }
      }
    }

    // Calculate percentages and prepare bulk operations
    const bulkOps = [];
    for (const [pairKey, pairCount] of pairCountMap) {
      const [mainDishIdStr, pairedDishIdStr] = pairKey.split('|');
      const mainDishTotal = mainDishTotals.get(mainDishIdStr) || 1;
      const pairPercentage = Math.round((pairCount / mainDishTotal) * 100);

      bulkOps.push({
        updateOne: {
          filter: {
            restaurantId,
            mainDishId: mainDishIdStr,
            pairedDishId: pairedDishIdStr,
          },
          update: {
            $set: {
              pairCount,
              pairPercentage,
              lastUpdated: new Date(),
            }
          },
          upsert: true,
        }
      });
    }

    if (bulkOps.length > 0) {
      await DishPairStats.bulkWrite(bulkOps);
      console.log(`[Analytics] Updated ${bulkOps.length} dish pair stats`);
    }

  } catch (error) {
    console.error(`[Analytics] Error aggregating dish pair stats:`, error);
    throw error;
  }
};

/**
 * Run nightly aggregation for all active restaurants
 */
export const runNightlyAggregation = async () => {
  try {
    console.log('[Analytics] Starting nightly aggregation...');
    const startTime = Date.now();

    // Get all active restaurants
    const restaurants = await Restaurant.find({
      subscriptionStatus: { $in: ['active', 'trialing'] }
    });

    console.log(`[Analytics] Found ${restaurants.length} active restaurants`);

    let successCount = 0;
    let errorCount = 0;

    for (const restaurant of restaurants) {
      try {
        await aggregateDishStats(restaurant._id);
        await aggregateDishPairStats(restaurant._id);
        successCount++;
      } catch (error) {
        console.error(`[Analytics] Failed for restaurant ${restaurant._id}:`, error.message);
        errorCount++;
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[Analytics] Nightly aggregation completed in ${duration}s`);
    console.log(`[Analytics] Success: ${successCount}, Errors: ${errorCount}`);

  } catch (error) {
    console.error('[Analytics] Fatal error in nightly aggregation:', error);
    throw error;
  }
};

