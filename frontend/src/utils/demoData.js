/**
 * Demo Data Generator for Reports Module
 * Generates realistic sample data for Aggregator Mismatch and Payment Reconciliation
 */

/**
 * Generate demo aggregator orders with mismatches
 */
export const generateDemoAggregatorOrders = () => {
    const today = new Date();
    const orders = [];

    // Generate 15 sample orders with various statuses
    const statuses = ['MATCHED', 'SHORTAGE', 'EXCESS', 'PENDING', 'RESOLVED'];
    const sources = ['SWIGGY', 'ZOMATO'];

    for (let i = 0; i < 15; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - Math.floor(Math.random() * 7)); // Last 7 days

        const source = sources[Math.floor(Math.random() * sources.length)];
        const platformAmount = 200 + Math.random() * 800; // ₹200-1000
        const difference = (Math.random() - 0.5) * 100; // -₹50 to +₹50
        const status = statuses[Math.floor(Math.random() * statuses.length)];

        orders.push({
            _id: `demo_agg_${i}`,
            source,
            platformOrderId: `${source === 'SWIGGY' ? 'SWG' : 'ZOM'}${100000 + i}`,
            platformAmount: parseFloat(platformAmount.toFixed(2)),
            orderDate: date.toISOString(),
            customerName: `Customer ${i + 1}`,
            netAmount: parseFloat((platformAmount - 30).toFixed(2)),
            platformFee: 20,
            deliveryFee: 30,
            taxes: parseFloat((platformAmount * 0.05).toFixed(2)),
            matchStatus: status,
            difference: parseFloat(difference.toFixed(2)),
            matchedOrderId: status !== 'PENDING' ? { orderCode: `ORD${1000 + i}`, total: platformAmount - difference } : null,
            resolvedAt: status === 'RESOLVED' ? date.toISOString() : null,
            resolvedBy: status === 'RESOLVED' ? { username: 'Admin' } : null,
            notes: status === 'RESOLVED' ? 'Verified with platform support' : null,
        });
    }

    return orders;
};

/**
 * Generate demo aggregator statistics
 */
export const generateDemoAggregatorStats = (orders) => {
    return {
        total: orders.length,
        pending: orders.filter((o) => o.matchStatus === 'PENDING').length,
        matched: orders.filter((o) => o.matchStatus === 'MATCHED').length,
        shortage: orders.filter((o) => o.matchStatus === 'SHORTAGE').length,
        excess: orders.filter((o) => o.matchStatus === 'EXCESS').length,
        resolved: orders.filter((o) => o.matchStatus === 'RESOLVED').length,
        totalDifference: parseFloat(
            orders.reduce((sum, o) => sum + (o.difference || 0), 0).toFixed(2)
        ),
    };
};

/**
 * Generate demo Razorpay settlements
 */
export const generateDemoRazorpaySettlements = () => {
    const today = new Date();
    const settlements = [];

    // Generate 10 sample settlements
    const statuses = ['MATCHED', 'SHORTAGE', 'EXCESS', 'PENDING'];

    for (let i = 0; i < 10; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - Math.floor(Math.random() * 14)); // Last 14 days

        const receivedAmount = 5000 + Math.random() * 15000; // ₹5000-20000
        const expectedAmount = receivedAmount + (Math.random() - 0.5) * 500; // Small difference
        const difference = receivedAmount - expectedAmount;
        const status = statuses[Math.floor(Math.random() * statuses.length)];

        settlements.push({
            _id: `demo_settle_${i}`,
            settlementId: `setl_${Date.now() - i * 100000}`,
            settlementDate: date.toISOString(),
            receivedAmount: parseFloat(receivedAmount.toFixed(2)),
            expectedAmount: parseFloat(expectedAmount.toFixed(2)),
            difference: parseFloat(difference.toFixed(2)),
            status,
            orderIds: Array.from({ length: 3 + Math.floor(Math.random() * 5) }, (_, j) => ({
                _id: `order_${i}_${j}`,
                orderCode: `ORD${2000 + i * 10 + j}`,
                total: parseFloat((receivedAmount / (3 + Math.floor(Math.random() * 5))).toFixed(2)),
            })),
            reconciliationDate: status === 'MATCHED' ? date.toISOString() : null,
            notes: status === 'MATCHED' ? 'Auto-reconciled' : null,
        });
    }

    return settlements;
};

/**
 * Generate demo payment reconciliation statistics
 */
export const generateDemoPaymentStats = (settlements) => {
    return {
        total: settlements.length,
        matched: settlements.filter((s) => s.status === 'MATCHED').length,
        shortage: settlements.filter((s) => s.status === 'SHORTAGE').length,
        excess: settlements.filter((s) => s.status === 'EXCESS').length,
        pending: settlements.filter((s) => s.status === 'PENDING').length,
        totalDifference: parseFloat(
            settlements.reduce((sum, s) => sum + (s.difference || 0), 0).toFixed(2)
        ),
    };
};

/**
 * Get demo aggregator mismatch data
 */
export const getDemoAggregatorMismatch = (filters = {}) => {
    let orders = generateDemoAggregatorOrders();

    // Apply filters
    if (filters.source) {
        orders = orders.filter((o) => o.source === filters.source);
    }
    if (filters.status) {
        orders = orders.filter((o) => o.matchStatus === filters.status);
    }

    const stats = generateDemoAggregatorStats(orders);

    return { mismatches: orders, stats };
};

/**
 * Get demo payment reconciliation data
 */
export const getDemoPaymentReconciliation = (filters = {}) => {
    let settlements = generateDemoRazorpaySettlements();

    // Apply filters
    if (filters.status) {
        settlements = settlements.filter((s) => s.status === filters.status);
    }

    const stats = generateDemoPaymentStats(settlements);

    return { settlements, stats };
};
