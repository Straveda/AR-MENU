import { Order } from '../models/order.models.js';
import AggregatorOrder from '../models/aggregatorOrder.model.js';
import RazorpaySettlement from '../models/razorpaySettlement.model.js';
import GSTReport from '../models/gstReport.model.js';
import mongoose from 'mongoose';

/**
 * Get Daily Sales Report
 * @param {ObjectId} restaurantId
 * @param {Date} date
 * @returns {Object} Daily sales summary with payment breakdown
 */
export const getDailySalesReport = async (restaurantId, date) => {
    // Assume input date is the local date string (e.g., '2026-02-12')
    // Convert to IST start and end
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    // Adjust for IST (+5:30)
    startOfDay.setMinutes(startOfDay.getMinutes() - 330);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    // Adjust for IST (+5:30)
    endOfDay.setMinutes(endOfDay.getMinutes() - 330);

    const rId = new mongoose.Types.ObjectId(restaurantId);

    // Main sales metrics
    const salesMetrics = await Order.aggregate([
        {
            $match: {
                restaurantId: rId,
                createdAt: { $gte: startOfDay, $lte: endOfDay },
            },
        },
        {
            $group: {
                _id: null,
                totalSales: {
                    $sum: { $cond: [{ $ne: ['$orderStatus', 'Cancelled'] }, '$total', 0] },
                },
                totalOrders: { $sum: 1 },
                completedOrders: {
                    $sum: { $cond: [{ $eq: ['$orderStatus', 'Completed'] }, 1, 0] },
                },
                cancelledOrders: {
                    $sum: { $cond: [{ $eq: ['$orderStatus', 'Cancelled'] }, 1, 0] },
                },
                totalTax: {
                    $sum: {
                        $cond: [
                            { $ne: ['$orderStatus', 'Cancelled'] },
                            { $ifNull: ['$taxAmount', { $subtract: ['$total', { $divide: ['$total', 1.18] }] }] },
                            0
                        ]
                    },
                },
            },
        },
    ]);

    // Payment mode breakdown
    const paymentBreakdown = await Order.aggregate([
        {
            $match: {
                restaurantId: rId,
                createdAt: { $gte: startOfDay, $lte: endOfDay },
                orderStatus: { $ne: 'Cancelled' },
            },
        },
        {
            $group: {
                _id: '$paymentMode',
                count: { $sum: 1 },
                amount: { $sum: '$total' },
            },
        },
    ]);

    const summary = salesMetrics[0] || {
        totalSales: 0,
        totalOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        totalTax: 0,
    };

    return {
        date: date.toISOString().split('T')[0],
        summary: {
            ...summary,
            totalSales: parseFloat(summary.totalSales.toFixed(2)),
            totalTax: parseFloat(summary.totalTax.toFixed(2)),
        },
        paymentBreakdown: paymentBreakdown.map((p) => ({
            paymentMode: p._id,
            count: p.count,
            amount: parseFloat(p.amount.toFixed(2)),
        })),
    };
};

/**
 * Get Monthly GST Report (with caching)
 * @param {ObjectId} restaurantId
 * @param {Number} month (1-12)
 * @param {Number} year
 * @returns {Object} GST report with CGST/SGST breakdown
 */
