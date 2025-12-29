import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOrder } from "../../context/OrderContext";
import { useTenant } from "../../context/TenantProvider";

export default function OrderCart() {
    const navigate = useNavigate();
    const { slug } = useTenant();
    const { items, removeItem, updateQuantity, placeOrder, clearOrder } = useOrder();
    const [tableInput, setTableInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.05; 
    const total = subtotal;

    const handlePlaceOrder = async () => {
        if (!tableInput.trim()) {
            setError("Please enter your table number");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const result = await placeOrder(tableInput);
            navigate(`/r/${slug}/track-order?code=${result.orderCode}`);
        } catch (err) {
            console.error("Order failed:", err);
            
            if (err.response?.status === 423) {
                 setError("We are currently not accepting orders. Please ask the staff.");
            } else if (err.response?.status === 400) {
                 setError(err.response.data.message || "Invalid order. Please check your cart.");
            } else {
                 setError(err.message || "Failed to place order. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-amber-100 text-center max-w-sm w-full">
                    <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-4xl">🛒</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Your Cart is Empty</h2>
                    <p className="text-gray-600 mb-6">Looks like you haven't added any delicious dishes yet.</p>
                    <button
                        onClick={() => navigate(`/r/${slug}/menu`)}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                        Browse Menu
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-amber-50 pb-24">
            {/* Header */}
            <div className="bg-white border-b border-amber-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 -ml-2 text-gray-600 hover:text-amber-600 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h1 className="text-xl font-bold text-gray-800">Your Order</h1>
                    <div className="w-8"></div> {/* Spacer for centering */}
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-6">
                {/* Order Items */}
                <div className="space-y-4 mb-8">
                    {items.map((item) => (
                        <div key={item.dishId} className="bg-white rounded-xl p-4 shadow-sm border border-amber-100 flex gap-4 animate-fade-in">
                            {/* Image Thumbnail */}
                            <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                {item.image ? (
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-amber-300 text-2xl">🍽️</div>
                                )}
                            </div>

                            {/* Details */}
                            <div className="flex-1 flex flex-col justify-between">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-gray-800 line-clamp-2">{item.name}</h3>
                                    <button
                                        onClick={() => removeItem(item.dishId)}
                                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="flex justify-between items-end mt-2">
                                    <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200">
                                        <button
                                            onClick={() => updateQuantity(item.dishId, item.quantity - 1)}
                                            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded-l-lg transition-colors"
                                        >
                                            -
                                        </button>
                                        <span className="w-8 text-center font-semibold text-gray-800 text-sm">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.dishId, item.quantity + 1)}
                                            className="w-8 h-8 flex items-center justify-center text-amber-600 hover:bg-amber-100 rounded-r-lg transition-colors"
                                        >
                                            +
                                        </button>
                                    </div>
                                    <span className="font-bold text-amber-600">₹{item.price * item.quantity}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bill Details */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-amber-100 mb-8">
                    <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide opacity-70">Bill Summary</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-gray-600">
                            <span>Item Total</span>
                            <span>₹{subtotal}</span>
                        </div>
                        {/* <div className="flex justify-between text-gray-600">
              <span>Taxes & Charges</span>
              <span>₹0</span>
            </div> */}
                        <div className="border-t border-dashed border-gray-200 my-3 pt-3 flex justify-between items-center">
                            <span className="font-bold text-lg text-gray-800">To Pay</span>
                            <span className="font-bold text-xl text-amber-600">₹{total}</span>
                        </div>
                    </div>
                </div>

                {/* Table Number Input */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-amber-100 mb-8">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                        Table Number <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        value={tableInput}
                        onChange={(e) => setTableInput(e.target.value)}
                        placeholder="Enter your table number (e.g. 5)"
                        className="w-full px-4 py-3 text-lg border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50"
                    />
                    {error && (
                        <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                        </p>
                    )}
                </div>
            </div>

            {/* Fixed Bottom Action */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
                <div className="max-w-3xl mx-auto flex gap-4 items-center">
                    <div className="flex-1">
                        <span className="block text-xs text-gray-500 uppercase font-semibold">Total</span>
                        <span className="block text-xl font-bold text-gray-900">₹{total}</span>
                    </div>
                    <button
                        onClick={handlePlaceOrder}
                        disabled={loading}
                        className={`flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-green-200 transition-all transform hover:-translate-y-0.5 flex justify-center items-center gap-2 ${loading ? 'opacity-75 cursor-wait' : ''}`}
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                Placing Order...
                            </>
                        ) : (
                            <>
                                <span>Place Order</span>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
