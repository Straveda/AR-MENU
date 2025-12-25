import { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";

export default function TrackOrder() {
    const [orderCode, setOrderCode] = useState("");
    const [orderData, setOrderData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [hasSearched, setHasSearched] = useState(false);

    // Status badge colors
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

    // Check for "code" URL param on mount
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        if (code) {
            setOrderCode(code);
            // Trigger track automatically
            // Need to move handleTrackOrder logic to a function that can be called here
            trackOrderInternal(code);
        }
    }, []);

    const trackOrderInternal = async (code) => {
        if (!code) return;
        setLoading(true);
        setError("");
        setOrderData(null);
        setHasSearched(true);
        try {
            const res = await axiosClient.get(`/orders/track/${code}`);
            if (res.data.success) {
                setOrderData(res.data.data);
            }
        } catch (err) {
            console.error("Error tracking order:", err);
            setError(err.response?.data?.message || "Order not found. Please check the code and try again.");
        } finally {
            setLoading(false);
        }
    };

    // Poll for updates every 30 seconds as fallback since we removed sockets
    useEffect(() => {
        if (!orderData) return;
        
        const interval = setInterval(() => {
            trackOrderInternal(orderData.orderCode);
        }, 30000);

        return () => clearInterval(interval);
    }, [orderData?.orderCode]);

    const handleTrackOrder = (e) => {
        e.preventDefault();
        trackOrderInternal(orderCode);
    };

    return (
        <div className="min-h-screen bg-amber-50 px-4 py-8 flex flex-col items-center">
            {/* Header */}
            <div className="text-center mb-10 w-full max-w-2xl">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2 tracking-wide">
                    Track Your Order
                </h1>
                <div className="w-20 h-1 bg-amber-600 mx-auto mb-4"></div>
                <p className="text-gray-600">
                    Enter your unique order code to see the realtime status of your meal.
                </p>
            </div>

            {/* Input Section */}
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 border border-amber-100 mb-8">
                <form onSubmit={handleTrackOrder} className="flex flex-col gap-4">
                    <div>
                        <label htmlFor="orderCode" className="block text-sm font-medium text-gray-700 mb-1">
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
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex justify-center items-center"
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

            {/* Results Section */}
            <div className="w-full max-w-2xl transition-all duration-500 ease-in-out">
                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-sm animate-fade-in">
                        <div className="flex">
                            <div className="flex-shrink-0">
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
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-amber-100 animate-slide-up">
                        {/* Order Header */}
                        <div className="bg-amber-600 px-6 py-4 flex justify-between items-center text-white">
                            <div>
                                <p className="text-amber-100 text-xs uppercase tracking-wider font-semibold">Order Code</p>
                                <p className="text-xl font-bold">{orderData.orderCode}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-amber-100 text-xs uppercase tracking-wider font-semibold">Table No</p>
                                <p className="text-xl font-bold">{orderData.tableNumber}</p>
                            </div>
                        </div>

                        {/* Status Bar */}
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                            <span className="text-gray-600 font-medium">Current Status</span>
                            <span className={`px-4 py-1.5 rounded-full text-sm font-bold border ${getStatusColor(orderData.orderStatus)} shadow-sm`}>
                                {orderData.orderStatus}
                            </span>
                        </div>

                        {/* Order Items */}
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Order Items</h3>
                            <div className="space-y-4">
                                {orderData.orderItems.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-amber-100 text-amber-800 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                                                {item.quantity}x
                                            </div>
                                            <div>
                                                <p className="text-gray-800 font-medium">{item.name}</p>
                                                {/* Optional generic description if needed, or remove */}
                                                {/* <p className="text-gray-500 text-xs">Delicious meal</p> */}
                                            </div>
                                        </div>
                                        {/* If backend sends individual item price calculated or stored */}
                                        {item.lineTotal ? (
                                            <p className="text-gray-600 font-medium">₹{item.lineTotal}</p>
                                        ) : (
                                            <p className="text-gray-600 font-medium">--</p>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Total */}
                            <div className="mt-8 pt-4 border-t border-gray-100 flex justify-between items-center">
                                <span className="text-gray-600 font-bold text-lg">Total Amount</span>
                                <span className="text-2xl font-bold text-amber-600">₹{orderData.total}</span>
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
