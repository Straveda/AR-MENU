import { createContext, useContext, useReducer, useEffect } from "react";
import axiosClient from "../api/axiosClient";
import { useTenant } from "./TenantProvider";

const OrderContext = createContext();

const applyDiscounts = (items) => {
    const cartDishIds = items.map(i => i.dishId.toString());

    return items.map(item => {
        let currentPrice = item.originalPrice || item.price;
        if (item.mainDishId && item.discountPercentage > 0) {
            const isMainDishPresent = cartDishIds.includes(item.mainDishId.toString());
            if (isMainDishPresent) {
                currentPrice = Math.round(item.originalPrice * (1 - item.discountPercentage / 100));
            } else {
                currentPrice = item.originalPrice;
            }
        }
        return { ...item, price: currentPrice };
    });
};

const initialState = {
    tableNumber: "",
    items: [],
};

function orderReducer(state, action) {
    switch (action.type) {
        case "SET_TABLE_NUMBER":
            return { ...state, tableNumber: action.payload };

        case "ADD_ITEM": {
            const { dish, quantity, upsellRuleId, source, originalPrice, mainDishId, discountPercentage } = action.payload;

            const existingItemIndex = state.items.findIndex(item =>
                item.dishId === dish._id
            );

            let newItems;
            if (existingItemIndex > -1) {
                newItems = [...state.items];
                newItems[existingItemIndex].quantity += quantity;
                // If it was added via upsell now but was already there, update metadata if needed
                if (upsellRuleId) {
                    newItems[existingItemIndex].upsellRuleId = upsellRuleId;
                    newItems[existingItemIndex].source = source;
                    newItems[existingItemIndex].mainDishId = mainDishId;
                    newItems[existingItemIndex].discountPercentage = discountPercentage;
                }
            } else {
                newItems = [
                    ...state.items,
                    {
                        dishId: dish._id,
                        name: dish.name,
                        price: dish.price,
                        image: dish.imageUrl,
                        quantity: quantity,
                        upsellRuleId: upsellRuleId || null,
                        source: source || 'MENU',
                        originalPrice: originalPrice || dish.price,
                        mainDishId: mainDishId || null,
                        discountPercentage: discountPercentage || 0
                    }
                ];
            }

            return { ...state, items: applyDiscounts(newItems) };
        }

        case "REMOVE_ITEM": {
            const remainingItems = state.items.filter(item => item.dishId !== action.payload);
            return {
                ...state,
                items: applyDiscounts(remainingItems)
            };
        }

        case "UPDATE_QUANTITY": {
            const { dishId, quantity } = action.payload;
            if (quantity <= 0) {
                const remainingItems = state.items.filter(item => item.dishId !== dishId);
                return {
                    ...state,
                    items: applyDiscounts(remainingItems)
                };
            }
            const updatedItems = state.items.map(item =>
                item.dishId === dishId ? { ...item, quantity } : item
            );
            return {
                ...state,
                items: applyDiscounts(updatedItems)
            };
        }

        case "CLEAR_ORDER":
            return initialState;

        default:
            return state;
    }
}

export function OrderProvider({ children }) {
    const [state, dispatch] = useReducer(orderReducer, initialState);
    const { slug } = useTenant();

    const addItem = (dish, quantity, metadata = {}) => {
        dispatch({
            type: "ADD_ITEM",
            payload: {
                dish,
                quantity,
                upsellRuleId: metadata.upsellRuleId,
                source: metadata.source,
                originalPrice: metadata.originalPrice,
                mainDishId: metadata.mainDishId,
                discountPercentage: metadata.discountPercentage
            }
        });
    };

    const removeItem = (dishId) => {
        dispatch({ type: "REMOVE_ITEM", payload: dishId });
    };

    const updateQuantity = (dishId, quantity) => {
        dispatch({ type: "UPDATE_QUANTITY", payload: { dishId, quantity } });
    };

    const setTableNumber = (num) => {
        dispatch({ type: "SET_TABLE_NUMBER", payload: num });
    }

    const clearOrder = () => {
        dispatch({ type: "CLEAR_ORDER" });
    };

    // ── localStorage helpers ──────────────────────────────────────────
    const LS_KEY = (s) => `armenu_orders_${s}`;

    const saveOrderToHistory = (orderData, restaurantSlug) => {
        if (!restaurantSlug || !orderData?.orderCode) return;
        try {
            const key = LS_KEY(restaurantSlug);
            const existing = JSON.parse(localStorage.getItem(key) || "[]");
            // Prevent duplicates
            const filtered = existing.filter(o => o.orderCode !== orderData.orderCode);
            const entry = {
                orderCode: orderData.orderCode,
                tableNumber: orderData.tableNumber,
                total: orderData.total,
                orderItems: orderData.orderItems || [],
                orderStatus: orderData.orderStatus || "Pending",
                placedAt: new Date().toISOString(),
            };
            localStorage.setItem(key, JSON.stringify([entry, ...filtered].slice(0, 20)));
        } catch (e) {
            console.error("Failed to save order history:", e);
        }
    };

    const getMyOrders = (restaurantSlug) => {
        if (!restaurantSlug) return [];
        try {
            return JSON.parse(localStorage.getItem(LS_KEY(restaurantSlug)) || "[]");
        } catch {
            return [];
        }
    };

    const updateOrderStatusInHistory = (orderCode, restaurantSlug, newStatus) => {
        if (!restaurantSlug || !orderCode) return;
        try {
            const key = LS_KEY(restaurantSlug);
            const existing = JSON.parse(localStorage.getItem(key) || "[]");
            const updated = existing.map(o =>
                o.orderCode === orderCode ? { ...o, orderStatus: newStatus } : o
            );
            localStorage.setItem(key, JSON.stringify(updated));
        } catch (e) {
            console.error("Failed to update order status in history:", e);
        }
    };
    // ─────────────────────────────────────────────────────────────────

    const placeOrder = async (finalTableNumber) => {
        const tableNum = finalTableNumber || state.tableNumber;

        if (!slug) {
            throw new Error("Invalid restaurant context. Please reload via a valid link.");
        }

        if (!tableNum) {
            throw new Error("Table number is required");
        }

        if (state.items.length === 0) {
            throw new Error("Cart is empty");
        }

        const payload = {
            tableNumber: parseInt(tableNum),
            orderItems: state.items.map(item => ({
                dishId: item.dishId,
                quantity: item.quantity,
                name: item.name,
                price: item.price,
                // Pass metadata to backend
                upsellRuleId: item.upsellRuleId,
                source: item.source,
                originalPrice: item.originalPrice
            }))
        };

        try {
            const response = await axiosClient.post(`/orders/r/${slug}/create`, payload);
            if (response.data.success || response.data.data?.orderCode) {
                const orderData = response.data.data || response.data;
                clearOrder();
                saveOrderToHistory(orderData, slug);
                return orderData;
            } else {
                throw new Error(response.data.message || "Failed to place order");
            }
        } catch (error) {
            console.error("Place Order Error:", error);

            throw error;
        }
    };

    return (
        <OrderContext.Provider value={{
            ...state,
            addItem,
            removeItem,
            updateQuantity,
            clearOrder,
            placeOrder,
            setTableNumber,
            getMyOrders,
            updateOrderStatusInHistory,
        }}>
            {children}
        </OrderContext.Provider>
    );
}

export const useOrder = () => useContext(OrderContext);
