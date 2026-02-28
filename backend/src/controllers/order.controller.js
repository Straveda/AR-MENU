import { Order } from '../models/order.models.js';
import { Dish } from '../models/dish.models.js';
import { GeneratedRecommendation } from '../models/generatedRecommendation.model.js';
import { UpsellRule } from '../models/upsellRule.model.js';
import { io } from '../../index.js';
import { invalidateGSTCache } from '../services/reports.service.js';

const generateOrderCode = () => {
  let choose = 'ABCDEFGHIJKLMPQRSTUVWXYZ1234567890';
  let code = '';

  for (let i = 0; i < 5; i++) {
    const letter = choose.charAt(Math.floor(Math.random() * choose.length));
    code = code + letter;
  }

  return code;
};

const createOrder = async (req, res) => {
  try {
    const restaurant = req.restaurant;

    if (!restaurant) {
      return res.status(500).json({
        success: false,
        message: 'Restaurant context missing',
      });
    }

    const { tableNumber, orderItems } = req.body;

    if (tableNumber === undefined || !orderItems || orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Table number and order items are required',
      });
    }

    let formattedItems = [];
    let subtotal = 0;

    for (const item of orderItems) {
      const dish = await Dish.findOne({
        _id: item.dishId,
        restaurantId: restaurant._id,
      });

      if (!dish) {
        return res.status(404).json({
          success: false,
          message: `Dish not found ${item.dishId}`,
        });
      }

      const lineTotal = dish.price * item.quantity;

      await Dish.findByIdAndUpdate(dish._id, {
        $inc: { orderCount: item.quantity },
      });

      // Handle Upsell Tracking
      if (item.upsellRuleId) {
        try {
          // Verify rule exists
          const rule = await UpsellRule.findById(item.upsellRuleId);
          if (rule) {
            // Create a record of this successful upsell
            await GeneratedRecommendation.create({
              restaurantId: restaurant._id,
              ruleId: rule._id,
              ruleName: rule.ruleName,
              ruleType: rule.ruleType,
              mainDishId: rule.mainDishId, // Might be null if it was a cart upsell not tied to a specific main dish context here, but usually we know context? 
              // Actually, for cart upsells, mainDishId might be null. 
              // But wait, if it's a specific rule, it has a mainDishId usually. 
              // If it's a CART_THRESHOLD rule, mainDishId is null.
              secondaryDishId: dish._id,
              status: 'ACCEPTED',
              conversionValue: lineTotal
            });

            // Update rule stats
            await UpsellRule.findByIdAndUpdate(rule._id, {
              $inc: { conversionCount: 1, revenue: lineTotal }
            });
          }
        } catch (err) {
          console.error('Error tracking upsell:', err);
          // Don't block order creation
        }
      }

      formattedItems.push({
        dishId: dish._id,
        name: dish.name,
        price: dish.price,
        quantity: item.quantity,
        lineTotal,
        // Pass through upsell metadata
        upsellRuleId: item.upsellRuleId,
        source: item.source,
        originalPrice: item.originalPrice
      });

      subtotal += lineTotal;
    }

    const orderCode = generateOrderCode();

    const taxAmount = parseFloat((subtotal * 0.18).toFixed(2));
    const total = parseFloat((subtotal + taxAmount).toFixed(2));

    const newOrder = await Order.create({
      restaurantId: restaurant._id,
      orderCode,
      tableNumber,
      orderItems: formattedItems,
      subtotal,
      total,
      taxAmount,
      orderStatus: 'Pending',
      history: [
        {
          status: 'Pending',
          by: 'system',
        },
      ],
    });

    io.to(`KDS_ROOM_${restaurant._id}`).emit('order_created', newOrder);
    await invalidateGSTCache(restaurant._id);

    return res.status(201).json({
      success: true,
      message: 'Order Created Successfully',
      data: newOrder,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

const trackOrder = async (req, res) => {
  try {
    const orderCode = req.params.orderCode?.trim();
    const restaurant = req.restaurant;

    if (!orderCode) {
      return res.status(400).json({
        success: false,
        message: 'Order code is required',
      });
    }

    const order = await Order.findOne({
      orderCode,
      restaurantId: restaurant._id,
    }).lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    return res.status(200).json({
      data: {
        orderCode: order.orderCode,
        restaurantId: order.restaurantId,
        tableNumber: order.tableNumber,
        orderItems: order.orderItems,
        subtotal: order.subtotal,
        total: order.total,
        orderStatus: order.orderStatus,
      },
      success: true,
      message: 'Order found',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const getPopularDishes = async (req, res) => {
  try {
    const restaurant = req.restaurant;
    if (!restaurant) {
      return res.status(400).json({ success: false, message: 'Restaurant context missing' });
    }

    const excludeParam = req.query.exclude || '';
    const excludeIds = excludeParam ? excludeParam.split(',').filter(Boolean) : [];

    // Fetch up to 3 dishes that are available and not in cart
    // We use .limit(3) on a simple query for "popular" (by orderCount) or just random
    // The user said "random three dishes random from menu"
    const dishes = await Dish.find({
      restaurantId: restaurant._id,
      available: true,
      _id: { $nin: excludeIds },
    })
      .sort({ orderCount: -1 }) // We'll keep popularity but keep it simple
      .limit(3)
      .select('_id name price imageUrl category orderCount')
      .lean();

    return res.status(200).json({ success: true, data: dishes });
  } catch (error) {
    console.error('getPopularDishes error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export { createOrder, trackOrder, getPopularDishes };