export const getMonthlyGSTReport = async (restaurantId, month, year) => {
    const rId = new mongoose.Types.ObjectId(restaurantId);

    // Check cache first
    const cached = await GSTReport.findOne({
        restaurantId: rId,
        month,
        year,
        isStale: false,
    });

    if (cached) {
        return cached;
    }

    // Calculate fresh
    const startDate = new Date(year, month - 1, 1);
    startDate.setHours(0, 0, 0, 0);
    startDate.setMinutes(startDate.getMinutes() - 330);

    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    endDate.setMinutes(endDate.getMinutes() - 330);

    const [salesData, cancelledCount, dailyBreakdown] = await Promise.all([
        Order.aggregate([
            {
                $match: {
                    restaurantId: rId,
                    createdAt: { $gte: startDate, $lte: endDate },
                    orderStatus: { $ne: 'Cancelled' },
                },
            },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: '$total' },
                    totalTax: { $sum: { $ifNull: ['$taxAmount', { $subtract: ['$total', { $divide: ['$total', 1.18] }] }] } },
                    orderCount: { $sum: 1 },
                },
            },
        ]),
        Order.countDocuments({
            restaurantId: rId,
            createdAt: { $gte: startDate, $lte: endDate },
            orderStatus: 'Cancelled',
        }),
        Order.aggregate([
            {
                $match: {
                    restaurantId: rId,
                    createdAt: { $gte: startDate, $lte: endDate },
                    orderStatus: { $ne: 'Cancelled' },
                },
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: '+05:30' } },
                    orderCount: { $sum: 1 },
                    totalSales: { $sum: '$total' },
                    totalTax: { $sum: { $ifNull: ['$taxAmount', { $subtract: ['$total', { $divide: ['$total', 1.18] }] }] } },
                },
            },
            { $sort: { _id: 1 } },
            {
                $project: {
                    date: '$_id',
                    orderCount: 1,
                    taxableAmount: {
                        $ifNull: [
                            { $subtract: ['$totalSales', '$totalTax'] },
                            { $divide: ['$totalSales', 1.18] }
                        ]
                    },
                    cgst: { $divide: [{ $ifNull: ['$totalTax', { $subtract: ['$totalSales', { $divide: ['$totalSales', 1.18] }] }] }, 2] },
                    sgst: { $divide: [{ $ifNull: ['$totalTax', { $subtract: ['$totalSales', { $divide: ['$totalSales', 1.18] }] }] }, 2] },
                    totalTax: { $ifNull: ['$totalTax', { $subtract: ['$totalSales', { $divide: ['$totalSales', 1.18] }] }] },
                    _id: 0,
                },
            },
        ]),
    ]);

    const data = salesData[0] || { totalSales: 0, totalTax: 0, orderCount: 0 };

    // GST calculation
    const taxableAmount = parseFloat((data.totalSales - data.totalTax).toFixed(2));
    const cgst = parseFloat((data.totalTax / 2).toFixed(2));
    const sgst = parseFloat((data.totalTax / 2).toFixed(2));
    const totalGST = parseFloat(data.totalTax.toFixed(2));

    // Cache the result
    const gstReport = await GSTReport.findOneAndUpdate(
        { restaurantId: rId, month, year },
        {
            restaurantId: rId,
            month,
            year,
            totalSales: parseFloat(data.totalSales.toFixed(2)),
            taxableAmount,
            cgst,
            sgst,
            totalGST,
            orderCount: data.orderCount,
            cancelledCount,
            dailyBreakdown,
            generatedAt: new Date(),
            isStale: false,
        },
        { upsert: true, new: true }
    );

    return gstReport;
};

/**
 * Get Aggregator Mismatch Report
 * @param {ObjectId} restaurantId
 * @param {Object} filters - { source, status, startDate, endDate }
 * @returns {Object} Mismatches and statistics
 */
export const getAggregatorMismatch = async (restaurantId, filters = {}) => {
    const { source, status, startDate, endDate } = filters;

    const matchQuery = { restaurantId: new mongoose.Types.ObjectId(restaurantId) };
    if (source) matchQuery.source = source;
    if (status) matchQuery.matchStatus = status;
    if (startDate || endDate) {
        matchQuery.orderDate = {};
        if (startDate) matchQuery.orderDate.$gte = new Date(startDate);
        if (endDate) matchQuery.orderDate.$lte = new Date(endDate);
    }

    const mismatches = await AggregatorOrder.find(matchQuery)
        .populate('matchedOrderId')
        .populate('resolvedBy', 'username')
        .sort({ orderDate: -1 })
        .lean();

    // Calculate statistics
    const stats = {
        total: mismatches.length,
        pending: mismatches.filter((m) => m.matchStatus === 'PENDING').length,
        matched: mismatches.filter((m) => m.matchStatus === 'MATCHED').length,
        shortage: mismatches.filter((m) => m.matchStatus === 'SHORTAGE').length,
        excess: mismatches.filter((m) => m.matchStatus === 'EXCESS').length,
        resolved: mismatches.filter((m) => m.matchStatus === 'RESOLVED').length,
        totalDifference: parseFloat(
            mismatches.reduce((sum, m) => sum + (m.difference || 0), 0).toFixed(2)
        ),
    };

    return { mismatches, stats };
};

