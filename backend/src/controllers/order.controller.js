import { Order } from '../models/order.models.js';
import { Dish } from '../models/dish.models.js';
import { io } from '../../index.js';

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

      formattedItems.push({
        dishId: dish._id,
        name: dish.name,
        price: dish.price,
        quantity: item.quantity,
        lineTotal,
      });

      subtotal += lineTotal;
    }

    const orderCode = generateOrderCode();

    const newOrder = await Order.create({
      restaurantId: restaurant._id,
      orderCode,
      tableNumber,
      orderItems: formattedItems,
      subtotal,
      total: subtotal,
      orderStatus: 'Pending',
      history: [
        {
          status: 'Pending',
          by: 'system',
        },
      ],
    });

    io.to(`KDS_ROOM_${restaurant._id}`).emit('order_created', newOrder);

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

export { createOrder, trackOrder };
