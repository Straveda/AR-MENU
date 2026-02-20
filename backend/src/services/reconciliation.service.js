import { Order } from '../models/order.models.js';
import AggregatorOrder from '../models/aggregatorOrder.model.js';
import RazorpaySettlement from '../models/razorpaySettlement.model.js';
import mongoose from 'mongoose';

/**
 * Sync Aggregator Orders (manual upload or API integration)
 * @param {ObjectId} restaurantId
 * @param {String} source - 'SWIGGY' or 'ZOMATO'
 * @param {Array} ordersData - Array of aggregator order objects
 * @returns {Array} Created/updated aggregator orders
 */
export const syncAggregatorOrders = async (restaurantId, source, ordersData) => {
    const results = [];
    const rId = new mongoose.Types.ObjectId(restaurantId);

    for (const orderData of ordersData) {
        // Try to match with existing POS order
        const matchedOrder = await Order.findOne({
            restaurantId: rId,
            orderCode: orderData.platformOrderId,
            source,
        });

        const difference = matchedOrder
            ? parseFloat((orderData.platformAmount - matchedOrder.total).toFixed(2))
            : null;

        let matchStatus = 'PENDING';
        if (matchedOrder) {
            if (Math.abs(difference) < 1) {
                matchStatus = 'MATCHED';
            } else if (difference < 0) {
                matchStatus = 'SHORTAGE';
            } else {
                matchStatus = 'EXCESS';
            }
        }

        // Upsert aggregator order
        const aggregatorOrder = await AggregatorOrder.findOneAndUpdate(
            {
                restaurantId: rId,
                source,
                platformOrderId: orderData.platformOrderId,
            },
            {
                restaurantId: rId,
                source,
                platformOrderId: orderData.platformOrderId,
                platformAmount: orderData.platformAmount,
                orderDate: new Date(orderData.orderDate),
                customerName: orderData.customerName,
                items: orderData.items || [],
                platformFee: orderData.platformFee || 0,
                deliveryFee: orderData.deliveryFee || 0,
                taxes: orderData.taxes || 0,
                netAmount: orderData.netAmount,
                matchedOrderId: matchedOrder?._id,
                matchStatus,
                difference,
            },
            { upsert: true, new: true }
        );

        results.push(aggregatorOrder);
    }

    return results;
};

/**
 * Sync Razorpay Settlements
 * @param {ObjectId} restaurantId
 * @param {Array} settlementsData - Array of settlement objects
 * @returns {Array} Created/updated settlements
 */