/**
 * Get Payment Reconciliation Report
 * @param {ObjectId} restaurantId
 * @param {Object} filters - { status, startDate, endDate }
 * @returns {Object} Settlements and statistics
 */
export const getPaymentReconciliation = async (restaurantId, filters = {}) => {
    const { status, startDate, endDate } = filters;

    const matchQuery = { restaurantId: new mongoose.Types.ObjectId(restaurantId) };
    if (status) matchQuery.status = status;
    if (startDate || endDate) {
        matchQuery.settlementDate = {};
        if (startDate) matchQuery.settlementDate.$gte = new Date(startDate);
        if (endDate) matchQuery.settlementDate.$lte = new Date(endDate);
    }

    const settlements = await RazorpaySettlement.find(matchQuery)
        .populate('orderIds')
        .sort({ settlementDate: -1 })
        .lean();

    // Calculate statistics
    const stats = {
        total: settlements.length,
        matched: settlements.filter((s) => s.status === 'MATCHED').length,
        shortage: settlements.filter((s) => s.status === 'SHORTAGE').length,
        excess: settlements.filter((s) => s.status === 'EXCESS').length,
        pending: settlements.filter((s) => s.status === 'PENDING').length,
        totalDifference: parseFloat(
            settlements.reduce((sum, s) => sum + (s.difference || 0), 0).toFixed(2)
        ),
    };

    return { settlements, stats };
};

/**
 * Export Report to CSV
 * @param {Object} data - Report data
 * @param {String} type - Report type
 * @returns {String} CSV string
 */
export const exportReportToCSV = (data, type) => {
    let csv = '';

    switch (type) {
        case 'daily-sales':
            csv = 'Date,Total Sales,Total Orders,Completed,Cancelled,Tax Collected\n';
            csv += `${data.date},${data.summary.totalSales},${data.summary.totalOrders},${data.summary.completedOrders},${data.summary.cancelledOrders},${data.summary.totalTax}\n\n`;
            csv += 'Payment Mode,Count,Amount\n';
            data.paymentBreakdown.forEach((p) => {
                csv += `${p.paymentMode},${p.count},${p.amount}\n`;
            });
            break;

        case 'monthly-gst':
            csv = 'Month,Year,Total Sales,Taxable Amount,CGST,SGST,Total GST,Orders,Cancelled\n';
            csv += `${data.month},${data.year},${data.totalSales},${data.taxableAmount},${data.cgst},${data.sgst},${data.totalGST},${data.orderCount},${data.cancelledCount}\n`;
            break;

        case 'aggregator-mismatch':
            csv = 'Source,Platform Order ID,Order Date,Platform Amount,Matched Amount,Difference,Status\n';
            data.mismatches.forEach((m) => {
                const matchedAmount = m.matchedOrderId?.total || 0;
                csv += `${m.source},${m.platformOrderId},${new Date(m.orderDate).toISOString().split('T')[0]},${m.platformAmount},${matchedAmount},${m.difference},${m.matchStatus}\n`;
            });
            break;

        case 'payment-reconciliation':
            csv = 'Settlement ID,Settlement Date,Received Amount,Expected Amount,Difference,Status\n';
            data.settlements.forEach((s) => {
                csv += `${s.settlementId},${new Date(s.settlementDate).toISOString().split('T')[0]},${s.receivedAmount},${s.expectedAmount},${s.difference},${s.status}\n`;
            });
            break;

        default:
            csv = 'Unsupported report type';
    }

    return csv;
};

/**
 * Invalidate GST cache for a restaurant
 * @param {ObjectId} restaurantId
 */
export const invalidateGSTCache = async (restaurantId) => {
    await GSTReport.updateMany(
        { restaurantId: new mongoose.Types.ObjectId(restaurantId) },
        { isStale: true }
    );
};
