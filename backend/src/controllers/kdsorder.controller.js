import { Order } from '../models/order.models.js';
import { User } from '../models/user.models.js';
import { Dish } from '../models/dish.models.js';
import { Ingredient } from '../models/ingredient.model.js';
import { StockMovement } from '../models/stockMovement.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { io } from '../../index.js';
import { invalidateGSTCache } from '../services/reports.service.js';

const loginKds = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const kdsUser = await User.findOne({ email, role: 'KDS' });
    if (!kdsUser || !kdsUser.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, kdsUser.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: kdsUser._id, role: kdsUser.role, restaurantId: kdsUser.restaurantId },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '12h' },
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      restaurantId: kdsUser.restaurantId,
    });
  } catch (error) {
    console.error('KDS Login Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getKdsOrders = async (req, res) => {
  try {
    const restaurant = req.restaurant;
    if (!restaurant) {
      return res.status(400).json({ success: false, message: 'Restaurant context missing' });
    }

    const pendingOrders = await Order.find(
      { orderStatus: 'Pending', restaurantId: restaurant._id },
      'orderCode tableNumber orderItems.name orderItems.quantity createdAt orderStatus total',
    ).lean();

    const preparingOrders = await Order.find(
      { orderStatus: 'Preparing', restaurantId: restaurant._id },
      'orderCode tableNumber orderItems.name orderItems.quantity createdAt orderStatus total',
    ).lean();

    const readyOrders = await Order.find(
      { orderStatus: 'Ready', restaurantId: restaurant._id },
      'orderCode tableNumber orderItems.name orderItems.quantity createdAt orderStatus total',
    ).lean();

    const deliveredOrders = await Order.find(
      { orderStatus: 'Completed', restaurantId: restaurant._id },
      'orderCode tableNumber orderItems.name orderItems.quantity createdAt orderStatus total',
    ).limit(50).sort({ createdAt: -1 }).lean();

    const format = (orders) =>
      orders.map((order) => ({
        orderId: order._id,
        orderCode: order.orderCode,
        tableNumber: order.tableNumber,
        items: order.orderItems.map((i) => ({
          name: i.name,
          quantity: i.quantity,
        })),
        createdAt: order.createdAt,
        orderStatus: order.orderStatus,
        total: order.total,
      }));

    return res.status(200).json({
      data: {
        pending: format(pendingOrders),
        preparing: format(preparingOrders),
        ready: format(readyOrders),
        delivered: format(deliveredOrders),
      },
      success: true,
      message: 'Orders fetched successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

const updateKdsOrderStatus = async (req, res) => {
  try {
    const statusArray = ['Pending', 'Preparing', 'Ready', 'Completed'];

    const { orderCode } = req.params;
    const { status } = req.body;

    const kdsStatusIndex = statusArray.indexOf(status);
    if (kdsStatusIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }

    const restaurant = req.restaurant;
    if (!restaurant) {
      return res.status(400).json({ success: false, message: 'Restaurant context missing' });
    }

    const order = await Order.findOne({ orderCode, restaurantId: restaurant._id });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const currentStatus = order.orderStatus;
    const currentStatusIndex = statusArray.indexOf(currentStatus);

    if (currentStatus === 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Order already completed',
      });
    }

    if (kdsStatusIndex !== currentStatusIndex + 1) {
      return res.status(400).json({
        success: false,
        message: `Invalid transition: ${currentStatus} → ${status}`,
      });
    }

    order.orderStatus = status;

    order.history.push({
      status,
      by: 'kds',
    });

    // --- AUTOMATED STOCK DEDUCTION START ---
    if (status === 'Completed') {
      try {
        console.log(`Processing stock deduction for Order ${orderCode}`);
        for (const item of order.orderItems) {
          // Fetch the dish to get the recipe
          const dish = await Dish.findById(item.dishId).lean();
          if (!dish || !dish.recipe || dish.recipe.length === 0) {
            continue; // Skip if no dish or no recipe
          }

          // Process each ingredient in the recipe
          for (const ingredientUsage of dish.recipe) {
            const deductionAmount = ingredientUsage.quantity * item.quantity;

            // Atomically update stock, ensuring it doesn't go below 0 is handled here or by check
            // We use $inc with negative value. 
            // MongoDB will let it go negative unless schema has min: 0. 
            // Our Schema HAS min: 0. So strict decrement might fail if stock < deduction.
            // Strategy: Find, Calculate new val, Update.

            const ingredient = await Ingredient.findById(ingredientUsage.ingredientId);
            if (ingredient) {
              let newStock = ingredient.currentStock - deductionAmount;
              if (newStock < 0) newStock = 0; // Prevent negative stock error

              ingredient.currentStock = newStock;
              await ingredient.save();

              // Log stock movement
              await StockMovement.create({
                ingredientId: ingredient._id,
                action: 'DEDUCT',
                quantity: deductionAmount,
                reason: 'ORDER',
                performedBy: req.user?._id || ingredient.restaurantId, // Fallback if user not in req
                restaurantId: restaurant._id,
              });

              console.log(`Deducted ${deductionAmount} ${ingredient.unit} of ${ingredient.name}. New Stock: ${newStock}`);
            }
          }
        }
      } catch (stockError) {
        console.error('Stock Deduction Error:', stockError);
        // We do NOT fail the order update if stock fails. Just log it.
      }
    }
    // --- AUTOMATED STOCK DEDUCTION END ---

    await order.save();
    await invalidateGSTCache(restaurant._id);

    io.to(`ORDER_ROOM_${restaurant._id}_${order.orderCode}`).emit('order_status_updated', order);

    io.to(`KDS_ROOM_${restaurant._id}`).emit('kds_order_updated', order);

    return res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      order,
    });
  } catch (error) {
    console.error('KDS Status Update Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

export { getKdsOrders, updateKdsOrderStatus, loginKds };