export const syncRazorpaySettlements = async (restaurantId, settlementsData) => {
    const results = [];
    const rId = new mongoose.Types.ObjectId(restaurantId);

    for (const settlementData of settlementsData) {
        let orders = [];

        // STRATEGY 1: Try to match by "orderCode" if present in description (e.g., "Order #12345")
        // This depends on whether the payment description carries the order code.
        const description = settlementData.description || "";
        const orderCodeMatch = description.match(/#([A-Z0-9]+)/); // Simple regex for #CODE

        if (orderCodeMatch && orderCodeMatch[1]) {
            const orderCode = orderCodeMatch[1];
            const order = await Order.findOne({
                restaurantId: rId,
                orderCode: orderCode,
                paymentMode: 'RAZORPAY'
            });
            if (order) orders.push(order);
        }

        // STRATEGY 2: Fuzzy Match - Find UNSETTLED Razorpay orders created BEFORE this settlement
        // If no specific orders found yet, we grab all pending ones.
        // NOTE: This assumes FIFO or simple batch clearing.
        if (orders.length === 0) {
            orders = await Order.find({
                restaurantId: rId,
                paymentMode: 'RAZORPAY',
                settlementId: null, // Only pick orders not yet settled
                createdAt: { $lte: new Date(settlementData.settlementDate) } // Created before settlement
            });
        }

        // Calculate totals from found orders
        const expectedAmount = parseFloat(
            orders.reduce((sum, o) => sum + o.total, 0).toFixed(2)
        );
        const difference = parseFloat(
            (settlementData.receivedAmount - expectedAmount).toFixed(2)
        );

        let status = 'PENDING';
        if (orders.length > 0) {
            if (Math.abs(difference) < 5) { // Allow small difference (e.g. fees/rounding)
                status = 'MATCHED';
            } else if (difference < 0) {
                status = 'SHORTAGE';
            } else {
                status = 'EXCESS';
            }
        }

        // Update successful links
        if (orders.length > 0) {
            await Order.updateMany(
                { _id: { $in: orders.map(o => o._id) } },
                { $set: { settlementId: settlementData.settlementId } }
            );
        }

        // Upsert settlement
        const settlement = await RazorpaySettlement.findOneAndUpdate(
            {
                restaurantId: rId,
                settlementId: settlementData.settlementId,
            },
            {
                restaurantId: rId,
                settlementId: settlementData.settlementId,
                settlementDate: new Date(settlementData.settlementDate),
                receivedAmount: settlementData.receivedAmount,
                expectedAmount,
                difference,
                status,
                orderIds: orders.map((o) => o._id),
                reconciliationDate: status === 'MATCHED' ? new Date() : null,
            },
            { upsert: true, new: true }
        );

        results.push(settlement);
    }

    return results;
};

/**
 * Match Orders to Settlement
 * @param {String} settlementId
 * @returns {Object} Updated settlement
 */
export const matchOrdersToSettlement = async (settlementId) => {
    const settlement = await RazorpaySettlement.findOne({ settlementId });
    if (!settlement) throw new Error('Settlement not found');

    // Find orders for this settlement
    const orders = await Order.find({
        restaurantId: settlement.restaurantId,
        paymentMode: 'RAZORPAY',
        settlementId: settlement._id,
    });

    const expectedAmount = parseFloat(
        orders.reduce((sum, o) => sum + o.total, 0).toFixed(2)
    );
    const difference = parseFloat((settlement.receivedAmount - expectedAmount).toFixed(2));

    let status = 'PENDING';
    if (orders.length > 0) {
        if (Math.abs(difference) < 1) {
            status = 'MATCHED';
        } else if (difference < 0) {
            status = 'SHORTAGE';
        } else {
            status = 'EXCESS';
        }
    }

    settlement.expectedAmount = expectedAmount;
    settlement.difference = difference;
    settlement.status = status;
    settlement.orderIds = orders.map((o) => o._id);
    settlement.reconciliationDate = status === 'MATCHED' ? new Date() : null;

    await settlement.save();
    return settlement;
};

/**
 * Resolve Aggregator Mismatch
 * @param {ObjectId} mismatchId
 * @param {ObjectId} userId
 * @param {String} notes
 * @returns {Object} Updated mismatch
 */
export const resolveAggregatorMismatch = async (mismatchId, userId, notes) => {
    const mismatch = await AggregatorOrder.findById(mismatchId);
    if (!mismatch) throw new Error('Mismatch not found');

    mismatch.matchStatus = 'RESOLVED';
    mismatch.resolvedAt = new Date();
    mismatch.resolvedBy = userId;
    mismatch.notes = notes;

    await mismatch.save();
    return mismatch;
};

/**
 * Auto-match aggregator orders with POS orders
 * @param {ObjectId} restaurantId
 * @param {String} source
 * @returns {Object} Match results
 */
export const autoMatchAggregatorOrders = async (restaurantId, source) => {
    const rId = new mongoose.Types.ObjectId(restaurantId);

    const pendingOrders = await AggregatorOrder.find({
        restaurantId: rId,
        source,
        matchStatus: 'PENDING',
    });

    let matched = 0;
    let notMatched = 0;

    for (const aggOrder of pendingOrders) {
        // Try to find matching POS order by order code
        const posOrder = await Order.findOne({
            restaurantId: rId,
            orderCode: aggOrder.platformOrderId,
            source,
        });

        if (posOrder) {
            const difference = parseFloat((aggOrder.platformAmount - posOrder.total).toFixed(2));

            let matchStatus = 'PENDING';
            if (Math.abs(difference) < 1) {
                matchStatus = 'MATCHED';
                matched++;
            } else if (difference < 0) {
                matchStatus = 'SHORTAGE';
                matched++;
            } else {
                matchStatus = 'EXCESS';
                matched++;
            }

            aggOrder.matchedOrderId = posOrder._id;
            aggOrder.matchStatus = matchStatus;
            aggOrder.difference = difference;
            await aggOrder.save();
        } else {
            notMatched++;
        }
    }

    return { matched, notMatched };
};
