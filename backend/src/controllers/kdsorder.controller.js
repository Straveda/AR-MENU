import { Order } from "../models/order.models.js";
import { User } from "../models/user.models.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { io } from "../../index.js";

const loginKds = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required" });
        }

        const kdsUser = await User.findOne({ email, role: 'KDS' });
        if (!kdsUser || !kdsUser.isActive) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, kdsUser.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const token = jwt.sign(
            { id: kdsUser._id, role: kdsUser.role, restaurantId: kdsUser.restaurantId },
            process.env.JWT_SECRET || "default_secret",
            { expiresIn: "12h" }
        );

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            restaurantId: kdsUser.restaurantId
        });

    } catch (error) {
        console.error("KDS Login Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const getKdsOrders = async (req, res) => {
    try {
        
        const restaurant = req.restaurant;
        if (!restaurant) {
            return res.status(400).json({ success: false, message: "Restaurant context missing" });
        }

        const pendingOrders = await Order.find(
            { orderStatus: "Pending", restaurantId: restaurant._id },
            "orderCode tableNumber orderItems.name orderItems.quantity createdAt orderStatus"
        ).lean();

        const preparingOrders = await Order.find(
            { orderStatus: "Preparing", restaurantId: restaurant._id },
            "orderCode tableNumber orderItems.name orderItems.quantity createdAt orderStatus"
        ).lean();

        const readyOrders = await Order.find(
            { orderStatus: "Ready", restaurantId: restaurant._id },
            "orderCode tableNumber orderItems.name orderItems.quantity createdAt orderStatus"
        ).lean();

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
            }));

        return res.status(200).json({
            data: {
                pending: format(pendingOrders),
                preparing: format(preparingOrders),
                ready: format(readyOrders)
            },
            success: true,
            message: "Orders fetched successfully"
        })
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        })
    }
}

const updateKdsOrderStatus = async (req, res) => {
    try {
        const statusArray = ["Pending", "Preparing", "Ready", "Completed"];

        const { orderCode } = req.params;
        const { status } = req.body;

        const kdsStatusIndex = statusArray.indexOf(status);
        if (kdsStatusIndex === -1) {
            return res.status(400).json({
                success: false,
                message: "Invalid status",
            });
        }

        const restaurant = req.restaurant;
        if (!restaurant) {
            return res.status(400).json({ success: false, message: "Restaurant context missing" });
        }

        const order = await Order.findOne({ orderCode, restaurantId: restaurant._id });
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        const currentStatus = order.orderStatus;
        const currentStatusIndex = statusArray.indexOf(currentStatus);

        if (currentStatus === "Completed") {
            return res.status(400).json({
                success: false,
                message: "Order already completed",
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
            by: "kds",
        });

        await order.save();
        
        // Notify the specific order room (customer)
        io.to(`ORDER_ROOM_${restaurant._id}_${order.orderCode}`).emit("order_status_updated", order);
        
        // Notify the KDS room (other KDS screens for this restaurant)
        io.to(`KDS_ROOM_${restaurant._id}`).emit("kds_order_updated", order);

        return res.status(200).json({
            success: true,
            message: "Order status updated successfully",
            order,
        });

    } catch (error) {
        console.error("KDS Status Update Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

export { getKdsOrders, updateKdsOrderStatus, loginKds }