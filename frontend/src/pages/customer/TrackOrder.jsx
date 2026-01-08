import { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";
import { useSocket } from "../../context/SocketProvider";
import { useTenant } from "../../context/TenantProvider";

export default function TrackOrderV2() {
    const { socket, connect, disconnect, joinRoom, leaveRoom } = useSocket();
    const { slug } = useTenant();
    
    const [orderCode, setOrderCode] = useState("");
    const [orderData, setOrderData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [hasSearched, setHasSearched] = useState(false);
    const [isLive, setIsLive] = useState(false);

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case "pending":
                return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case "preparing":
                return "bg-orange-100 text-orange-800 border-orange-200";
            case "ready":
                return "bg-green-100 text-green-800 border-green-200";
            case "completed":
                return "bg-blue-100 text-blue-800 border-blue-200";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        if (code) {
            setOrderCode(code);
            trackOrderInternal(code);
        }
    }, []);

    const trackOrderInternal = async (code) => {
        if (!code) return;
        setLoading(true);
        setError("");

        if (!slug) {
            setError("Restaurant context missing. Please try again from the menu.");
            setLoading(false);
            return;
        }

        setHasSearched(true);
        try {
            const res = await axiosClient.get(`/orders/r/${slug}/track/${code}`);
            if (res.data.success) {
                setOrderData(res.data.data);
            }
        } catch (err) {
            console.error("Error tracking order:", err);
            setError(err.response?.data?.message || "Order not found. Please check the code and try again.");
            setOrderData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!orderData || !orderData.restaurantId || !orderData.orderCode) return;

        connect();

        const roomName = `ORDER_ROOM_${orderData.restaurantId}_${orderData.orderCode}`;

        joinRoom(roomName);
        setIsLive(true);

        const handleUpdate = (updatedOrder) => {
            console.log("Realtime Update Received:", updatedOrder);
            
            if (updatedOrder.orderCode === orderData.orderCode) {
                
                setOrderData(prev => ({ ...prev, ...updatedOrder }));
            }
        };

        socket.on("order_status_updated", handleUpdate);

        socket.on("disconnect", () => setIsLive(false));
        socket.on("connect", () => {
             joinRoom(roomName); 
             setIsLive(true);
        });

        return () => {
            socket.off("order_status_updated", handleUpdate);
            socket.off("disconnect");
            socket.off("connect");
            leaveRoom(roomName);

        };
    }, [orderData?.restaurantId, orderData?.orderCode, connect, joinRoom, leaveRoom, socket]);

    useEffect(() => {
        if (!orderData) return;
        
        const interval = setInterval(() => {

            if (!socket.connected) {
                trackOrderInternal(orderData.orderCode);
            }
        }, 15000); 

        return () => clearInterval(interval);
    }, [orderData?.orderCode, socket]);

    const handleTrackOrder = (e) => {
        e.preventDefault();
        trackOrderInternal(orderCode);
    };

    return (
        <div className="min-h-screen bg-amber-50 px-4 py-8 flex flex-col items-center">
            {}
            <div className="text-center mb-10 w-full max-w-2xl">
                <h1 className="type-h1 text-gray-800 mb-2 tracking-wide">
                    Track Your Order
                </h1>
                <div className="w-20 h-1 bg-amber-600 mx-auto mb-4"></div>
                <p className="type-secondary">
                    Enter your unique order code to see the realtime status of your meal.
                </p>
            </div>

            {}
            <div className="card-premium w-full max-w-md p-6 border-amber-100/50 mb-8">
                <form onSubmit={handleTrackOrder} className="flex flex-col gap-4">
                    <div>
                        <label htmlFor="orderCode" className="block type-label mb-1">
                            Enter your order code
                        </label>
                        <input
                            id="orderCode"
                            type="text"
                            value={orderCode}
                            onChange={(e) => setOrderCode(e.target.value.toUpperCase())}
                            placeholder="e.g., DYP9Q"
                            className="w-full px-4 py-3 text-lg border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-amber-50 transition-all uppercase placeholder:normal-case"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading || !orderCode.trim()}
                        className="w-full bg-amber-600 hover:bg-amber-700 type-btn text-white py-3 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex justify-center items-center"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Tracking...
                            </>
                        ) : (
                            "Track Order"
                        )}
                    </button>
                </form>
            </div>

            {}
            <div className="w-full max-w-2xl transition-all duration-500 ease-in-out">
                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-sm animate-fade-in">
                        <div className="flex">
                            <div className="shrink-0">
                                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-700 font-medium">
                                    {error}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {orderData && (
                    <div className="card-premium overflow-hidden border-amber-100/50 animate-slide-up relative">
                        {}
                        {isLive && (
                           <div className="absolute top-4 right-1/2 translate-x-1/2 sm:translate-x-0 sm:right-6 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-green-600 border border-green-100 shadow-sm flex items-center gap-2 z-10 animate-pulse">
                               <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                               LIVE UPDATES
                           </div>
                        )}
                        {!isLive && (
                             <div className="absolute top-4 right-1/2 translate-x-1/2 sm:translate-x-0 sm:right-6 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-500 border border-gray-100 shadow-sm flex items-center gap-2 z-10">
                               <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                               OFFLINE (Polling)
                           </div>
                        )}
                        
                        {}
                        <div className="bg-amber-600 px-6 py-4 flex justify-between items-center text-white mt-8 sm:mt-0">
                            <div>
                                <p className="text-amber-100 type-label mb-1">Order Code</p>
                                <p className="type-metric font-bold">{orderData.orderCode}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-amber-100 type-label mb-1">Table No</p>
                                <p className="type-metric font-bold">{orderData.tableNumber}</p>
                            </div>
                        </div>

                        {}
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                            <span className="type-body text-gray-600 font-medium">Current Status</span>
                            <span className={`px-4 py-1.5 rounded-full badge-standard border ${getStatusColor(orderData.orderStatus)} shadow-sm transition-all duration-300`}>
                                {orderData.orderStatus}
                            </span>
                        </div>

                        {}
                        <div className="p-6">
                            <h3 className="type-h3 text-gray-800 mb-4 border-b pb-2">Order Items</h3>
                            <div className="space-y-4">
                                {orderData.orderItems.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-amber-100 text-amber-800 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                                                {item.quantity}x
                                            </div>
                                            <div>
                                                <p className="type-body text-gray-800 font-medium">{item.name}</p>
                                            </div>
                                        </div>
                                        {}
                                        {item.lineTotal ? (
                                            <p className="text-gray-600 font-medium">₹{item.lineTotal}</p>
                                        ) : (
                                            <p className="text-gray-600 font-medium">--</p>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {}
                            <div className="mt-8 pt-4 border-t border-gray-100 flex justify-between items-center">
                                <span className="type-h3 text-gray-600">Total Amount</span>
                                <span className="type-metric text-amber-600">₹{orderData.total}</span>
                            </div>
                        </div>

                        <div className="bg-gray-50 px-6 py-3 text-center border-t border-amber-100">
                            <p className="text-xs text-gray-500">Thank you for dining with us!</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
