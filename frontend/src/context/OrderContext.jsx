import { createContext, useContext, useReducer, useEffect } from "react";
import axiosClient from "../api/axiosClient";
import { useTenant } from "./TenantProvider";

const OrderContext = createContext();

const initialState = {
    tableNumber: "",
    items: [],
};

function orderReducer(state, action) {
    switch (action.type) {
        case "SET_TABLE_NUMBER":
            return { ...state, tableNumber: action.payload };

        case "ADD_ITEM": {
            const { dish, quantity, upsellRuleId, source, originalPrice } = action.payload;
            // Check if item exists with SAME dishId AND SAME upsellRuleId (to separate regular items from upsell items if needed, or just merge)
            // For simplicity, if it's the same dish, we merge, but we might lose track of which specific one was the upsell if mixed.
            // Better approach: If it's an upsell, it might have a different price or just track it. 
            // Let's assume merging is fine, but we update the metadata to reflect the latest addition source if meaningful.
            // Actually, if a user adds a dish manually, then adds it via upsell, they are just adding quantity. 
            // But if the upsell has a DISCOUNT, it effectively is a different item price-wise. 
            // The system handles price in the item. 

            const existingItemIndex = state.items.findIndex(item =>
                item.dishId === dish._id && item.price === dish.price
            );

            if (existingItemIndex > -1) {
                const newItems = [...state.items];
                newItems[existingItemIndex].quantity += quantity;
                return { ...state, items: newItems };
            }

            return {
                ...state,
                items: [
                    ...state.items,
                    {
                        dishId: dish._id,
                        name: dish.name,
                        price: dish.price,
                        image: dish.imageUrl,
                        quantity: quantity,
                        upsellRuleId: upsellRuleId || null,
                        source: source || 'MENU',
                        originalPrice: originalPrice || null
                    }
                ]
            };
        }

        case "REMOVE_ITEM":
            return {
                ...state,
                items: state.items.filter(item => item.dishId !== action.payload)
            };

        case "UPDATE_QUANTITY": {
            const { dishId, quantity } = action.payload;
            if (quantity <= 0) {
                return {
                    ...state,
                    items: state.items.filter(item => item.dishId !== dishId)
                };
            }
            return {
                ...state,
                items: state.items.map(item =>
                    item.dishId === dishId ? { ...item, quantity } : item
                )
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
                originalPrice: metadata.originalPrice
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
                clearOrder();

                return response.data.data || response.data;
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
            setTableNumber
        }}>
            {children}
        </OrderContext.Provider>
    );
}

export const useOrder = () => useContext(OrderContext);
