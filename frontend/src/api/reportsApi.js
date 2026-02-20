import axiosClient from './axiosClient';

/**
 * Get Reports Summary (Dashboard Cards)
 */
export const getReportsSummary = () => {
    return axiosClient.get('/reports/summary');
};

/**
 * Get Daily Sales Report
 */
export const getDailySales = (date) => {
    return axiosClient.get('/reports/daily-sales', {
        params: { date },
    });
};

/**
 * Get Monthly GST Report
 */
export const getMonthlyGST = (month, year) => {
    return axiosClient.get('/reports/monthly-gst', {
        params: { month, year },
    });
};

/**
 * Get Aggregator Mismatches
 */
export const getAggregatorMismatches = (filters = {}) => {
    return axiosClient.get('/reports/aggregator-mismatch', {
        params: filters,
    });
};

/**
 * Get Payment Reconciliation
 */
export const getPaymentReconciliation = (filters = {}) => {
    return axiosClient.get('/reports/payment-reconciliation', {
        params: filters,
    });
};

/**
 * Export Report
 */
export const exportReport = async (type, filters = {}) => {
    const response = await axiosClient.get('/reports/export', {
        params: { type, ...filters },
        responseType: 'blob',
    });

    // Trigger download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${type}-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return response;
};

/**
 * Resolve Aggregator Mismatch
 */
export const resolveAggregatorMismatch = (mismatchId, notes) => {
    return axiosClient.post(`/reports/aggregator-mismatch/${mismatchId}/resolve`, {
        notes,
    });
};

/**
 * Sync Aggregator Orders
 */
export const syncAggregatorOrders = (source, orders) => {
    return axiosClient.post('/reports/aggregator-orders/sync', {
        source,
        orders,
    });
};

/**
 * Auto-match Aggregator Orders
 */
export const autoMatchAggregatorOrders = (source) => {
    return axiosClient.post('/reports/aggregator-orders/auto-match', {
        source,
    });
};

/**
 * Sync Razorpay Settlements
 */
export const syncRazorpaySettlements = (settlements) => {
    return axiosClient.post('/reports/razorpay-settlements/sync', {
        settlements,
    });
};
