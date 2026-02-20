import * as reportsService from '../services/reports.service.js';
import * as reconciliationService from '../services/reconciliation.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

/**
 * Get Reports Summary (Dashboard Cards)
 * GET /api/v1/reports/summary
 */
export const getReportsSummary = asyncHandler(async (req, res) => {
    const restaurantId = req.restaurant._id;
    const today = new Date();

    // Daily sales
    const dailySales = await reportsService.getDailySalesReport(restaurantId, today);

    // GST summary (current month)
    const gstReport = await reportsService.getMonthlyGSTReport(
        restaurantId,
        today.getMonth() + 1,
        today.getFullYear()
    );

    // Aggregator mismatch count
    const aggregatorStats = await reportsService.getAggregatorMismatch(restaurantId, {
        status: 'PENDING',
    });

    // Payment reconciliation count
    const paymentStats = await reportsService.getPaymentReconciliation(restaurantId, {
        status: 'PENDING',
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                dailySales: dailySales.summary,
                gstSummary: {
                    totalGST: gstReport.totalGST,
                    cgst: gstReport.cgst,
                    sgst: gstReport.sgst,
                    month: gstReport.month,
                    year: gstReport.year,
                },
                aggregatorMismatch: {
                    pendingCount: aggregatorStats.stats.pending,
                    totalDifference: aggregatorStats.stats.totalDifference,
                },
                paymentReconciliation: {
                    pendingCount: paymentStats.stats.pending,
                    totalDifference: paymentStats.stats.totalDifference,
                },
            },
            'Reports summary fetched successfully'
        )
    );
});

/**
 * Get Daily Sales Report
 * GET /api/v1/reports/daily-sales?date=2026-02-11
 */
export const getDailySales = asyncHandler(async (req, res) => {
    const restaurantId = req.restaurant._id;
    const { date } = req.query;

    const report = await reportsService.getDailySalesReport(
        restaurantId,
        date ? new Date(date) : new Date()
    );

    return res
        .status(200)
        .json(new ApiResponse(200, report, 'Daily sales report fetched successfully'));
});

/**
 * Get Monthly GST Report
 * GET /api/v1/reports/monthly-gst?month=2&year=2026
 */
export const getMonthlyGST = asyncHandler(async (req, res) => {
    const restaurantId = req.restaurant._id;
    const { month, year } = req.query;

    const currentDate = new Date();
    const reportMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const reportYear = year ? parseInt(year) : currentDate.getFullYear();

    const report = await reportsService.getMonthlyGSTReport(restaurantId, reportMonth, reportYear);

    return res.status(200).json(new ApiResponse(200, report, 'GST report fetched successfully'));
});

/**
 * Get Aggregator Mismatches
 * GET /api/v1/reports/aggregator-mismatch?source=SWIGGY&status=PENDING
 */
export const getAggregatorMismatches = asyncHandler(async (req, res) => {
    const restaurantId = req.restaurant._id;
    const filters = req.query;

    const result = await reportsService.getAggregatorMismatch(restaurantId, filters);

    return res
        .status(200)
        .json(new ApiResponse(200, result, 'Aggregator mismatches fetched successfully'));
});

/**
 * Get Payment Reconciliation
 * GET /api/v1/reports/payment-reconciliation?status=PENDING
 */
export const getPaymentReconciliation = asyncHandler(async (req, res) => {
    const restaurantId = req.restaurant._id;
    const filters = req.query;

    const result = await reportsService.getPaymentReconciliation(restaurantId, filters);

    return res
        .status(200)
        .json(new ApiResponse(200, result, 'Payment reconciliation fetched successfully'));
});

/**
 * Export Report
 * GET /api/v1/reports/export?type=daily-sales&date=2026-02-11
 */
export const exportReport = asyncHandler(async (req, res) => {
    const { type, ...filters } = req.query;
    const restaurantId = req.restaurant._id;

    let data;
    switch (type) {
        case 'daily-sales':
            data = await reportsService.getDailySalesReport(
                restaurantId,
                filters.date ? new Date(filters.date) : new Date()
            );
            break;
        case 'monthly-gst':
            data = await reportsService.getMonthlyGSTReport(
                restaurantId,
                parseInt(filters.month),
                parseInt(filters.year)
            );
            break;
        case 'aggregator-mismatch':
            data = await reportsService.getAggregatorMismatch(restaurantId, filters);
            break;
        case 'payment-reconciliation':
            data = await reportsService.getPaymentReconciliation(restaurantId, filters);
            break;
        default:
            return res.status(400).json(new ApiResponse(400, null, 'Invalid report type'));
    }

    const csv = reportsService.exportReportToCSV(data, type);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-${Date.now()}.csv"`);
    return res.send(csv);
});

/**
 * Resolve Aggregator Mismatch
 * POST /api/v1/reports/aggregator-mismatch/:mismatchId/resolve
 */
export const resolveAggregatorMismatch = asyncHandler(async (req, res) => {
    const { mismatchId } = req.params;
    const { notes } = req.body;
    const userId = req.user._id;

    const result = await reconciliationService.resolveAggregatorMismatch(mismatchId, userId, notes);

    return res.status(200).json(new ApiResponse(200, result, 'Mismatch resolved successfully'));
});

/**
 * Sync Aggregator Orders
 * POST /api/v1/reports/aggregator-orders/sync
 */
export const syncAggregatorOrders = asyncHandler(async (req, res) => {
    const restaurantId = req.restaurant._id;
    const { source, orders } = req.body;

    if (!source || !orders || !Array.isArray(orders)) {
        return res
            .status(400)
            .json(new ApiResponse(400, null, 'Source and orders array are required'));
    }

    const result = await reconciliationService.syncAggregatorOrders(restaurantId, source, orders);

    return res
        .status(200)
        .json(new ApiResponse(200, result, `Synced ${result.length} aggregator orders successfully`));
});

/**
 * Sync Razorpay Settlements
 * POST /api/v1/reports/razorpay-settlements/sync
 */
export const syncRazorpaySettlements = asyncHandler(async (req, res) => {
    const restaurantId = req.restaurant._id;
    const { settlements } = req.body;

    if (!settlements || !Array.isArray(settlements)) {
        return res.status(400).json(new ApiResponse(400, null, 'Settlements array is required'));
    }

    const result = await reconciliationService.syncRazorpaySettlements(restaurantId, settlements);

    return res
        .status(200)
        .json(new ApiResponse(200, result, `Synced ${result.length} settlements successfully`));
});

/**
 * Auto-match Aggregator Orders
 * POST /api/v1/reports/aggregator-orders/auto-match
 */
export const autoMatchAggregatorOrders = asyncHandler(async (req, res) => {
    const restaurantId = req.restaurant._id;
    const { source } = req.body;

    if (!source) {
        return res.status(400).json(new ApiResponse(400, null, 'Source is required'));
    }

    const result = await reconciliationService.autoMatchAggregatorOrders(restaurantId, source);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                result,
                `Auto-matched ${result.matched} orders, ${result.notMatched} not matched`
            )
        );
});
